
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
    
    // CREATE SYSTEM MESSAGE - This is the LONG SYSTEM PROMPT
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
11. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale. Critically, you MUST incorporate the 'teachingPreferences' into the design of relevant exercises. For 'studentProfile' and 'studentStruggles', adapt exercises to address these specific needs.

12. Generate a structured JSON worksheet with this EXACT format:

{
  "title": "Main Title of the Worksheet",
  "subtitle": "Subtitle Related to the Topic",
  "introduction": "Brief introduction paragraph about the worksheet topic and goals",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text and answer the questions below.",
      "content": "Content text of exactly 280-320 words goes here",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Term 1", "definition": "Definition 1"},
        {"term": "Term 2", "definition": "Definition 2"},
        {"term": "Term 3", "definition": "Definition 3"},
        {"term": "Term 4", "definition": "Definition 4"},
        {"term": "Term 5", "definition": "Definition 5"},
        {"term": "Term 6", "definition": "Definition 6"},
        {"term": "Term 7", "definition": "Definition 7"},
        {"term": "Term 8", "definition": "Definition 8"},
        {"term": "Term 9", "definition": "Definition 9"},
        {"term": "Term 10", "definition": "Definition 10"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
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
        {"text": "Third sentence with a _____ to complete.", "answer": "word3"},
        {"text": "Fourth sentence _____ blank.", "answer": "word4"},
        {"text": "Fifth sentence needs a _____ here.", "answer": "word5"},
        {"text": "Sixth _____ for completion.", "answer": "word6"},
        {"text": "Seventh sentence with _____ word missing.", "answer": "word7"},
        {"text": "Eighth sentence requires a _____.", "answer": "word8"},
        {"text": "Ninth sentence has a _____ blank.", "answer": "word9"},
        {"text": "Tenth sentence with a _____ to fill.", "answer": "word10"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "Question 1 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 2 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 3 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 4 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 5 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 6 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 7 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 8 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 9 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 10 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        }
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
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
        {"speaker": "Person A", "text": "I'm doing well, thanks for asking."},
        {"speaker": "Person B", "text": "What brings you here today?"},
        {"speaker": "Person A", "text": "I'm here for the meeting."},
        {"speaker": "Person B", "text": "Oh great, I'll be attending that too."},
        {"speaker": "Person A", "text": "Wonderful, we can walk together."},
        {"speaker": "Person B", "text": "That sounds like a good idea."},
        {"speaker": "Person A", "text": "Shall we head over now?"},
        {"speaker": "Person B", "text": "Yes, let's go."}
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", 
                     "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions in your own dialogues.",
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 10,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        {"text": "Discussion question 1"},
        {"text": "Discussion question 2"},
        {"text": "Discussion question 3"},
        {"text": "Discussion question 4"},
        {"text": "Discussion question 5"},
        {"text": "Discussion question 6"},
        {"text": "Discussion question 7"},
        {"text": "Discussion question 8"},
        {"text": "Discussion question 9"},
        {"text": "Discussion question 10"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 8,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "Sentence with error 1", "correction": "Corrected sentence 1"},
        {"text": "Sentence with error 2", "correction": "Corrected sentence 2"},
        {"text": "Sentence with error 3", "correction": "Corrected sentence 3"},
        {"text": "Sentence with error 4", "correction": "Corrected sentence 4"},
        {"text": "Sentence with error 5", "correction": "Corrected sentence 5"},
        {"text": "Sentence with error 6", "correction": "Corrected sentence 6"},
        {"text": "Sentence with error 7", "correction": "Corrected sentence 7"},
        {"text": "Sentence with error 8", "correction": "Corrected sentence 8"},
        {"text": "Sentence with error 9", "correction": "Corrected sentence 9"},
        {"text": "Sentence with error 10", "correction": "Corrected sentence 10"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"},
    {"term": "Term 3", "meaning": "Definition 3"},
    {"term": "Term 4", "meaning": "Definition 4"},
    {"term": "Term 5", "meaning": "Definition 5"},
    {"term": "Term 6", "meaning": "Definition 6"},
    {"term": "Term 7", "meaning": "Definition 7"},
    {"term": "Term 8", "meaning": "Definition 8"},
    {"term": "Term 9", "meaning": "Definition 9"},
    {"term": "Term 10", "meaning": "Definition 10"},
    {"term": "Term 11", "meaning": "Definition 11"},
    {"term": "Term 12", "meaning": "Definition 12"},
    {"term": "Term 13", "meaning": "Definition 13"},
    {"term": "Term 14", "meaning": "Definition 14"},
    {"term": "Term 15", "meaning": "Definition 15"}
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
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
