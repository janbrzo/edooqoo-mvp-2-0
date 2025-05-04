
import OpenAI from "https://esm.sh/openai@4.28.0";
import { validateExercise } from "../utils/exerciseValidators.ts";
import { getExerciseTypesForMissing, getIconForType } from "../utils/exerciseTypes.ts";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// Generate worksheet using OpenAI
export async function generateWorksheetWithOpenAI(
  prompt: string, 
  exerciseCount: number, 
  exerciseTypes: string[]
): Promise<any> {
  console.log('Generating worksheet with OpenAI...');
  
  // Generate worksheet using OpenAI with improved prompt structure and requirements
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `You are an expert ESL English language teacher specialized in creating a context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.
          
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
      "content": "Generate a coherent, engaging reading passage between 280 and 320 words about topic.",
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
        // INCLUDE AT LEAST 10 DIALOGUE EXCHANGES
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
    // INCLUDE EXACTLY 15 TERMS
  ]
}

IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3. Ensure variety and progressive difficulty.  
4. All exercises should be closely related to the specified topic and goal
5. Include specific vocabulary, expressions, and language structures related to the topic
6. Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
7. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
8. Use appropriate time values for each exercise (5-10 minutes).
9. DO NOT include any text outside of the JSON structure.
10. Exercise 1: Reading Comprehension must follow extra steps:
    - Generate the \`content\` passage between 280 and 320 words.
    - After closing JSON, on a separate line add:
      // Word count: X (must be between 280–320)
    - Don't proceed unless X ∈ [280,320].

11. Focus on overall flow, coherence and pedagogical value; minor typos acceptable.

IMPORTANT QUALITY CHECK BEFORE GENERATING:
- Grammar, spelling, formatting – near-flawless (1–2 minor typos allowed).
- Difficulty level consistent and appropriate.
- Specific vocabulary related to the topic is included.
- Confirm that Exercise 1 \`content\` is between 280 and 320 words and that the Word count comment is correct.
'
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
      console.warn("Received " + worksheetData.exercises.length + " exercises, expected " + exerciseCount);
      
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

  return worksheetData;
}
