
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, getExerciseTypesForMissing, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security utilities
function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }
  
  if (prompt.length < 10) {
    return { isValid: false, error: 'Prompt must be at least 10 characters long' };
  }
  
  if (prompt.length > 5000) {
    return { isValid: false, error: 'Prompt must be less than 5000 characters' };
  }
  
  return { isValid: true };
}

// Geolocation utility
async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  try {
    // Use a simple IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null
      };
    }
  } catch (error) {
    console.warn('Failed to get geolocation:', error);
  }
  
  return {};
}

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 5, windowMs: number = 300000): boolean { // 5 requests per 5 minutes
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

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

    // Rate limiting
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geolocation data
    const geoData = await getGeolocation(ip);

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
9. Exercise 1 (Reading Comprehension) MUST have content between 280 and 320 words exactly.
10. Focus on overall flow, coherence and pedagogical value.
11. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale.

${hasGrammarFocus ? `
12. GRAMMAR FOCUS REQUIREMENT: The user has specified a grammar focus: "${grammarFocus}". You MUST:
    - Include a "grammar_rules" section in the JSON with detailed explanation of this grammar topic
    - Design ALL exercises to practice and reinforce this specific grammar point
    - Ensure the reading text, vocabulary, and all exercises incorporate examples of this grammar
    - Make this grammar topic the central pedagogical focus of the entire worksheet
` : `
12. NO GRAMMAR FOCUS: The user has not specified a grammar focus, so create a general worksheet focused on the topic and goal without emphasizing any particular grammar point.
`}

13. Generate a structured JSON worksheet with this EXACT format:

{
  "title": "Compelling worksheet title that matches the lesson topic",
  "subtitle": "Engaging subtitle that describes the specific focus and grammar practice",
  "introduction": "Brief, professional introduction paragraph about the worksheet topic, goals, and what students will practice. Keep it engaging and clear.",
  ${hasGrammarFocus ? `"grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Comprehensive explanation of the grammar topic in the style of well-known grammatical coursebooks. Explain the concept clearly, when it's used, and provide context for learning. This should be detailed enough for students to understand the rules and for teachers to use as reference material.",
    "rules": [
      {
        "title": "First Grammar Rule Title",
        "explanation": "Detailed explanation of the first grammar rule with clear context and usage information",
        "examples": ["Example 1 showing the rule in context", "Example 2 demonstrating proper usage", "Example 3 with practical application"]
      },
      {
        "title": "Second Grammar Rule Title", 
        "explanation": "Detailed explanation of the second grammar rule with clear context and usage information",
        "examples": ["Example 1 showing the rule in context", "Example 2 demonstrating proper usage", "Example 3 with practical application"]
      },
      {
        "title": "Third Grammar Rule Title",
        "explanation": "Detailed explanation of the third grammar rule with clear context and usage information",
        "examples": ["Example 1 showing the rule in context", "Example 2 demonstrating proper usage", "Example 3 with practical application"]
      }
    ]
  },` : ''}
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text and answer the questions below.",
      "content": "Write a compelling, contextual text of exactly 280-320 words that relates directly to the lesson topic and goal. If grammar focus is specified, include multiple examples of that grammar point naturally integrated into the text. The text should be engaging, informative, and appropriate for the specified English level. Include realistic scenarios, practical vocabulary, and cultural context where relevant.",
      "questions": [
        {"text": "Thoughtful comprehension question 1 about the text content", "answer": "Complete, accurate answer based on the text"},
        {"text": "Thoughtful comprehension question 2 about the text content", "answer": "Complete, accurate answer based on the text"},
        {"text": "Thoughtful comprehension question 3 about the text content", "answer": "Complete, accurate answer based on the text"},
        {"text": "Thoughtful comprehension question 4 about the text content", "answer": "Complete, accurate answer based on the text"},
        {"text": "Thoughtful comprehension question 5 about the text content", "answer": "Complete, accurate answer based on the text"}
      ],
      "teacher_tip": "Practical, actionable advice for teachers on how to use this exercise effectively in a 1-on-1 lesson. Include suggestions for extension activities, common student difficulties, or ways to personalize the content."
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Relevant vocabulary term 1", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 2", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 3", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 4", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 5", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 6", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 7", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 8", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 9", "definition": "Clear, accurate definition that students can understand"},
        {"term": "Relevant vocabulary term 10", "definition": "Clear, accurate definition that students can understand"}
      ],
      "teacher_tip": "Practical, actionable advice for teachers on how to use this exercise effectively. Include pronunciation tips, ways to check understanding, or follow-up activities."
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
      "sentences": [
        {"text": "Contextual sentence with meaningful _____ blank that reinforces the lesson topic.", "answer": "word1"},
        {"text": "Another contextual sentence with _____ that practices key vocabulary.", "answer": "word2"},
        {"text": "Third meaningful sentence with a _____ that connects to the grammar focus if applicable.", "answer": "word3"},
        {"text": "Fourth sentence with _____ that provides realistic language practice.", "answer": "word4"},
        {"text": "Fifth sentence that needs a _____ and relates to the lesson goal.", "answer": "word5"},
        {"text": "Sixth contextual sentence with _____ for comprehensive practice.", "answer": "word6"},
        {"text": "Seventh sentence with _____ word that reinforces learning objectives.", "answer": "word7"},
        {"text": "Eighth sentence that requires a _____ and maintains topic coherence.", "answer": "word8"},
        {"text": "Ninth sentence with a _____ blank that provides varied practice.", "answer": "word9"},
        {"text": "Tenth sentence with a _____ that completes the exercise comprehensively.", "answer": "word10"}
      ],
      "teacher_tip": "Practical guidance for teachers on using this exercise effectively. Suggest ways to extend the activity or check student understanding."
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "Contextual question that tests understanding of key concepts or grammar?",
          "options": [
            {"label": "A", "text": "Plausible but incorrect option A", "correct": false},
            {"label": "B", "text": "Correct answer that demonstrates proper usage", "correct": true},
            {"label": "C", "text": "Plausible but incorrect option C", "correct": false},
            {"label": "D", "text": "Plausible but incorrect option D", "correct": false}
          ]
        },
        {
          "text": "Second question that builds on the lesson topic?",
          "options": [
            {"label": "A", "text": "Correct answer demonstrating mastery", "correct": true},
            {"label": "B", "text": "Common mistake or distractor B", "correct": false},
            {"label": "C", "text": "Common mistake or distractor C", "correct": false},
            {"label": "D", "text": "Common mistake or distractor D", "correct": false}
          ]
        },
        {
          "text": "Third question focusing on practical application?",
          "options": [
            {"label": "A", "text": "Incorrect but tempting option A", "correct": false},
            {"label": "B", "text": "Incorrect but tempting option B", "correct": false},
            {"label": "C", "text": "Correct answer showing proper understanding", "correct": true},
            {"label": "D", "text": "Incorrect but tempting option D", "correct": false}
          ]
        },
        {
          "text": "Fourth question testing grammar or vocabulary mastery?",
          "options": [
            {"label": "A", "text": "Distractor option A", "correct": false},
            {"label": "B", "text": "Correct answer demonstrating competence", "correct": true},
            {"label": "C", "text": "Distractor option C", "correct": false},
            {"label": "D", "text": "Distractor option D", "correct": false}
          ]
        },
        {
          "text": "Fifth question reinforcing key learning objectives?",
          "options": [
            {"label": "A", "text": "Incorrect but logical option A", "correct": false},
            {"label": "B", "text": "Incorrect but logical option B", "correct": false},
            {"label": "C", "text": "Incorrect but logical option C", "correct": false},
            {"label": "D", "text": "Correct answer showing mastery", "correct": true}
          ]
        },
        {
          "text": "Sixth question testing contextual understanding?",
          "options": [
            {"label": "A", "text": "Correct answer in proper context", "correct": true},
            {"label": "B", "text": "Plausible but incorrect option B", "correct": false},
            {"label": "C", "text": "Plausible but incorrect option C", "correct": false},
            {"label": "D", "text": "Plausible but incorrect option D", "correct": false}
          ]
        },
        {
          "text": "Seventh question building on previous learning?",
          "options": [
            {"label": "A", "text": "Common error or misconception A", "correct": false},
            {"label": "B", "text": "Common error or misconception B", "correct": false},
            {"label": "C", "text": "Correct answer showing progress", "correct": true},
            {"label": "D", "text": "Common error or misconception D", "correct": false}
          ]
        },
        {
          "text": "Eighth question testing practical application?",
          "options": [
            {"label": "A", "text": "Tempting but wrong option A", "correct": false},
            {"label": "B", "text": "Correct answer in realistic context", "correct": true},
            {"label": "C", "text": "Tempting but wrong option C", "correct": false},
            {"label": "D", "text": "Tempting but wrong option D", "correct": false}
          ]
        },
        {
          "text": "Ninth question reinforcing understanding?",
          "options": [
            {"label": "A", "text": "Logical but incorrect option A", "correct": false},
            {"label": "B", "text": "Logical but incorrect option B", "correct": false},
            {"label": "C", "text": "Logical but incorrect option C", "correct": false},
            {"label": "D", "text": "Correct answer demonstrating competence", "correct": true}
          ]
        },
        {
          "text": "Tenth question testing comprehensive understanding?",
          "options": [
            {"label": "A", "text": "Correct answer showing mastery of concepts", "correct": true},
            {"label": "B", "text": "Advanced distractor option B", "correct": false},
            {"label": "C", "text": "Advanced distractor option C", "correct": false},
            {"label": "D", "text": "Advanced distractor option D", "correct": false}
          ]
        }
      ],
      "teacher_tip": "Practical advice for teachers on using this exercise effectively. Suggest ways to explain common errors or extend the learning."
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Person A", "text": "Realistic opening line that sets the context for the lesson topic"},
        {"speaker": "Person B", "text": "Natural response that continues the conversation meaningfully"},
        {"speaker": "Person A", "text": "Follow-up that incorporates key vocabulary or grammar points"},
        {"speaker": "Person B", "text": "Response that shows natural language use in context"},
        {"speaker": "Person A", "text": "Continuation that builds on the lesson objectives"},
        {"speaker": "Person B", "text": "Reply that demonstrates practical language application"},
        {"speaker": "Person A", "text": "Further development of the conversation topic"},
        {"speaker": "Person B", "text": "Response that incorporates lesson-specific language"},
        {"speaker": "Person A", "text": "Penultimate line that moves toward resolution"},
        {"speaker": "Person B", "text": "Natural closing that completes the dialogue effectively"}
      ],
      "expressions": ["Useful expression 1 from the dialogue", "Practical phrase 2 for real situations", "Common expression 3 for this context", "Helpful phrase 4 students can use", "Relevant expression 5 for the topic", 
                     "Practical phrase 6 for communication", "Useful expression 7 for fluency", "Common phrase 8 for this situation", "Helpful expression 9 for conversation", "Relevant phrase 10 for practice"],
      "expression_instruction": "Practice using these expressions in your own dialogues and real-life situations.",
      "teacher_tip": "Practical guidance for teachers on how to use this dialogue effectively. Include role-play suggestions and ways to personalize the content for individual students."
    },
    {
      "type": "true-false",
      "title": "Exercise 6: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Read each statement and decide if it is true or false.",
      "statements": [
        {"text": "Factual statement 1 that tests understanding of the lesson content", "isTrue": true},
        {"text": "Statement 2 that requires careful consideration of the topic", "isTrue": false},
        {"text": "Statement 3 that checks comprehension of key concepts", "isTrue": true},
        {"text": "Statement 4 that tests attention to detail from the lesson", "isTrue": false},
        {"text": "Statement 5 that verifies understanding of important points", "isTrue": true},
        {"text": "Statement 6 that checks knowledge of specific information", "isTrue": false},
        {"text": "Statement 7 that tests grasp of lesson objectives", "isTrue": true},
        {"text": "Statement 8 that requires critical thinking about the content", "isTrue": false},
        {"text": "Statement 9 that checks understanding of practical applications", "isTrue": true},
        {"text": "Statement 10 that tests comprehensive knowledge of the topic", "isTrue": false}
      ],
      "teacher_tip": "Practical advice for teachers on using this exercise to check understanding and reinforce key concepts from the lesson."
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 10,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        {"text": "Thought-provoking question 1 that encourages personal reflection on the topic"},
        {"text": "Open-ended question 2 that allows students to express opinions and experiences"},
        {"text": "Comparative question 3 that uses the lesson's grammar focus in natural context"},
        {"text": "Practical question 4 that helps students apply new vocabulary in real situations"},
        {"text": "Analytical question 5 that encourages deeper thinking about the subject matter"},
        {"text": "Personal experience question 6 that connects the lesson to students' lives"},
        {"text": "Hypothetical question 7 that challenges students to use new language creatively"},
        {"text": "Cultural comparison question 8 that broadens perspective and encourages discussion"},
        {"text": "Problem-solving question 9 that requires students to think critically and communicate solutions"},
        {"text": "Future-oriented question 10 that helps students practice expressing plans and predictions"}
      ],
      "teacher_tip": "Encourage students to elaborate on their answers and ask follow-up questions. Focus on fluency and communication rather than perfect grammar during this speaking practice."
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 8,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "Sentence 1 with common error related to the lesson's grammar focus", "correction": "Corrected version 1 with proper grammar and usage"},
        {"text": "Sentence 2 with typical mistake students make with this topic", "correction": "Corrected version 2 showing proper form and structure"},
        {"text": "Sentence 3 with vocabulary or grammar error from the lesson", "correction": "Corrected version 3 demonstrating accurate language use"},
        {"text": "Sentence 4 with mistake that reinforces learning objectives", "correction": "Corrected version 4 with proper grammar and vocabulary"},
        {"text": "Sentence 5 with error that tests understanding of key concepts", "correction": "Corrected version 5 showing mastery of the material"},
        {"text": "Sentence 6 with common mistake in this context", "correction": "Corrected version 6 with appropriate language for the situation"},
        {"text": "Sentence 7 with error that checks attention to lesson details", "correction": "Corrected version 7 demonstrating proper usage and form"},
        {"text": "Sentence 8 with mistake related to practical application", "correction": "Corrected version 8 showing real-world appropriate language"},
        {"text": "Sentence 9 with error that tests comprehensive understanding", "correction": "Corrected version 9 with accurate grammar and meaning"},
        {"text": "Sentence 10 with final error that reinforces all learning objectives", "correction": "Corrected version 10 showing complete mastery of the concepts"}
      ],
      "teacher_tip": "Have students explain why each sentence was incorrect and what rule applies to the correction. This reinforces understanding and helps prevent future errors."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Key vocabulary term 1", "meaning": "Clear, practical definition that students can understand and use"},
    {"term": "Important term 2", "meaning": "Accurate definition with context for proper usage"},
    {"term": "Essential vocabulary 3", "meaning": "Student-friendly explanation with practical application"},
    {"term": "Relevant term 4", "meaning": "Clear definition that connects to the lesson objectives"},
    {"term": "Useful vocabulary 5", "meaning": "Practical definition for real-world communication"},
    {"term": "Key term 6", "meaning": "Comprehensive explanation with usage context"},
    {"term": "Important vocabulary 7", "meaning": "Clear definition that aids understanding"},
    {"term": "Essential term 8", "meaning": "Practical explanation for effective communication"},
    {"term": "Relevant vocabulary 9", "meaning": "Accurate definition with learning context"},
    {"term": "Useful term 10", "meaning": "Clear explanation that supports lesson goals"},
    {"term": "Additional vocabulary 11", "meaning": "Comprehensive definition for extended learning"},
    {"term": "Supplementary term 12", "meaning": "Detailed explanation for deeper understanding"},
    {"term": "Extra vocabulary 13", "meaning": "Practical definition for comprehensive knowledge"},
    {"term": "Bonus term 14", "meaning": "Clear explanation that enriches the lesson"},
    {"term": "Final vocabulary 15", "meaning": "Comprehensive definition that completes the vocabulary set"}
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
      max_tokens: 5000
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

    // Save worksheet to database with FULL PROMPT (SYSTEM + USER)
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
          p_html_content: JSON.stringify(worksheetData),
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
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
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
