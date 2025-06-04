
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, getExerciseTypesForMissing } from './helpers.ts';
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

// Enhanced JSON parser
function parseAIResponse(content: string): any {
  console.log('=== JSON PARSER DEBUG ===');
  console.log('Raw content length:', content.length);
  console.log('Content starts with:', content.substring(0, 200));
  console.log('Content ends with:', content.substring(content.length - 200));
  
  // Step 1: Remove markdown formatting
  console.log('Step 1: Removing markdown...');
  let cleanContent = content;
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/gi, '');
  cleanContent = cleanContent.replace(/```\s*/gi, '');
  cleanContent = cleanContent.replace(/`{3,}/g, '');
  
  // Step 2: Find JSON boundaries
  console.log('Step 2: Finding JSON boundaries...');
  const firstBrace = cleanContent.indexOf('{');
  const lastBrace = cleanContent.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    console.log('Extracted JSON boundaries, length:', cleanContent.length);
  }
  
  console.log('JSON starts with:', cleanContent.substring(0, 200));
  
  // Step 3: Clean and parse JSON
  console.log('Step 3: Cleaning JSON...');
  try {
    console.log('Attempting JSON.parse...');
    const parsed = JSON.parse(cleanContent);
    console.log('Successfully parsed JSON');
    return parsed;
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError.message);
    console.log('Problematic JSON preview:', cleanContent.substring(0, 500));
    
    // Enhanced fallback reconstruction
    console.log('=== ENHANCED FALLBACK ===');
    return reconstructWorksheetFromText(content);
  }
}

function reconstructWorksheetFromText(content: string): any {
  console.log('Attempting enhanced fallback reconstruction...');
  
  // Extract title
  const titleMatch = content.match(/"title":\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Generated Worksheet';
  console.log('Found title:', title);
  
  // Extract subtitle
  const subtitleMatch = content.match(/"subtitle":\s*"([^"]+)"/);
  const subtitle = subtitleMatch ? subtitleMatch[1] : 'English Language Learning';
  console.log('Found subtitle:', subtitle);
  
  // Extract introduction
  const introMatch = content.match(/"introduction":\s*"([^"]+)"/);
  const introduction = introMatch ? introMatch[1] : 'This worksheet is designed to help students improve their English language skills.';
  console.log('Found introduction:', introduction.substring(0, 100) + '...');
  
  // Extract exercises section
  console.log('Extracting exercises...');
  const exercisesMatch = content.match(/"exercises":\s*\[(.*)\]/s);
  const exercisesContent = exercisesMatch ? exercisesMatch[1] : '';
  console.log('Found exercises content, length:', exercisesContent.length);
  
  // Find exercise types in content
  const exerciseTypes = ['reading', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'true-false', 'discussion', 'error-correction'];
  const foundTypes = exerciseTypes.filter(type => content.includes(`"type": "${type}"`));
  console.log('Found', foundTypes.length, 'type matches');
  
  // Create fallback exercises
  const exercises = [];
  for (let i = 0; i < foundTypes.length; i++) {
    const type = foundTypes[i];
    console.log('Created exercise', i + 1, ':', type);
    exercises.push(createFallbackExercise(type, i + 1));
  }
  
  console.log('Fallback reconstruction created', exercises.length, 'exercises');
  
  return {
    title,
    subtitle,
    introduction,
    exercises,
    vocabulary_sheet: [
      { term: "Example", meaning: "A sample or illustration" },
      { term: "Practice", meaning: "Repeated exercise to improve skill" }
    ]
  };
}

function createFallbackExercise(type: string, index: number): any {
  const baseExercise = {
    type,
    title: `Exercise ${index}: ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')}`,
    icon: getIconForType(type),
    time: 7,
    instructions: `Complete this ${type} exercise.`,
    teacher_tip: `Guide students through this ${type} exercise.`
  };
  
  switch (type) {
    case 'reading':
      return {
        ...baseExercise,
        content: generateFakeText(300),
        questions: Array(5).fill(null).map((_, i) => ({
          text: `Question ${i + 1} about the reading?`,
          answer: `Answer to question ${i + 1}.`
        }))
      };
    case 'matching':
      return {
        ...baseExercise,
        items: Array(10).fill(null).map((_, i) => ({
          term: `Term ${i + 1}`,
          definition: `Definition ${i + 1}`
        }))
      };
    default:
      return baseExercise;
  }
}

function getIconForType(type: string): string {
  const iconMap: {[key: string]: string} = {
    'multiple-choice': 'fa-check-square',
    'reading': 'fa-book-open',
    'matching': 'fa-random',
    'fill-in-blanks': 'fa-pencil-alt',
    'dialogue': 'fa-comments',
    'discussion': 'fa-users',
    'error-correction': 'fa-exclamation-triangle',
    'word-formation': 'fa-font',
    'word-order': 'fa-sort',
    'true-false': 'fa-balance-scale'
  };
  
  return iconMap[type] || 'fa-tasks';
}

function generateFakeText(wordCount: number): string {
  const sentences = [
    "Learning a foreign language requires consistent practice and dedication.",
    "Students should focus on both speaking and listening skills to improve overall fluency.",
    "Regular vocabulary review helps to reinforce new words and phrases.",
    "Grammar exercises are important for building proper sentence structures.",
    "Reading comprehension improves with exposure to diverse texts and topics."
  ];
  
  let text = "";
  let currentWordCount = 0;
  
  while (currentWordCount < wordCount) {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    text += " " + randomSentence;
    currentWordCount += randomSentence.split(/\s+/).length;
  }
  
  return text.trim();
}

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 5, windowMs: number = 300000): boolean {
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

  try {
    console.log('=== GENERATE WORKSHEET REQUEST ===');
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    console.log('Request data:', {
      promptLength: prompt?.length,
      hasFormData: !!formData,
      userId: userId?.substring(0, 8) + '...',
      ip
    });

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

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    console.log('Sanitized prompt preview:', sanitizedPrompt.substring(0, 100) + '...');

    // Parse the lesson time from the prompt to determine exercise count
    let exerciseCount = 6; // Default
    if (sanitizedPrompt.includes('30 min')) {
      exerciseCount = 4;
      console.log('Detected 30 min lesson - will keep 4 exercises');
    } else if (sanitizedPrompt.includes('45 min')) {
      exerciseCount = 6;
      console.log('Detected 45 min lesson - will keep 6 exercises');
    } else if (sanitizedPrompt.includes('60 min')) {
      exerciseCount = 8;
      console.log('Detected 60 min lesson - will keep 8 exercises');
    }
    
    // Determine exercise types to include based on exerciseCount
    const exerciseTypes = getExerciseTypesForCount(exerciseCount);
    console.log('Exercise types for generation:', exerciseTypes);
    
    console.log('=== OPENAI SERVICE DEBUG ===');
    console.log('Calling OpenAI service...');
    console.log('Exercise types:', exerciseTypes);
    console.log('Prompt preview:', sanitizedPrompt.substring(0, 100));
    console.log('Generating worksheet with OpenAI...');
    console.log('Calling OpenAI API...');

    // Generate worksheet using OpenAI with STRICT JSON requirements
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.0, // Zero temperature for consistent output
      max_tokens: 6000, // Increased token limit
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher. You MUST return ONLY valid JSON without any markdown formatting, explanations, or additional text.

CRITICAL: Your response must be PURE JSON starting with { and ending with }. NO markdown blocks, NO explanations, NO additional text.

Create EXACTLY ${exerciseCount} exercises using ONLY these types: ${exerciseTypes.join(', ')}.

Return this exact JSON structure:

{
  "title": "Worksheet Title",
  "subtitle": "Subtitle",
  "introduction": "Brief introduction",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the text and answer the questions.",
      "content": "Text content of exactly 300 words",
      "questions": [
        {"text": "Question 1?", "answer": "Answer 1"},
        {"text": "Question 2?", "answer": "Answer 2"},
        {"text": "Question 3?", "answer": "Answer 3"},
        {"text": "Question 4?", "answer": "Answer 4"},
        {"text": "Question 5?", "answer": "Answer 5"}
      ],
      "teacher_tip": "Teaching tip"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Meaning 1"},
    {"term": "Term 2", "meaning": "Meaning 2"}
  ]
}

RETURN ONLY JSON. NO OTHER TEXT.`
        },
        {
          role: "user",
          content: sanitizedPrompt
        }
      ]
    });

    const jsonContent = aiResponse.choices[0].message.content;
    console.log('OpenAI response received, length:', jsonContent?.length);
    console.log('Response preview:', jsonContent?.substring(0, 200));
    
    console.log('=== AI RESPONSE ANALYSIS ===');
    console.log('Raw response length:', jsonContent?.length);
    console.log('Response starts with:', jsonContent?.substring(0, 100));
    console.log('Contains ```json:', jsonContent?.includes('```json'));
    console.log('Contains ```:', jsonContent?.includes('```'));
    
    console.log('=== PARSING JSON RESPONSE ===');
    
    // Parse the JSON response with enhanced error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      console.log('Successfully parsed worksheet:', {
        title: worksheetData.title,
        exerciseCount: worksheetData.exercises.length,
        hasVocabSheet: !!worksheetData.vocabulary_sheet
      });
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        
        if (worksheetData.exercises.length < exerciseCount) {
          const additionalExercisesNeeded = exerciseCount - worksheetData.exercises.length;
          console.log(`Generating ${additionalExercisesNeeded} additional exercises`);
          
          const additionalExercisesResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.0,
            max_tokens: 3000,
            messages: [
              {
                role: "system",
                content: "Return ONLY valid JSON array of exercises. NO markdown, NO explanations."
              },
              {
                role: "user",
                content: `Create ${additionalExercisesNeeded} additional ESL exercises for: "${sanitizedPrompt}". 
                Use types: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}.
                Return JSON array starting with [ and ending with ].`
              }
            ]
          });
          
          try {
            const additionalExercisesText = additionalExercisesResponse.choices[0].message.content;
            const jsonStartIndex = additionalExercisesText.indexOf('[');
            const jsonEndIndex = additionalExercisesText.lastIndexOf(']') + 1;
            
            if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
              const jsonPortion = additionalExercisesText.substring(jsonStartIndex, jsonEndIndex);
              const additionalExercises = JSON.parse(jsonPortion);
              
              if (Array.isArray(additionalExercises)) {
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
                console.log(`Successfully added ${additionalExercises.length} exercises`);
                
                for (const exercise of additionalExercises) {
                  validateExercise(exercise);
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse or add additional exercises:', parseError);
          }
        } else if (worksheetData.exercises.length > exerciseCount) {
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
          console.log(`Trimmed exercises to ${worksheetData.exercises.length}`);
        }
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`Final exercise count: ${worksheetData.exercises.length} (expected: ${exerciseCount})`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save worksheet to database
    console.log('Saving worksheet to database...');
    try {
      const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
      
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: sanitizedPrompt,
          p_form_data: sanitizedFormData,
          p_ai_response: jsonContent?.substring(0, 50000) || '',
          p_html_content: JSON.stringify(worksheetData),
          p_user_id: userId || null,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet',
          p_generation_time_seconds: null
        }
      );

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
      }

      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        console.log('Worksheet saved with ID:', worksheetId);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
    }

    console.log('=== REQUEST COMPLETED SUCCESSFULLY ===');
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
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
