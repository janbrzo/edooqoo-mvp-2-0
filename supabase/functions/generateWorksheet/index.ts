import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';
import { isValidUUID, sanitizeInput, validatePrompt } from './security.ts';
import { RateLimiter } from './rateLimiter.ts';
import { getGeolocation } from './geolocation.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimiter = new RateLimiter();

// Function to generate complete HTML for worksheet
function generateCompleteWorksheetHTML(worksheetData: any, viewMode: 'student' | 'teacher' = 'student'): string {
  const title = worksheetData.title || 'English Worksheet';
  
  // Generate exercises HTML
  let exercisesHTML = '';
  worksheetData.exercises?.forEach((exercise: any, index: number) => {
    const exerciseNumber = index + 1;
    
    exercisesHTML += `
    <div class="exercise-section mb-8 p-6 bg-white rounded-lg border border-gray-200">
      <div class="exercise-header mb-4">
        <h3 class="text-xl font-semibold text-gray-800 mb-2">
          <i class="fas ${exercise.icon || 'fa-pencil-alt'} mr-2 text-blue-600"></i>
          Exercise ${exerciseNumber}: ${exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
        </h3>
        <div class="flex items-center text-sm text-gray-600 mb-2">
          <i class="fas fa-clock mr-1"></i>
          <span>${exercise.time || 5} minutes</span>
        </div>
        <p class="text-gray-700 font-medium">${exercise.instructions || ''}</p>
      </div>
      
      <div class="exercise-content">`;
    
    // Add specific content based on exercise type
    if (exercise.type === 'reading') {
      exercisesHTML += `
        <div class="reading-content mb-6">
          <div class="prose max-w-none">
            ${exercise.content?.split('\n').map((paragraph: string) => 
              paragraph.trim() ? `<p class="mb-4">${paragraph}</p>` : ''
            ).join('') || ''}
          </div>
        </div>
        <div class="questions">
          <h4 class="font-semibold mb-3">Questions:</h4>`;
      
      exercise.questions?.forEach((q: any, qIndex: number) => {
        exercisesHTML += `
          <div class="question mb-4">
            <p class="font-medium mb-2">${qIndex + 1}. ${q.text}</p>
            ${viewMode === 'teacher' ? `<p class="text-sm text-gray-600 italic">Answer: ${q.answer}</p>` : ''}
          </div>`;
      });
      
      exercisesHTML += `</div>`;
      
    } else if (exercise.type === 'matching') {
      exercisesHTML += `
        <div class="matching-items grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold mb-3">Terms:</h4>`;
      
      exercise.items?.forEach((item: any, itemIndex: number) => {
        exercisesHTML += `<p class="mb-2">${itemIndex + 1}. ${item.term}</p>`;
      });
      
      exercisesHTML += `
          </div>
          <div>
            <h4 class="font-semibold mb-3">Definitions:</h4>`;
      
      const shuffledDefinitions = exercise.items?.map((item: any, index: number) => ({
        definition: item.definition,
        originalIndex: index
      })) || [];
      
      shuffledDefinitions.forEach((item: any, itemIndex: number) => {
        exercisesHTML += `<p class="mb-2">${String.fromCharCode(65 + itemIndex)}. ${item.definition}</p>`;
      });
      
      exercisesHTML += `</div></div>`;
      
      if (viewMode === 'teacher') {
        exercisesHTML += `
          <div class="answers mt-4 p-3 bg-gray-50 rounded">
            <h4 class="font-semibold mb-2">Answers:</h4>`;
        
        exercise.items?.forEach((item: any, itemIndex: number) => {
          exercisesHTML += `<p class="text-sm">${itemIndex + 1} - ${String.fromCharCode(65 + itemIndex)}</p>`;
        });
        
        exercisesHTML += `</div>`;
      }
      
    } else if (exercise.type === 'fill-in-blanks') {
      if (exercise.word_bank) {
        exercisesHTML += `
          <div class="word-bank mb-6 p-4 bg-gray-50 rounded">
            <h4 class="font-semibold mb-3">Word Bank:</h4>
            <div class="flex flex-wrap gap-2">`;
        
        exercise.word_bank.forEach((word: string) => {
          exercisesHTML += `<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${word}</span>`;
        });
        
        exercisesHTML += `</div></div>`;
      }
      
      exercisesHTML += `<div class="sentences">`;
      
      exercise.sentences?.forEach((sentence: any, sIndex: number) => {
        const sentenceWithBlank = sentence.text.replace('_____', '________');
        exercisesHTML += `
          <div class="sentence mb-4">
            <p class="mb-2">${sIndex + 1}. ${sentenceWithBlank}</p>
            ${viewMode === 'teacher' ? `<p class="text-sm text-gray-600 italic">Answer: ${sentence.answer}</p>` : ''}
          </div>`;
      });
      
      exercisesHTML += `</div>`;
      
    } else if (exercise.type === 'multiple-choice') {
      exercisesHTML += `<div class="questions">`;
      
      exercise.questions?.forEach((question: any, qIndex: number) => {
        exercisesHTML += `
          <div class="question mb-6">
            <p class="font-medium mb-3">${qIndex + 1}. ${question.text}</p>
            <div class="options ml-4">`;
        
        question.options?.forEach((option: any) => {
          const isCorrect = viewMode === 'teacher' && option.correct;
          exercisesHTML += `
            <p class="mb-2 ${isCorrect ? 'font-semibold text-green-600' : ''}">
              ${option.label}. ${option.text}
            </p>`;
        });
        
        exercisesHTML += `</div></div>`;
      });
      
      exercisesHTML += `</div>`;
      
    } else if (exercise.type === 'dialogue') {
      exercisesHTML += `
        <div class="dialogue mb-6">
          <div class="dialogue-lines">`;
      
      exercise.dialogue?.forEach((line: any) => {
        exercisesHTML += `
          <div class="dialogue-line mb-3 p-3 ${line.speaker === 'Customer' ? 'bg-blue-50' : 'bg-green-50'} rounded">
            <span class="font-semibold">${line.speaker}:</span> ${line.text}
          </div>`;
      });
      
      exercisesHTML += `
          </div>
        </div>
        <div class="expressions">
          <h4 class="font-semibold mb-3">Useful Expressions:</h4>
          <ul class="list-disc ml-6">`;
      
      exercise.expressions?.forEach((expr: string) => {
        exercisesHTML += `<li class="mb-1">${expr}</li>`;
      });
      
      exercisesHTML += `</ul></div>`;
      
    } else if (exercise.type === 'true-false') {
      exercisesHTML += `<div class="statements">`;
      
      exercise.statements?.forEach((statement: any, sIndex: number) => {
        exercisesHTML += `
          <div class="statement mb-4">
            <p class="mb-2">${sIndex + 1}. ${statement.text}</p>
            ${viewMode === 'teacher' ? `<p class="text-sm text-gray-600 italic">Answer: ${statement.isTrue ? 'True' : 'False'}</p>` : ''}
          </div>`;
      });
      
      exercisesHTML += `</div>`;
      
    } else if (exercise.type === 'discussion') {
      exercisesHTML += `
        <div class="questions">
          <ul class="space-y-3">`;
      
      exercise.questions?.forEach((question: any, qIndex: number) => {
        exercisesHTML += `<li class="flex items-start"><span class="font-medium mr-2">${qIndex + 1}.</span> <span>${question.text}</span></li>`;
      });
      
      exercisesHTML += `</ul></div>`;
      
    } else if (exercise.type === 'error-correction') {
      exercisesHTML += `<div class="sentences">`;
      
      exercise.sentences?.forEach((sentence: any, sIndex: number) => {
        exercisesHTML += `
          <div class="sentence mb-4">
            <p class="mb-2">${sIndex + 1}. ${sentence.text}</p>
            ${viewMode === 'teacher' ? `<p class="text-sm text-gray-600 italic">Correction: ${sentence.correction}</p>` : ''}
          </div>`;
      });
      
      exercisesHTML += `</div>`;
    }
    
    // Add teacher tip if present and in teacher mode
    if (viewMode === 'teacher' && exercise.teacher_tip) {
      exercisesHTML += `
        <div class="teacher-tip mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <h5 class="font-semibold text-yellow-800 mb-2">Teacher Tip:</h5>
          <p class="text-yellow-700 text-sm">${exercise.teacher_tip}</p>
        </div>`;
    }
    
    exercisesHTML += `
      </div>
    </div>`;
  });
  
  // Generate vocabulary section if present
  let vocabularyHTML = '';
  if (worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0) {
    vocabularyHTML = `
      <div class="vocabulary-section mt-8 p-6 bg-white rounded-lg border border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-book mr-2 text-purple-600"></i>
          Vocabulary Sheet
        </h3>
        <div class="vocabulary-grid grid grid-cols-1 md:grid-cols-2 gap-4">`;
    
    worksheetData.vocabulary_sheet.forEach((vocab: any) => {
      vocabularyHTML += `
        <div class="vocab-item p-3 bg-gray-50 rounded">
          <span class="font-semibold text-gray-800">${vocab.term}:</span>
          <span class="text-gray-700"> ${vocab.meaning}</span>
        </div>`;
    });
    
    vocabularyHTML += `
        </div>
      </div>`;
  }
  
  // Generate grammar rules if present
  let grammarHTML = '';
  if (worksheetData.grammar_rules) {
    grammarHTML = `
      <div class="grammar-section mt-8 p-6 bg-white rounded-lg border border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-graduation-cap mr-2 text-green-600"></i>
          ${worksheetData.grammar_rules.title}
        </h3>
        <div class="grammar-intro mb-6">
          <p class="text-gray-700">${worksheetData.grammar_rules.introduction}</p>
        </div>
        <div class="grammar-rules">`;
    
    worksheetData.grammar_rules.rules?.forEach((rule: any, rIndex: number) => {
      grammarHTML += `
        <div class="rule mb-6 p-4 bg-gray-50 rounded">
          <h4 class="font-semibold text-gray-800 mb-2">${rIndex + 1}. ${rule.title}</h4>
          <p class="text-gray-700 mb-3">${rule.explanation}</p>
          <div class="examples">
            <h5 class="font-medium text-gray-800 mb-2">Examples:</h5>
            <ul class="list-disc ml-6">`;
      
      rule.examples?.forEach((example: string) => {
        grammarHTML += `<li class="text-gray-700 mb-1">${example}</li>`;
      });
      
      grammarHTML += `
            </ul>
          </div>
        </div>`;
    });
    
    grammarHTML += `
        </div>
      </div>`;
  }
  
  // Complete HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${viewMode === 'teacher' ? 'Teacher' : 'Student'} Version</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Tailwind-like base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6; 
            color: #374151; 
            background: #f9fafb; 
            padding: 20px; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 2rem; 
            font-weight: 700; 
            margin-bottom: 8px; 
        }
        .header p { 
            font-size: 1.1rem; 
            opacity: 0.9; 
        }
        .content { 
            padding: 30px; 
        }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mt-4 { margin-top: 16px; }
        .mt-8 { margin-top: 32px; }
        .ml-4 { margin-left: 16px; }
        .ml-6 { margin-left: 24px; }
        .mr-1 { margin-right: 4px; }
        .mr-2 { margin-right: 8px; }
        .p-3 { padding: 12px; }
        .p-4 { padding: 16px; }
        .p-6 { padding: 24px; }
        .px-3 { padding-left: 12px; padding-right: 12px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .text-sm { font-size: 0.875rem; }
        .text-xl { font-size: 1.25rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-gray-600 { color: #6b7280; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-blue-600 { color: #2563eb; }
        .text-blue-800 { color: #1e40af; }
        .text-green-600 { color: #16a34a; }
        .text-purple-600 { color: #9333ea; }
        .text-yellow-700 { color: #a16207; }
        .text-yellow-800 { color: #92400e; }
        .bg-white { background-color: white; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-blue-100 { background-color: #dbeafe; }
        .bg-green-50 { background-color: #f0fdf4; }
        .bg-yellow-50 { background-color: #fefce8; }
        .border { border: 1px solid #e5e7eb; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-l-4 { border-left: 4px solid; }
        .border-yellow-400 { border-color: #facc15; }
        .rounded { border-radius: 4px; }
        .rounded-lg { border-radius: 8px; }
        .rounded-full { border-radius: 9999px; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .space-y-3 > * + * { margin-top: 12px; }
        .list-disc { list-style-type: disc; }
        .italic { font-style: italic; }
        .prose { max-width: none; }
        .prose p { margin-bottom: 16px; }
        
        @media (min-width: 768px) {
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .header { background: #4f46e5 !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${viewMode === 'teacher' ? 'Teacher Version' : 'Student Version'}</p>
            ${worksheetData.subtitle ? `<p style="margin-top: 8px; font-size: 1rem;">${worksheetData.subtitle}</p>` : ''}
        </div>
        
        <div class="content">
            ${worksheetData.introduction ? `
            <div class="introduction mb-8 p-6 bg-gray-50 rounded-lg">
                <h2 class="text-xl font-semibold mb-3">Introduction</h2>
                <p class="text-gray-700">${worksheetData.introduction}</p>
            </div>
            ` : ''}
            
            ${grammarHTML}
            
            <div class="exercises">
                ${exercisesHTML}
            </div>
            
            ${vocabularyHTML}
        </div>
    </div>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Start generation time measurement
  const generationStartTime = Date.now();

  try {
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
    
    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return new Response(
        JSON.stringify({ error: promptValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced rate limiting with multi-tier limits
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geolocation data
    const geoData = await getGeolocation(ip);
    console.log(`🌍 Geolocation result: ${JSON.stringify(geoData)}`);

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Check if grammarFocus is provided in the prompt
    const hasGrammarFocus = sanitizedPrompt.includes('grammarFocus:');
    const grammarFocusMatch = sanitizedPrompt.match(/grammarFocus:\s*(.+?)(?:\n|$)/);
    const grammarFocus = grammarFocusMatch ? grammarFocusMatch[1].trim() : null;

    // Determine exercise count - always generate 8, then trim if needed
    let finalExerciseCount = 8; // Always generate 8 exercises
    if (sanitizedPrompt.includes('45 min')) {
      finalExerciseCount = 6; // Will trim to 6 after generation
    } else if (sanitizedPrompt.includes('30 min')) {
      // Convert 30 min to 45 min (remove 30 min option)
      finalExerciseCount = 6;
    }
    
    // Always use the full 8-exercise set for generation
    const exerciseTypes = getExerciseTypesForCount(8);
    
    console.log(`Generating 8 exercises, will trim to ${finalExerciseCount} if needed`);
    
    // CREATE SYSTEM MESSAGE with Golden Prompt content
    const systemMessage = `You are an expert ESL English language teacher specialized in creating context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

          CRITICAL RULES AND REQUIREMENTS:
1. Create EXACTLY 8 exercises. No fewer, no more. Number them Exercise 1 through Exercise 8.
2. Use EXACTLY these exercise types in this EXACT ORDER: reading, matching, fill-in-blanks, multiple-choice, dialogue, true-false, discussion, error-correction
3. All exercises should be closely related to the specified topic and goal
4. Include specific vocabulary, expressions, and language structures related to the topic.
5. Keep exercise instructions clear and concise. Students should understand tasks without additional explanation.
6. DO NOT USE PLACEHOLDERS. Write full, complete, high-quality content for every field.
7. Use appropriate time values for each exercise (5-10 minutes).
8. DO NOT include any text outside of the JSON structure.
9. Exercise 1 (Reading Comprehension) MUST have content more than 280 words.
10. Focus on overall flow, coherence and pedagogical value.
11. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale.

${hasGrammarFocus ? `
12. GRAMMAR FOCUS REQUIREMENT: The user has specified a grammar focus: "${grammarFocus}". You MUST:
    - Include a "grammar_rules" section in the JSON with detailed explanation of this grammar topic
    - Design ALL exercises to practice and reinforce this specific grammar point
    - Ensure the reading text, vocabulary, and all exercises incorporate examples of this grammar
    - Make this grammar topic the central pedagogical focus of the entire worksheet
    -provide a detailed and comprehensive explanation about the grammatical topic, including a thorough introduction explaining its usage, importance, and general overview, written in the style of well-known grammar reference books (such as My Grammar Lab, Cambridge Grammar, or Virginia Evans).
` : `
12. NO GRAMMAR FOCUS: The user has not specified a grammar focus, so create a general worksheet focused on the topic and goal without emphasizing any particular grammar point.
`}

13. Generate a structured JSON worksheet with this EXACT format:

{
  "title": "In a restaurant",
  "subtitle": "Making a complaint about your dish in a restaurant: adjectives practice",
  "introduction": "In this lesson, you'll practice a restaurant role-play, learn how to order food, and make a complaint about an incorrect order. You'll also review grammar related to adjectives in their comparative and superlative forms.",
  ${hasGrammarFocus ? `"grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Adjectives are words that describe or modify nouns, providing information about qualities such as size, color, shape, age, and many others. When we want to compare people, objects, or ideas, we use adjectives in their comparative or superlative forms.\\n\\nComparatives are used to compare two things or people, showing that one has a higher or lower degree of a particular quality than the other. For example, when saying \\"John is taller than Mike,\\" the adjective \\"taller\\" is in the comparative form, indicating a comparison between two individuals. Comparatives are often followed by the word \\"than\\" to introduce the second element of comparison.\\n\\nSuperlatives, on the other hand, are used to describe the extreme or highest degree of a quality among three or more things or people. For example, \\"Anna is the tallest in her class\\" uses the superlative form \\"tallest\\" to indicate that Anna has the greatest height compared to all others in the group. Superlatives are usually preceded by the definite article \\"the\\".\\n\\nThe formation of comparatives and superlatives depends largely on the length and ending of the adjective. One-syllable adjectives usually form comparatives and superlatives by adding the suffixes \\"-er\\" and \\"-est\\". For adjectives with two syllables or more, especially those with three or more syllables, the words \\"more\\" and \\"most\\" are used before the adjective instead of adding suffixes.\\n\\nSome adjectives have irregular comparative and superlative forms that must be memorized as they do not follow standard patterns. For instance, \\"good\\" becomes \\"better\\" (comparative) and \\"best\\" (superlative).\\n\\nIn addition to indicating comparisons of difference, adjectives can also be used to express equality, using the structure \\"as + adjective + as\\" to show that two things share the same degree of a quality.\\n\\nUnderstanding and correctly using comparatives and superlatives is essential for effective communication, enabling speakers and writers to accurately compare qualities and express degrees of difference or similarity.",
    "rules": [
      {
        "title": "Forming Comparatives for One-Syllable Adjectives",
        "explanation": "Most one-syllable adjectives form their comparative by adding the suffix \\"-er\\" to the base adjective. If the adjective ends with a single consonant preceded by a single vowel, double the consonant before adding \\"-er\\". When the adjective ends with \\"-e\\", just add \\"-r\\".",
        "examples": ["tall → taller", "big → bigger", "nice → nicer"]
      },
      {
        "title": "Forming Superlatives for One-Syllable Adjectives",
        "explanation": "One-syllable adjectives form the superlative by adding the suffix \\"-est\\" to the base adjective. Similar spelling rules apply as with comparatives.",
        "examples": ["tall → tallest", "big → biggest", "nice → nicest"]
      },
      {
        "title": "Forming Comparatives and Superlatives for Adjectives with Two or More Syllables",
        "explanation": "Adjectives with two or more syllables generally form comparatives and superlatives by using \\"more\\" before the adjective for comparatives, and \\"most\\" before the adjective for superlatives. Some two-syllable adjectives can also take \\"-er\\" and \\"-est\\" if they end with \\"-y\\" or certain other endings.",
        "examples": ["beautiful → more beautiful → most beautiful", "careful → more careful → most careful", "happy → happier → happiest"]
      },
      {
        "title": "Irregular Comparatives and Superlatives",
        "explanation": "Some adjectives have irregular forms that do not follow the usual patterns and must be memorized. These are common and important adjectives.",
        "examples": ["good → better → best", "bad → worse → worst", "far → farther/further → farthest/furthest"]
      },
      {
        "title": "Using \\"than\\" in Comparatives",
        "explanation": "Comparative adjectives are usually followed by \\"than\\" to introduce the second element being compared.",
        "examples": ["She is taller than her brother.", "This book is more interesting than the last one."]
      },
      {
        "title": "Using \\"the\\" with Superlatives",
        "explanation": "Superlative adjectives are usually preceded by the definite article \\"the\\" to show that one thing is the highest or lowest in a group.",
        "examples": ["He is the fastest runner in the team.", "This is the most expensive restaurant in town."]
      },
      {
        "title": "Comparing Equality with \\"as...as\\"",
        "explanation": "To show that two things are equal in some quality, use the structure \\"as + adjective + as\\".",
        "examples": ["She is as tall as her sister.", "This test is as difficult as the last one."]
      }
    ]
  },` : ''}
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 9,
      "instructions": "Read the following text and answer the questions below.",
      "content": "New York City is famous for its restaurants. People from all over the world live there, so the city offers many different types of food. You can find Italian, Chinese, Mexican, Japanese, Greek, Thai, Indian, and many more international cuisines. American-style diners and fast food restaurants are also very popular.\\nMost restaurants in New York have menus that include appetizers, main dishes, and desserts. Appetizers are small dishes that people eat before the main meal, such as soups, salads, or garlic bread. Main dishes are usually bigger and include meat, fish, or vegetarian options, often served with rice, potatoes, or pasta. Desserts like cheesecake, brownies, or ice cream are very common.\\nSome of the most popular types of food in New York include pizza, burgers, sushi, and pasta. People also enjoy trying food from food trucks, especially for lunch. One of the most famous dishes in the United States, and especially in New York, is the New York-style pizza. It's a thin, wide slice of pizza, usually eaten with your hands.\\nOf course, not every restaurant visit is perfect. Some common complaints that people make in New York restaurants include:\\n"The food is cold."\\n"This is not what I ordered."\\n"The portion is too small."\\n"I waited too long for my food."\\n"The bill is incorrect."\\nLearning how to order food and make polite complaints in English is very useful if you ever visit New York or work in customer service.",
      "questions": [
        {"text": "Why is there such a wide variety of food in New York City restaurants?", "answer": "Because people from all over the world live in New York, so the city offers many different types of international cuisine."},
        {"text": "What are some typical examples of appetizers, main dishes, and desserts mentioned in the text?", "answer": "Appetizers: soups, salads, garlic bread; Main dishes: meat, fish, or vegetarian options with rice, potatoes, or pasta; Desserts: cheesecake, brownies, ice cream."},
        {"text": "What is special about New York-style pizza?", "answer": "It is a thin, wide slice of pizza, usually eaten with your hands."},
        {"text": "What are some of the most popular international cuisines in New York?", "answer": "Italian, Chinese, Mexican, Japanese, Greek, Thai, and Indian cuisines."},
        {"text": "What are some common complaints that customers make in New York restaurants?", "answer": "The food is cold, This is not what I ordered, The portion is too small, I waited too long for my food, and The bill is incorrect."}
      ],
      "teacher_tip": "Use the comprehension questions as a starting point to ask more personal questions related to your student's life and experiences. Encourage them to share their opinions on the topics and situations mentioned in the text."
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Appetizer", "definition": "A small dish served before the main course to stimulate the appetite."},
        {"term": "Cuisine", "definition": "A style or method of cooking, especially as characteristic of a particular country or region."},
        {"term": "Portion", "definition": "The amount of food served to one person at a meal."},
        {"term": "Incorrect", "definition": "Not accurate or wrong; used especially in the context of errors with orders or bills."},
        {"term": "Complaint", "definition": "A statement that something is wrong or not satisfactory, especially in service or quality."},
        {"term": "Fine dining", "definition": "A high-end, expensive restaurant experience offering exceptional food, service, and atmosphere."},
        {"term": "Reservation", "definition": "An arrangement made in advance to secure a table at a restaurant."},
        {"term": "Signature dish", "definition": "A unique or famous meal that represents a restaurant or chef's style."},
        {"term": "Undercooked", "definition": "Food that has not been cooked long enough and may be unsafe or unpleasant to eat."},
        {"term": "Customer service", "definition": "The assistance and advice provided by a restaurant or business to people who use its services."}
      ],
      "teacher_tip": "Before the matching activity, introduce and pronounce each term to ensure students feel confident recognizing and understanding them. If needed, translate the most difficult or abstract vocabulary terms into the student's native language. After the exercise, assign students a follow-up task to write 10 original sentences using the new vocabulary."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Appetizer", "meaning": "A small dish served before the main meal to stimulate the appetite."},
    {"term": "Main course", "meaning": "The primary or largest dish in a meal."},
    {"term": "Dessert", "meaning": "A sweet course served at the end of a meal."},
    {"term": "Beverage", "meaning": "A drink, especially one other than water."},
    {"term": "Reservation", "meaning": "An arrangement to have a table kept for you at a restaurant."},
    {"term": "Waiter / Waitress", "meaning": "A person who serves customers in a restaurant."},
    {"term": "Menu", "meaning": "A list of dishes available at a restaurant."},
    {"term": "Order", "meaning": "A request for food or drink in a restaurant."},
    {"term": "Complaint", "meaning": "An expression of dissatisfaction about food or service."},
    {"term": "Wrong order", "meaning": "When the dish served is not what the customer requested."},
    {"term": "Overcooked", "meaning": "Food that has been cooked for too long and is ruined."},
    {"term": "Undercooked", "meaning": "Food that has not been cooked enough."},
    {"term": "Allergy", "meaning": "A harmful reaction to certain foods or ingredients."},
    {"term": "Bill / Check", "meaning": "A statement of the money owed for the meal."},
    {"term": "Tip", "meaning": "An extra amount of money given to the waiter as a thank you for good service."}
  ]
}

CRITICAL REQUIREMENTS VERIFICATION:
1. Exercise 1 (reading): Content MUST be 280-320 words. Count words carefully.
2. Exercise 2 (matching): EXACTLY 10 items to match.
3. Exercise 3 (fill-in-blanks): EXACTLY 10 sentences and 10 words in word bank.
4. Exercise 4 (multiple-choice): EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other – no duplicates or similar variations allowed. Only one option per question is correct.
5. Exercise 5 (dialogue): AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions.
6. Exercise 6 (true-false): EXACTLY 10 statements.
7. Exercise 7 (discussion): EXACTLY 10 discussion questions.
8. Exercise 8 (error-correction): EXACTLY 10 sentences with errors.
9. Vocabulary sheet: EXACTLY 15 terms with definitions.
${hasGrammarFocus ? `10. Grammar Rules: Must include exactly 7 grammar rules with title, explanation, and 3 examples each.` : ''}

RETURN ONLY VALID JSON. NO MARKDOWN. NO ADDITIONAL TEXT.`;

    // Generate worksheet using OpenAI with complete prompt structure
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Changed back to GPT-4o
      temperature: 0.2, // 
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: sanitizedPrompt
        }
      ],
      max_tokens: 6500
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse the JSON response with error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Validate we got exactly 8 exercises
      if (worksheetData.exercises.length !== 8) {
        console.warn(`Expected 8 exercises but got ${worksheetData.exercises.length}`);
        throw new Error(`Generated ${worksheetData.exercises.length} exercises instead of required 8`);
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Trim exercises if needed for 45 min lessons
      if (finalExerciseCount === 6) {
        worksheetData.exercises = worksheetData.exercises.slice(0, 6);
        console.log(`Trimmed exercises to ${worksheetData.exercises.length} for 45 min lesson`);
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`Final exercise count: ${worksheetData.exercises.length} (target: ${finalExerciseCount})`);
      console.log(`Grammar Rules included: ${!!worksheetData.grammar_rules}`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate generation time
    const generationEndTime = Date.now();
    const generationTimeSeconds = Math.round((generationEndTime - generationStartTime) / 1000);

    // Generate complete HTML for the worksheet
    const fullHTML = generateCompleteWorksheetHTML(worksheetData, 'student');
    console.log(`📝 Generated complete HTML, length: ${fullHTML.length} characters`);

    // Save worksheet to database with FULL PROMPT (SYSTEM + USER) and COMPLETE HTML
    try {
      // CREATE FULL PROMPT - this is what should be saved to database
      const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
      
      // Sanitize form data
      const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
      
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: fullPrompt, // NOW SAVING FULL PROMPT (SYSTEM + USER)
          p_form_data: sanitizedFormData,
          p_ai_response: jsonContent?.substring(0, 50000) || '', // Limit response size
          p_html_content: fullHTML, // NOW SAVING COMPLETE HTML instead of JSON
          p_user_id: userId || null,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet', // Limit title length
          p_generation_time_seconds: generationTimeSeconds,
          p_country: geoData.country || null,
          p_city: geoData.city || null
        }
      );

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
      } else {
        console.log('✅ Worksheet saved successfully with full HTML content');
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        worksheetData.worksheetId = worksheetId; // Add for compatibility
        console.log('Worksheet generated and saved successfully with ID:', worksheetId);
        console.log(`Generation time: ${generationTimeSeconds} seconds`);
        console.log(`Geo data: ${geoData.country || 'unknown'}, ${geoData.city || 'unknown'}`);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
