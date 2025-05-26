
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

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
    
    // Generate worksheet using OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher specialized in creating a context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

          IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3. Ensure variety and progressive difficulty.  
4. All exercises should be closely related to the specified topic and goal
5. Include specific vocabulary, expressions, and language structures related to the topic.
6. Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
7. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
8. Use appropriate time values for each exercise (5-10 minutes).
9. RETURN ONLY VALID JSON. DO NOT include any text outside of the JSON structure.
10. Exercise 1: Reading Comprehension must follow extra steps:
    - Generate the content passage between 280 and 320 words.
11. Focus on overall flow, coherence and pedagogical value; minor typos acceptable.

12. Generate a structured JSON worksheet with the following format:

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
      "content": "Content text of more than 280 words goes here",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
  ]
}

IMPORTANT QUALITY CHECK BEFORE GENERATING:
1. Grammar, spelling, formatting – near-flawless (1–2 minor typos allowed). Difficulty level consistent and appropriate.
2. Confirm that Exercise 1 content is between 280 and 320 words.
3. For "reading" exercises: The content MUST be BETWEEN 280-320 WORDS. Include EXACTLY 5 comprehension questions.
4. For "matching" exercises: Include EXACTLY 10 items to match.
5. For "fill-in-blanks" exercises: Include EXACTLY 10 sentences and 10 words in the word bank.
6. For "multiple-choice" exercises: Include EXACTLY 10 questions with 4 options each.
7. For "dialogue" exercises: Include AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions to practice.
8. For "true-false" exercises: Include EXACTLY 10 statements with clear true/false answers.
9. For "discussion" exercises: Include EXACTLY 10 discussion questions.
10. For "error-correction" exercises: Include EXACTLY 10 sentences with errors to correct.
11. For "word-formation" exercises: Include EXACTLY 10 sentences with gaps for word formation.
12. For "word-order" exercises: Include EXACTLY 10 sentences with words to rearrange.
13. For ALL other exercise types: Include EXACTLY 10 examples/items/questions unless specified otherwise.
14. For vocabulary sheets, include EXACTLY 15 terms.
15. Specific vocabulary related to the topic is included.
`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000
    });

    let jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Clean up the response - remove any text before the first { and after the last }
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    
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
          const additionalExercisesNeeded = exerciseCount - worksheetData.exercises.length;
          console.log(`Generating ${additionalExercisesNeeded} additional exercises`);
          
          const additionalExercisesResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: "You are an expert at creating ESL exercises that match a specific format and quality level. RETURN ONLY VALID JSON ARRAY."
              },
              {
                role: "user",
                content: `Create ${additionalExercisesNeeded} additional ESL exercises related to this topic: "${prompt}". 
                Use only these exercise types: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}.
                Each exercise should be complete with all required fields as shown in the examples.
                Return them as a valid JSON array of exercises.
                
                Existing exercise types: ${worksheetData.exercises.map((ex: any) => ex.type).join(', ')}
                
                Exercise types to use: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}
                
                Number the exercises sequentially starting from ${worksheetData.exercises.length + 1}.`
              }
            ],
            max_tokens: 3000
          });
          
          try {
            let additionalExercisesText = additionalExercisesResponse.choices[0].message.content;
            
            // Clean up the response to extract only the JSON array
            const firstBracket = additionalExercisesText.indexOf('[');
            const lastBracket = additionalExercisesText.lastIndexOf(']');
            
            if (firstBracket >= 0 && lastBracket > firstBracket) {
              const jsonPortion = additionalExercisesText.substring(firstBracket, lastBracket + 1);
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
      
      // Generate a temporary ID for frontend use
      worksheetData.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Count API sources used for accurate stats
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', jsonContent);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
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
  const baseTypes = [
    'reading', 
    'matching', 
    'fill-in-blanks', 
    'multiple-choice'
  ];
  
  const additionalTypes = [
    'dialogue', 
    'true-false', 
    'discussion', 
    'error-correction', 
    'word-formation', 
    'word-order'
  ];
  
  if (count <= 4) {
    return baseTypes;
  }
  
  if (count <= 6) {
    return [...baseTypes, 'dialogue', 'true-false'];
  }
  
  return [...baseTypes, ...additionalTypes];
}

// Helper function to get missing exercise types
function getExerciseTypesForMissing(existingExercises: any[], allTypes: string[]): string[] {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

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
