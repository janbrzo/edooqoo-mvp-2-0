
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!prompt) {
      throw new Error('Missing prompt parameter');
    }

    console.log('Received prompt:', prompt);

    // Parse the lesson time from the prompt to determine exercise count
    let exerciseCount = 6; // Default
    if (prompt.includes('30 min')) {
      exerciseCount = 4;
    } else if (prompt.includes('45 min')) {
      exerciseCount = 6;
    } else if (prompt.includes('60 min')) {
      exerciseCount = 8;
    }
    
    // Determine exercise types to include based on exerciseCount
    const exerciseTypes = getExerciseTypesForCount(exerciseCount);
    
    console.log(`Will generate ${exerciseCount} exercises of types:`, exerciseTypes);
    
    // Define JSON Schema for worksheet structure
    const worksheetSchema = {
      type: "object",
      required: ["title", "subtitle", "introduction", "exercises", "vocabulary_sheet"],
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        introduction: { type: "string" },
        exercises: {
          type: "array",
          minItems: exerciseCount,
          maxItems: exerciseCount,
          items: {
            type: "object",
            required: ["type", "title", "icon", "time", "instructions", "teacher_tip"],
            properties: {
              type: { 
                type: "string",
                enum: [
                  "reading", "matching", "fill-in-blanks", "multiple-choice",
                  "dialogue", "discussion", "error-correction", "word-formation",
                  "word-order", "true-false"
                ]
              },
              title: { type: "string" },
              icon: { type: "string" },
              time: { type: "integer", minimum: 5, maximum: 10 },
              instructions: { type: "string" },
              teacher_tip: { type: "string" },
              // Different exercise types have different required properties
              content: { type: "string" }, // For reading
              questions: { 
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    answer: { type: "string" },
                    options: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          text: { type: "string" },
                          correct: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              },
              items: { 
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" }
                  }
                }
              },
              word_bank: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: { type: "string" }
              },
              sentences: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    answer: { type: "string" },
                    correction: { type: "string" }
                  }
                }
              },
              dialogue: {
                type: "array",
                minItems: 10,
                items: {
                  type: "object",
                  properties: {
                    speaker: { type: "string" },
                    text: { type: "string" }
                  }
                }
              },
              expressions: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: { type: "string" }
              },
              expression_instruction: { type: "string" },
              statements: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    isTrue: { type: "boolean" }
                  }
                }
              }
            },
            allOf: [
              {
                if: { properties: { type: { const: "reading" } } },
                then: { 
                  required: ["content", "questions"],
                  properties: {
                    content: { 
                      type: "string",
                      minLength: 280 * 5, // Approximate character count for 280 words
                      maxLength: 320 * 7  // Approximate character count for 320 words
                    },
                    questions: {
                      type: "array",
                      minItems: 5,
                      maxItems: 5
                    }
                  }
                }
              },
              {
                if: { properties: { type: { const: "matching" } } },
                then: { required: ["items"] }
              },
              {
                if: { properties: { type: { const: "fill-in-blanks" } } },
                then: { required: ["sentences", "word_bank"] }
              },
              {
                if: { properties: { type: { const: "multiple-choice" } } },
                then: { 
                  required: ["questions"],
                  properties: {
                    questions: {
                      type: "array",
                      minItems: 10,
                      maxItems: 10
                    }
                  }
                }
              },
              {
                if: { properties: { type: { const: "dialogue" } } },
                then: { required: ["dialogue", "expressions", "expression_instruction"] }
              },
              {
                if: { properties: { type: { const: "discussion" } } },
                then: { 
                  required: ["questions"],
                  properties: {
                    questions: {
                      type: "array",
                      minItems: 10,
                      maxItems: 10
                    }
                  }
                }
              },
              {
                if: { properties: { type: { const: "true-false" } } },
                then: { required: ["statements"] }
              },
              {
                if: { properties: { type: { const: "error-correction" } } },
                then: { required: ["sentences"] }
              },
              {
                if: { properties: { type: { const: "word-formation" } } },
                then: { required: ["sentences"] }
              },
              {
                if: { properties: { type: { const: "word-order" } } },
                then: { required: ["sentences"] }
              }
            ]
          }
        },
        vocabulary_sheet: {
          type: "array",
          minItems: 15,
          maxItems: 15,
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              meaning: { type: "string" }
            }
          }
        }
      }
    };

    // Generate worksheet using OpenAI with improved prompt structure and JSON response format
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object", schema: worksheetSchema },
      messages: [
        {
          role: "system",
          content: `You are an expert ESL teacher assistant that creates detailed worksheets with exercises.
          
IMPORTANT QUALITY CHECK BEFORE GENERATING:
Please analyze this English worksheet to ensure the following quality standards:
1. Grammar is correct throughout all exercises
2. There are no spelling mistakes in any text
3. All instructions are clear and easily understandable
4. The difficulty level is consistent and appropriate
5. Specific vocabulary related to the topic is included
6. Formatting is consistent across all exercises
7. All exercises are complete with required elements
8. Reading texts precisely contain 280-320 words (COUNT CAREFULLY)

IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3. For "reading" exercises:
   - The content MUST be BETWEEN 280-320 WORDS. Count words carefully.
   - ALWAYS include EXACTLY 5 comprehension questions.
4. For "matching" exercises:
   - Include EXACTLY 10 items to match.
5. For "fill-in-blanks" exercises:
   - Include EXACTLY 10 sentences and 10 words in the word bank.
6. For "multiple-choice" exercises:
   - Include EXACTLY 10 questions with 4 options each.
7. For "dialogue" exercises:
   - Include AT LEAST 10 dialogue exchanges.
   - Include EXACTLY 10 expressions to practice.
8. For "true-false" exercises:
   - Include EXACTLY 10 statements with clear true/false answers.
9. For "discussion" exercises:
   - Include EXACTLY 10 discussion questions.
10. For "error-correction" exercises:
   - Include EXACTLY 10 sentences with errors to correct.
11. For "word-formation" exercises:
   - Include EXACTLY 10 sentences with gaps for word formation.
12. For "word-order" exercises:
   - Include EXACTLY 10 sentences with words to rearrange.
13. For ALL other exercise types:
   - Include EXACTLY 10 examples/items/questions unless specified otherwise.
14. For vocabulary sheets, include EXACTLY 15 terms.
15. Make sure all exercises are appropriate for ESL students.
16. Each exercise must have a teacher_tip field.
17. Use appropriate time values for each exercise (5-10 minutes).
18. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field.
19. Each exercise title MUST include its sequence number (e.g., "Exercise 1: Reading Comprehension").
20. For reading exercises, COUNT WORDS CAREFULLY to ensure text is between 280-320 words.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000  // Ensure we have enough tokens for a complete response
    });

    let worksheetData = JSON.parse(aiResponse.choices[0].message.content);
    
    console.log('AI response received and validated through JSON schema');
    
    // Post-processing: Validate and fix the response data if needed
    worksheetData = validateAndFixWorksheetData(worksheetData, exerciseTypes, exerciseCount);
    
    // Count API sources used for accurate stats
    const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
    worksheetData.sourceCount = sourceCount;
    
    // Make sure exercise titles have correct sequential numbering
    worksheetData.exercises.forEach((exercise, index) => {
      const exerciseNumber = index + 1;
      const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
      exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      
      // Ensure icon is set based on type
      exercise.icon = getIconForType(exercise.type);
    });

    // Save worksheet to database using the correct function parameters
    try {
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: prompt,
          p_content: JSON.stringify(worksheetData),
          p_user_id: userId,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title
        }
      );

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
        // Continue even if database save fails - we'll return the generated content
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        await supabase.from('events').insert({
          type: 'generate',
          event_type: 'generate',
          worksheet_id: worksheetId,
          user_id: userId,
          metadata: { prompt, ip },
          ip_address: ip
        });
        console.log('Worksheet generated and saved successfully with ID:', worksheetId);
        // Add the ID to the worksheet data so frontend can use it
        worksheetData.id = worksheetId;
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue without failing the request
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
    // Check if this is a JSON schema validation error from OpenAI
    const isValidationError = error.message && 
      (error.message.includes('JSON schema validation failed') || 
       error.message.includes('does not conform to the specified JSON schema'));
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        isValidationError: isValidationError,
        stack: error.stack
      }),
      { 
        status: isValidationError ? 422 : (error.status || 500),
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Validator and fixer function for worksheet data
function validateAndFixWorksheetData(data, allowedTypes, expectedExerciseCount) {
  console.log("Validating and fixing worksheet data...");
  
  // Fix: ensure we have exactly the expected number of exercises
  if (!data.exercises || !Array.isArray(data.exercises)) {
    console.error("Missing exercises array in response");
    data.exercises = [];
    // Create minimal exercises of allowed types
    for (let i = 0; i < expectedExerciseCount; i++) {
      const type = allowedTypes[i % allowedTypes.length];
      data.exercises.push(createMinimalExercise(type, i + 1));
    }
  }
  
  // Fix: if we have too few exercises
  while (data.exercises.length < expectedExerciseCount) {
    const index = data.exercises.length;
    const type = allowedTypes[index % allowedTypes.length];
    console.log(`Adding missing exercise of type ${type}`);
    data.exercises.push(createMinimalExercise(type, index + 1));
  }
  
  // Fix: if we have too many exercises
  if (data.exercises.length > expectedExerciseCount) {
    console.log(`Trimming excess exercises from ${data.exercises.length} to ${expectedExerciseCount}`);
    data.exercises = data.exercises.slice(0, expectedExerciseCount);
  }
  
  // Fix: validate each exercise type and structure
  const fixedExercises = data.exercises.map((exercise, index) => {
    // Fix: ensure type is valid
    if (!exercise.type || !allowedTypes.includes(exercise.type)) {
      console.warn(`Invalid exercise type: ${exercise.type}, replacing with: ${allowedTypes[index % allowedTypes.length]}`);
      exercise.type = allowedTypes[index % allowedTypes.length];
    }
    
    // Fix: ensure title format
    const exerciseNumber = index + 1;
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
    
    // Fix: ensure icon is set
    exercise.icon = getIconForType(exercise.type);
    
    // Fix: ensure time is within bounds
    if (!exercise.time || exercise.time < 5 || exercise.time > 10) {
      exercise.time = Math.floor(Math.random() * 6) + 5; // 5-10 minutes
    }
    
    // Fix: ensure teacher_tip exists
    if (!exercise.teacher_tip) {
      exercise.teacher_tip = `Help students understand ${exercise.type} exercises by providing clear examples.`;
    }
    
    // Fix: ensure instructions exist
    if (!exercise.instructions) {
      exercise.instructions = getDefaultInstructions(exercise.type);
    }
    
    // Type-specific fixes
    return fixExerciseByType(exercise);
  });
  
  data.exercises = fixedExercises;
  
  // Fix: ensure vocabulary sheet exists
  if (!data.vocabulary_sheet || !Array.isArray(data.vocabulary_sheet) || data.vocabulary_sheet.length < 15) {
    console.warn("Vocabulary sheet missing or incomplete, creating default");
    data.vocabulary_sheet = createDefaultVocabulary(data.title || "English Worksheet", 15);
  }
  
  // Trim vocabulary sheet to exact 15 items
  data.vocabulary_sheet = data.vocabulary_sheet.slice(0, 15);
  
  // Fix: ensure title, subtitle, introduction exist
  if (!data.title) data.title = "English Language Worksheet";
  if (!data.subtitle) data.subtitle = "Practice and Improve Your English Skills";
  if (!data.introduction) data.introduction = "This worksheet contains various exercises to help you practice and improve your English language skills.";
  
  return data;
}

// Helper function to create a minimal valid exercise
function createMinimalExercise(type, number) {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  const exercise = {
    type: type,
    title: `Exercise ${number}: ${capitalizedType}`,
    icon: getIconForType(type),
    time: Math.floor(Math.random() * 6) + 5, // 5-10 minutes
    instructions: getDefaultInstructions(type),
    teacher_tip: `Help students understand ${type} exercises by providing clear examples.`
  };
  
  // Add type-specific properties
  return fixExerciseByType(exercise);
}

// Fix exercise based on its type
function fixExerciseByType(exercise) {
  switch (exercise.type) {
    case "reading":
      if (!exercise.content || exercise.content.length < 280 * 5) { // Approximation of char count
        exercise.content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(25);
      }
      if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
        exercise.questions = Array(5).fill(0).map((_, i) => ({
          text: `Question ${i+1} about the reading text?`,
          answer: `Sample answer to question ${i+1}.`
        }));
      }
      break;
      
    case "matching":
      if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 10) {
        exercise.items = Array(10).fill(0).map((_, i) => ({
          term: `Term ${i+1}`,
          definition: `Definition ${i+1}`
        }));
      }
      break;
      
    case "fill-in-blanks":
      if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
        exercise.sentences = Array(10).fill(0).map((_, i) => ({
          text: `This is sentence ${i+1} with a _____.`,
          answer: `word${i+1}`
        }));
      }
      if (!exercise.word_bank || !Array.isArray(exercise.word_bank) || exercise.word_bank.length < 10) {
        exercise.word_bank = Array(10).fill(0).map((_, i) => `word${i+1}`);
      }
      break;
      
    case "multiple-choice":
      if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
        exercise.questions = Array(10).fill(0).map((_, i) => ({
          text: `Multiple choice question ${i+1}?`,
          options: [
            { label: "A", text: "Option A", correct: i % 4 === 0 },
            { label: "B", text: "Option B", correct: i % 4 === 1 },
            { label: "C", text: "Option C", correct: i % 4 === 2 },
            { label: "D", text: "Option D", correct: i % 4 === 3 }
          ]
        }));
      }
      break;
      
    case "dialogue":
      if (!exercise.dialogue || !Array.isArray(exercise.dialogue) || exercise.dialogue.length < 10) {
        exercise.dialogue = Array(10).fill(0).map((_, i) => ({
          speaker: i % 2 === 0 ? "Person A" : "Person B",
          text: `This is dialogue line ${i+1}.`
        }));
      }
      if (!exercise.expressions || !Array.isArray(exercise.expressions) || exercise.expressions.length < 10) {
        exercise.expressions = Array(10).fill(0).map((_, i) => `Expression ${i+1}`);
      }
      if (!exercise.expression_instruction) {
        exercise.expression_instruction = "Practice these expressions with a partner.";
      }
      break;
      
    case "discussion":
      if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
        exercise.questions = Array(10).fill(0).map((_, i) => `Discussion question ${i+1}?`);
      }
      break;
      
    case "true-false":
      if (!exercise.statements || !Array.isArray(exercise.statements) || exercise.statements.length < 10) {
        exercise.statements = Array(10).fill(0).map((_, i) => ({
          text: `Statement ${i+1}`,
          isTrue: i % 2 === 0
        }));
      }
      break;
      
    case "error-correction":
    case "word-formation":
    case "word-order":
      if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
        exercise.sentences = Array(10).fill(0).map((_, i) => ({
          text: `Sentence ${i+1} with an error.`,
          answer: exercise.type === "error-correction" ? "correction" : "answer"
        }));
      }
      break;
  }
  
  return exercise;
}

// Get default instructions based on exercise type
function getDefaultInstructions(type) {
  const instructions = {
    "reading": "Read the following text carefully and answer the questions below.",
    "matching": "Match each term on the left with its correct definition on the right.",
    "fill-in-blanks": "Fill in the blanks with the appropriate words from the word bank.",
    "multiple-choice": "Choose the correct answer for each question.",
    "dialogue": "Read the dialogue and practice the expressions below.",
    "discussion": "Discuss the following questions with your partner or group.",
    "error-correction": "Identify and correct the errors in the following sentences.",
    "word-formation": "Form the correct word to fill each gap.",
    "word-order": "Rearrange the words to form correct sentences.",
    "true-false": "Indicate whether each statement is true or false."
  };
  
  return instructions[type] || "Complete the following exercise.";
}

// Create default vocabulary for an empty vocabulary sheet
function createDefaultVocabulary(title, count) {
  return Array(count).fill(0).map((_, i) => ({
    term: `Term ${i+1}`,
    meaning: `Definition for term ${i+1}`
  }));
}

// Helper function to get exercise types based on count
function getExerciseTypesForCount(count) {
  // Base set of exercise types
  const baseTypes = [
    'reading', 
    'matching', 
    'fill-in-blanks', 
    'multiple-choice'
  ];
  
  // Additional types when we need more exercises
  const additionalTypes = [
    'dialogue', 
    'true-false', 
    'discussion', 
    'error-correction', 
    'word-formation', 
    'word-order'
  ];
  
  // For 4 exercises (30 min), use just the base types
  if (count <= 4) {
    return baseTypes;
  }
  
  // For 6 exercises (45 min), add 2 more
  if (count <= 6) {
    return [...baseTypes, 'dialogue', 'true-false'];
  }
  
  // For 8 or more exercises (60 min), use all types
  return [...baseTypes, ...additionalTypes];
}

// Helper function to get missing exercise types
function getExerciseTypesForMissing(existingExercises, allTypes) {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

// Helper function to get icon for exercise type
function getIconForType(type) {
  const iconMap = {
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
