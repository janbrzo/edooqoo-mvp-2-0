
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
    // Always generate 8 exercises, then trim to 6 if needed
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
    
    // Generate worksheet using OpenAI with GPT-4.1 and complete structures
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 4000, // Ensure we have enough tokens for complete response
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher specialized in creating a context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

          IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY 8 exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3. Ensure variety and progressive difficulty.  
4. All exercises should be closely related to the specified topic and goal
5. Include specific vocabulary, expressions, and language structures related to the topic.
6. Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
7. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
8. Use appropriate time values for each exercise (5-10 minutes).
9. DO NOT include any text outside of the JSON structure.
10. Exercise 1: Reading Comprehension must follow extra steps:
    - Generate the content passage between 280 and 320 words. COUNT WORDS CAREFULLY.
    - The passage MUST contain exactly 280-320 words. This is CRITICAL.
11. Focus on overall flow, coherence and pedagogical value; minor typos acceptable.

12. Generate a structured JSON worksheet with the following COMPLETE format:

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
      "content": "Content text of EXACTLY 280-320 words goes here - count words carefully and ensure this requirement is met",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 8 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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
        {"speaker": "Person A", "text": "Yes, it's quite significant for our company."},
        {"speaker": "Person B", "text": "I hope it goes well for you."},
        {"speaker": "Person A", "text": "Thank you, I appreciate that."},
        {"speaker": "Person B", "text": "You're welcome. Good luck!"}
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", 
                     "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions in your own dialogues.",
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        "Discussion question 1?",
        "Discussion question 2?",
        "Discussion question 3?",
        "Discussion question 4?",
        "Discussion question 5?",
        "Discussion question 6?",
        "Discussion question 7?",
        "Discussion question 8?",
        "Discussion question 9?",
        "Discussion question 10?"
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 6,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "Sentence with a error to correct.", "answer": "Sentence with an error to correct."},
        {"text": "This are wrong grammar.", "answer": "This is wrong grammar."},
        {"text": "I don't have no money.", "answer": "I don't have any money."},
        {"text": "She go to school yesterday.", "answer": "She went to school yesterday."},
        {"text": "There is many people here.", "answer": "There are many people here."},
        {"text": "I am study English.", "answer": "I am studying English."},
        {"text": "He don't like coffee.", "answer": "He doesn't like coffee."},
        {"text": "We was at home.", "answer": "We were at home."},
        {"text": "I have see that movie.", "answer": "I have seen that movie."},
        {"text": "She can speaks English well.", "answer": "She can speak English well."}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful advice for teachers on how to use this exercise effectively."
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

CRITICAL REQUIREMENTS FOR EACH EXERCISE TYPE:
1. Reading: EXACTLY 280-320 words in content + EXACTLY 5 questions
2. Matching: EXACTLY 10 items to match
3. Fill-in-blanks: EXACTLY 10 sentences + EXACTLY 10 words in word bank
4. Multiple-choice: EXACTLY 10 questions with 4 options each (A,B,C,D)
5. Dialogue: AT LEAST 10 dialogue exchanges + EXACTLY 10 expressions
6. True-false: EXACTLY 10 statements
7. Discussion: EXACTLY 10 discussion questions  
8. Error-correction: EXACTLY 10 sentences with errors
9. Vocabulary sheet: EXACTLY 15 terms with meanings

RETURN ONLY VALID JSON. NO TEXT OUTSIDE JSON STRUCTURE.`
        },
        {
          role: "user",
          content: sanitizedPrompt
        }
      ]
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    console.log('Response length:', jsonContent?.length || 0);
    
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
      console.error('Response content preview:', jsonContent?.substring(0, 1000));
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
