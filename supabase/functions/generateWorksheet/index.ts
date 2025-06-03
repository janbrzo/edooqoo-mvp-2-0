
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

  try {
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
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
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Parse the lesson time from the prompt to determine exercise count
    let finalExerciseCount = 8; // Always generate 8 first
    let shouldTrimTo6 = false;
    
    if (sanitizedPrompt.includes('45 min')) {
      shouldTrimTo6 = true;
      finalExerciseCount = 6; // Final count will be 6
    } else if (sanitizedPrompt.includes('60 min')) {
      finalExerciseCount = 8; // Final count will be 8
    }
    
    // Always use the 8-exercise set for generation
    const exerciseTypes = getExerciseTypesForCount(8);
    
    // Generate worksheet using OpenAI with optimized parameters
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Changed to more stable model for JSON generation
      temperature: 0.1, // Very low temperature for consistent JSON structure
      max_tokens: 6000, // Increased token limit for complete responses
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher. Create EXACTLY ONE complete, valid JSON worksheet.

CRITICAL RULES:
1. Generate EXACTLY 8 exercises using these types in order: ${exerciseTypes.join(', ')}
2. Return ONLY valid JSON - no markdown, no explanations, no text outside JSON
3. Reading exercise: EXACTLY 280-320 words in content field
4. All arrays must have exact counts as specified below
5. Use proper JSON escaping for quotes and special characters

REQUIRED JSON STRUCTURE:
{
  "title": "Worksheet Title Here",
  "subtitle": "Subtitle Here", 
  "introduction": "Introduction paragraph here",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text and answer the questions below.",
      "content": "EXACTLY 280-320 WORDS OF TEXT HERE - COUNT CAREFULLY",
      "questions": [
        {"text": "Question 1?", "answer": "Answer 1"},
        {"text": "Question 2?", "answer": "Answer 2"},
        {"text": "Question 3?", "answer": "Answer 3"},
        {"text": "Question 4?", "answer": "Answer 4"},
        {"text": "Question 5?", "answer": "Answer 5"}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link", 
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Term1", "definition": "Definition1"},
        {"term": "Term2", "definition": "Definition2"},
        {"term": "Term3", "definition": "Definition3"},
        {"term": "Term4", "definition": "Definition4"},
        {"term": "Term5", "definition": "Definition5"},
        {"term": "Term6", "definition": "Definition6"},
        {"term": "Term7", "definition": "Definition7"},
        {"term": "Term8", "definition": "Definition8"},
        {"term": "Term9", "definition": "Definition9"},
        {"term": "Term10", "definition": "Definition10"}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
      "sentences": [
        {"text": "Sentence with _____ blank.", "answer": "word1"},
        {"text": "Another _____ here.", "answer": "word2"},
        {"text": "Third _____ blank.", "answer": "word3"},
        {"text": "Fourth _____ blank.", "answer": "word4"},
        {"text": "Fifth _____ blank.", "answer": "word5"},
        {"text": "Sixth _____ blank.", "answer": "word6"},
        {"text": "Seventh _____ blank.", "answer": "word7"},
        {"text": "Eighth _____ blank.", "answer": "word8"},
        {"text": "Ninth _____ blank.", "answer": "word9"},
        {"text": "Tenth _____ blank.", "answer": "word10"}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "Question 1?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 2?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 3?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 4?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 5?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 6?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 7?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 8?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 9?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 10?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        }
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Person A", "text": "Hello, how are you?"},
        {"speaker": "Person B", "text": "I'm fine, thank you. And you?"},
        {"speaker": "Person A", "text": "I'm doing well, thanks."},
        {"speaker": "Person B", "text": "What brings you here today?"},
        {"speaker": "Person A", "text": "I'm here for a business meeting."},
        {"speaker": "Person B", "text": "That sounds important."},
        {"speaker": "Person A", "text": "Yes, it's quite significant."},
        {"speaker": "Person B", "text": "I hope it goes well."},
        {"speaker": "Person A", "text": "Thank you, I appreciate that."},
        {"speaker": "Person B", "text": "You're welcome. Good luck!"}
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions.",
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "true-false",
      "title": "Exercise 6: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Read each statement and decide if it is true or false.",
      "statements": [
        {"text": "Statement 1", "isTrue": true},
        {"text": "Statement 2", "isTrue": false},
        {"text": "Statement 3", "isTrue": true},
        {"text": "Statement 4", "isTrue": false},
        {"text": "Statement 5", "isTrue": true},
        {"text": "Statement 6", "isTrue": false},
        {"text": "Statement 7", "isTrue": true},
        {"text": "Statement 8", "isTrue": false},
        {"text": "Statement 9", "isTrue": true},
        {"text": "Statement 10", "isTrue": false}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        "Question 1?",
        "Question 2?",
        "Question 3?",
        "Question 4?",
        "Question 5?",
        "Question 6?",
        "Question 7?",
        "Question 8?",
        "Question 9?",
        "Question 10?"
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 6,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "Sentence with a error.", "answer": "Sentence with an error."},
        {"text": "This are wrong.", "answer": "This is wrong."},
        {"text": "I don't have no money.", "answer": "I don't have any money."},
        {"text": "She go yesterday.", "answer": "She went yesterday."},
        {"text": "There is many people.", "answer": "There are many people."},
        {"text": "I am study.", "answer": "I am studying."},
        {"text": "He don't like.", "answer": "He doesn't like."},
        {"text": "We was there.", "answer": "We were there."},
        {"text": "I have see it.", "answer": "I have seen it."},
        {"text": "She can speaks.", "answer": "She can speak."}
      ],
      "teacher_tip": "Teaching tip here"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term1", "meaning": "Meaning1"},
    {"term": "Term2", "meaning": "Meaning2"},
    {"term": "Term3", "meaning": "Meaning3"},
    {"term": "Term4", "meaning": "Meaning4"},
    {"term": "Term5", "meaning": "Meaning5"},
    {"term": "Term6", "meaning": "Meaning6"},
    {"term": "Term7", "meaning": "Meaning7"},
    {"term": "Term8", "meaning": "Meaning8"},
    {"term": "Term9", "meaning": "Meaning9"},
    {"term": "Term10", "meaning": "Meaning10"},
    {"term": "Term11", "meaning": "Meaning11"},
    {"term": "Term12", "meaning": "Meaning12"},
    {"term": "Term13", "meaning": "Meaning13"},
    {"term": "Term14", "meaning": "Meaning14"},
    {"term": "Term15", "meaning": "Meaning15"}
  ]
}

GENERATE CONTENT BASED ON THIS TOPIC: ${sanitizedPrompt}

RETURN ONLY THE JSON OBJECT - NO OTHER TEXT.`
        }
      ]
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    console.log('Raw response length:', jsonContent?.length || 0);
    console.log('Response starts with:', jsonContent?.substring(0, 100));
    
    // Parse the JSON response with enhanced error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        try {
          validateExercise(exercise);
        } catch (validationError) {
          console.warn(`Exercise validation warning: ${validationError.message}`);
          // Continue with other exercises rather than failing completely
        }
      }
      
      // Always generate 8 exercises, then trim if needed for 45 min
      if (worksheetData.exercises.length !== 8) {
        console.warn(`Expected 8 exercises but got ${worksheetData.exercises.length}`);
        // If we don't have exactly 8, this is an error - no additional generation
        if (worksheetData.exercises.length < 8) {
          throw new Error('AI did not generate the required 8 exercises');
        } else if (worksheetData.exercises.length > 8) {
          worksheetData.exercises = worksheetData.exercises.slice(0, 8);
        }
      }
      
      // Trim to 6 exercises for 45 min lessons (remove last 2: discussion, error-correction)
      if (shouldTrimTo6) {
        worksheetData.exercises = worksheetData.exercises.slice(0, 6);
        console.log('Trimmed from 8 to 6 exercises for 45 min lesson');
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`Final exercise count: ${worksheetData.exercises.length} (expected: ${finalExerciseCount})`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response content preview (first 1000 chars):', jsonContent?.substring(0, 1000));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save worksheet to database with correct parameters
    try {
      // Sanitize form data
      const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
      
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: sanitizedPrompt,
          p_form_data: sanitizedFormData,
          p_ai_response: jsonContent?.substring(0, 50000) || '', // Limit response size
          p_html_content: JSON.stringify(worksheetData),
          p_user_id: userId || null,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet', // Limit title length
          p_generation_time_seconds: null
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
