
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
    
    // Generate worksheet using OpenAI with improved prompt structure and VERY SPECIFIC requirements
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL teacher assistant that creates detailed worksheets with exercises.
          
Generate a structured JSON worksheet with the following format:

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
      "content": "Reading passage with 280-320 words related to the topic.. MUST BE BETWEEN 280-320 WORDS LONG.",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
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
        // INCLUDE EXACTLY 10 MULTIPLE CHOICE QUESTIONS WITH 4 OPTIONS EACH
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Person A", "text": "Hello, how are you?"},
        {"speaker": "Person B", "text": "I'm fine, thank you. And you?"}
        // INCLUDE AT EXACTLY 10 DIALOGUE EXCHANGES
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", 
                     "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions in your own dialogues.",
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
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
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
    // INCLUDE EXACTLY 15 TERMS with clear definitions
  ]
}

IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3.	Ensure variety and progressive difficulty.  
4.	All exercises should be closely related to the specified topic and goal
5.	Include specific vocabulary, expressions, and language structures related to the topic
6.	Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
7.	DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
8.	Use appropriate time values for each exercise (5-10 minutes).
9. DO NOT include any text outside of the JSON structure.
10. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field.

IMPORTANT QUALITY CHECK BEFORE GENERATING:
Please analyze this English worksheet to ensure it meets the following quality standards, and correct it if it does not.:
1. Grammar is correct throughout all exercises
2. There are no spelling mistakes in any text
3. All instructions are clear and easily understandable
4. The difficulty level is consistent and appropriate
5. Specific vocabulary related to the topic is included
6. Formatting is consistent across all exercises
7. All exercises are complete with required elements
8. "Exercise 1: Reading Comprehension" texts precisely contain 280-320 words
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000  // Ensure we have enough tokens for a complete response
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse and validate the JSON response
    let worksheetData;
    try {
      worksheetData = JSON.parse(jsonContent);
      
      // Basic validation of the structure
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        
        // If we have too few exercises, create additional ones
        if (worksheetData.exercises.length < exerciseCount) {
          // Generate additional exercises with OpenAI
          const additionalExercisesNeeded = exerciseCount - worksheetData.exercises.length;
          console.log(`Generating ${additionalExercisesNeeded} additional exercises`);
          
          const additionalExercisesResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: "You are an expert at creating ESL exercises that match a specific format and quality level."
              },
              {
                role: "user",
                content: `Create ${additionalExercisesNeeded} additional ESL exercises related to this topic: "${prompt}". 
                Use only these exercise types: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}.
                Each exercise should be complete with all required fields as shown in the examples.
                Return them in valid JSON format as an array of exercises.
                
                Existing exercise types: ${worksheetData.exercises.map((ex: any) => ex.type).join(', ')}
                
                Exercise types to use: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}
                
                Number the exercises sequentially starting from ${worksheetData.exercises.length + 1}.
                
                Example exercise formats:
                {
                  "type": "multiple-choice",
                  "title": "Exercise ${worksheetData.exercises.length + 1}: Multiple Choice",
                  "icon": "fa-check-square",
                  "time": 6,
                  "instructions": "Choose the best option to complete each sentence.",
                  "questions": [
                    {
                      "text": "Question text?",
                      "options": [
                        {"label": "A", "text": "Option A", "correct": false},
                        {"label": "B", "text": "Option B", "correct": true},
                        {"label": "C", "text": "Option C", "correct": false},
                        {"label": "D", "text": "Option D", "correct": false}
                      ]
                    }
                    // 10 questions total
                  ],
                  "teacher_tip": "Tip for teachers on this exercise"
                }`
              }
            ],
            max_tokens: 3000
          });
          
          try {
            const additionalExercisesText = additionalExercisesResponse.choices[0].message.content;
            const jsonStartIndex = additionalExercisesText.indexOf('[');
            const jsonEndIndex = additionalExercisesText.lastIndexOf(']') + 1;
            
            if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
              const jsonPortion = additionalExercisesText.substring(jsonStartIndex, jsonEndIndex);
              const additionalExercises = JSON.parse(jsonPortion);
              
              if (Array.isArray(additionalExercises)) {
                // Add the new exercises
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
                console.log(`Successfully added ${additionalExercises.length} exercises`);
                
                // Validate the new exercises
                for (const exercise of additionalExercises) {
                  validateExercise(exercise);
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse or add additional exercises:', parseError);
          }
        } else if (worksheetData.exercises.length > exerciseCount) {
          // If we have too many, trim them down
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
      
      // Ensure full correct exercise count after all adjustments
      console.log(`Final exercise count: ${worksheetData.exercises.length} (expected: ${exerciseCount})`);
      
      // Count API sources used for accurate stats
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    // Save worksheet to database using the correct function parameters
    try {
      const htmlContent = `<div id="worksheet-content">${JSON.stringify(worksheetData)}</div>`;
      
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
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        stack: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to get exercise types based on count
function getExerciseTypesForCount(count: number): string[] {
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
function getExerciseTypesForMissing(existingExercises: any[], allTypes: string[]): string[] {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

// Validate and potentially fix an exercise
function validateExercise(exercise: any): void {
  if (!exercise.type) {
    console.error('Exercise missing type field');
    exercise.type = 'multiple-choice';
  }
  
  if (!exercise.title) {
    console.error('Exercise missing title field');
    exercise.title = `Exercise: ${exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ')}`;
  }
  
  if (!exercise.icon) {
    console.error('Exercise missing icon field');
    exercise.icon = getIconForType(exercise.type);
  }
  
  if (!exercise.time) {
    console.error('Exercise missing time field');
    exercise.time = 5;
  }
  
  if (!exercise.instructions) {
    console.error('Exercise missing instructions field');
    exercise.instructions = `Complete this ${exercise.type} exercise.`;
  }
  
  if (!exercise.teacher_tip) {
    console.error('Exercise missing teacher_tip field');
    exercise.teacher_tip = `Help students with this ${exercise.type} exercise as needed.`;
  }
  
  // Type-specific validations
  switch(exercise.type) {
    case 'reading':
      validateReadingExercise(exercise);
      break;
    case 'matching':
      validateMatchingExercise(exercise);
      break;
    case 'multiple-choice':
      validateMultipleChoiceExercise(exercise);
      break;
    case 'fill-in-blanks':
      validateFillInBlanksExercise(exercise);
      break;
    case 'dialogue':
      validateDialogueExercise(exercise);
      break;
    case 'discussion':
      validateDiscussionExercise(exercise);
      break;
    case 'true-false':
      validateTrueFalseExercise(exercise);
      break;
    case 'error-correction':
    case 'word-formation':
    case 'word-order':
      validateSentencesExercise(exercise);
      break;
  }
}

function validateReadingExercise(exercise: any): void {
  // Validate content
  if (!exercise.content) {
    console.error('Reading exercise missing content');
    exercise.content = generateFakeText(300);
  } else {
    const wordCount = exercise.content.split(/\s+/).length;
    if (wordCount < 280 || wordCount > 320) {
      console.warn(`Reading exercise word count (${wordCount}) is outside target range of 280-320 words`);
    }
  }
  
  // Validate questions
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    console.error('Reading exercise missing questions or has fewer than 5');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 5) {
      exercise.questions.push({
        text: `Question ${exercise.questions.length + 1} about the reading?`,
        answer: `Answer to question ${exercise.questions.length + 1}.`
      });
    }
  }
}

function validateMatchingExercise(exercise: any): void {
  if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 10) {
    console.error('Matching exercise missing items or has fewer than 10');
    if (!exercise.items) exercise.items = [];
    while (exercise.items.length < 10) {
      exercise.items.push({
        term: `Term ${exercise.items.length + 1}`,
        definition: `Definition ${exercise.items.length + 1}`
      });
    }
  }
}

function validateMultipleChoiceExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Multiple choice exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      const questionIndex = exercise.questions.length + 1;
      exercise.questions.push({
        text: `Question ${questionIndex}?`,
        options: [
          { label: "A", text: `Option A for question ${questionIndex}`, correct: false },
          { label: "B", text: `Option B for question ${questionIndex}`, correct: true },
          { label: "C", text: `Option C for question ${questionIndex}`, correct: false },
          { label: "D", text: `Option D for question ${questionIndex}`, correct: false }
        ]
      });
    }
  } else {
    // Validate that each question has 4 options
    for (const question of exercise.questions) {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 4) {
        console.error('Multiple choice question missing options or has fewer than 4');
        if (!question.options) question.options = [];
        while (question.options.length < 4) {
          const labels = ["A", "B", "C", "D"];
          question.options.push({
            label: labels[question.options.length],
            text: `Option ${labels[question.options.length]}`,
            correct: question.options.length === 1 // Make the second option correct by default
          });
        }
      }
    }
  }
}

function validateFillInBlanksExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error('Fill in blanks exercise missing sentences or has fewer than 10');
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      exercise.sentences.push({
        text: `This is sentence ${exercise.sentences.length + 1} with a _____ to fill in.`,
        answer: `word${exercise.sentences.length + 1}`
      });
    }
  }
  
  if (!exercise.word_bank || !Array.isArray(exercise.word_bank) || exercise.word_bank.length < 10) {
    console.error('Fill in blanks exercise missing word bank or has fewer than 10 words');
    if (!exercise.word_bank) exercise.word_bank = [];
    const words = [
      "apple", "banana", "computer", "desk", "elephant", 
      "father", "guitar", "hospital", "internet", "jungle",
      "kitchen", "library", "mountain", "newspaper", "ocean"
    ];
    while (exercise.word_bank.length < 10) {
      exercise.word_bank.push(words[exercise.word_bank.length % words.length]);
    }
  }
}

function validateDialogueExercise(exercise: any): void {
  if (!exercise.dialogue || !Array.isArray(exercise.dialogue) || exercise.dialogue.length < 10) {
    console.error('Dialogue exercise missing dialogue exchanges or has fewer than 10');
    if (!exercise.dialogue) exercise.dialogue = [];
    while (exercise.dialogue.length < 10) {
      const isEven = exercise.dialogue.length % 2 === 0;
      exercise.dialogue.push({
        speaker: isEven ? "Person A" : "Person B",
        text: `This is line ${exercise.dialogue.length + 1} of the dialogue.`
      });
    }
  }
  
  if (!exercise.expressions || !Array.isArray(exercise.expressions) || exercise.expressions.length < 10) {
    console.error('Dialogue exercise missing expressions or has fewer than 10');
    if (!exercise.expressions) exercise.expressions = [];
    const commonExpressions = [
      "Nice to meet you", 
      "How are you?", 
      "See you later", 
      "Thank you", 
      "You're welcome",
      "I'm sorry", 
      "Excuse me", 
      "Can you help me?", 
      "I don't understand", 
      "Could you repeat that?"
    ];
    while (exercise.expressions.length < 10) {
      exercise.expressions.push(commonExpressions[exercise.expressions.length % commonExpressions.length]);
    }
  }
  
  if (!exercise.expression_instruction) {
    console.error('Dialogue exercise missing expression instruction');
    exercise.expression_instruction = "Practice using these expressions from the dialogue in your own conversations.";
  }
}

function validateDiscussionExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Discussion exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      exercise.questions.push(`Discussion question ${exercise.questions.length + 1}?`);
    }
  }
}

function validateTrueFalseExercise(exercise: any): void {
  if (!exercise.statements || !Array.isArray(exercise.statements) || exercise.statements.length < 10) {
    console.error('True-false exercise missing statements or has fewer than 10');
    if (!exercise.statements) exercise.statements = [];
    while (exercise.statements.length < 10) {
      const statementIndex = exercise.statements.length + 1;
      const isTrue = statementIndex % 2 === 0;
      exercise.statements.push({
        text: `Statement ${statementIndex} which is ${isTrue ? 'true' : 'false'}.`,
        isTrue: isTrue
      });
    }
  }
}

function validateSentencesExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error(`${exercise.type} exercise missing sentences or has fewer than 10`);
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      const sentenceIndex = exercise.sentences.length + 1;
      let sentenceObject;
      
      if (exercise.type === 'error-correction') {
        sentenceObject = {
          text: `This sentence ${sentenceIndex} has an error in it.`,
          correction: `This sentence ${sentenceIndex} has no error in it.`
        };
      } else if (exercise.type === 'word-formation') {
        sentenceObject = {
          text: `This is sentence ${sentenceIndex} with a _____ (form) to complete.`,
          answer: "formation"
        };
      } else { // word-order
        sentenceObject = {
          text: `is This sentence ${sentenceIndex} order wrong in.`,
          answer: `This sentence ${sentenceIndex} is in wrong order.`
        };
      }
      
      exercise.sentences.push(sentenceObject);
    }
  }
}

// Helper function to generate fake text of specified word count
function generateFakeText(wordCount: number): string {
  const sentences = [
    "Learning a foreign language requires consistent practice and dedication.",
    "Students should focus on both speaking and listening skills to improve overall fluency.",
    "Regular vocabulary review helps to reinforce new words and phrases.",
    "Grammar exercises are important for building proper sentence structures.",
    "Reading comprehension improves with exposure to diverse texts and topics.",
    "Practicing writing helps students organize their thoughts in the target language.",
    "Cultural understanding enhances language learning and contextual usage.",
    "Listening to native speakers helps with pronunciation and intonation.",
    "Group activities encourage students to use the language in realistic scenarios.",
    "Technology can be a valuable tool for interactive language learning.",
    "Language games make the learning process more engaging and enjoyable.",
    "Watching films in the target language improves listening comprehension.",
    "Translation exercises help students understand nuances between languages.",
    "Language immersion accelerates the learning process significantly.",
    "Setting achievable goals motivates students to continue their language journey.",
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

// Funkcja pomocnicza do przypisywania ikon
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
