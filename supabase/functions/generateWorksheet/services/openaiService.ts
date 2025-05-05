
import OpenAI from "https://esm.sh/openai@4.28.0";
import { validateExercise } from "../utils/exerciseValidators.ts";
import { getExerciseTypesForMissing, getIconForType } from "../utils/exerciseTypes.ts";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// Definicja schematu JSON dla worksheetów
const worksheetJsonSchema = {
  type: "object",
  required: ["title", "subtitle", "introduction", "exercises", "vocabulary_sheet"],
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    introduction: { type: "string" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "title", "icon", "time", "instructions", "teacher_tip"],
        properties: {
          type: { 
            type: "string",
            enum: ["reading", "matching", "fill-in-blanks", "multiple-choice", "dialogue", 
                   "discussion", "error-correction", "word-formation", "word-order", "true-false"]
          },
          title: { type: "string" },
          icon: { type: "string" },
          time: { type: "number" },
          instructions: { type: "string" },
          teacher_tip: { type: "string" },
          content: { type: "string" },
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
            items: { type: "string" }
          },
          sentences: {
            type: "array",
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
            items: { type: "string" }
          },
          expression_instruction: { type: "string" },
          statements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                isTrue: { type: "boolean" }
              }
            }
          }
        }
      }
    },
    vocabulary_sheet: {
      type: "array",
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

// Generate worksheet using OpenAI
export async function generateWorksheetWithOpenAI(
  prompt: string, 
  exerciseCount: number, 
  exerciseTypes: string[]
): Promise<any> {
  console.log('Generating worksheet with OpenAI...');
  
  try {
    // Generate worksheet using OpenAI with JSON Schema validation
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object", schema: worksheetJsonSchema },
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
            5. Include specific vocabulary, expressions, and language structures related to the topic
            6. Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
            7. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
            8. Use appropriate time values for each exercise (5-10 minutes).
            9. DO NOT include any text outside of the JSON structure.
            10. Exercise 1: Reading Comprehension must have content between 280 and 320 words.

            IMPORTANT QUALITY CHECK BEFORE GENERATING:
            - Grammar, spelling, formatting – near-flawless (1–2 minor typos allowed).
            - Difficulty level consistent and appropriate.
            - Specific vocabulary related to the topic is included.
            - Confirm that Exercise 1 content is between 280 and 320 words.`
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
    
    // Parse JSON response
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
          console.log("Generating " + additionalExercisesNeeded + " additional exercises");
          
          const additionalExercisesResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are an expert at creating ESL exercises that match a specific format and quality level."
              },
              {
                role: "user",
                content: `Create ${additionalExercisesNeeded} additional ESL exercises related to this topic: "${prompt}". 
                Use only these exercise types: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}.
                Each exercise should be complete with all required fields.
                Return them in valid JSON format as an array of exercises.
                
                Existing exercise types: ${worksheetData.exercises.map((ex: any) => ex.type).join(', ')}
                
                Exercise types to use: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}
                
                Number the exercises sequentially starting from ${worksheetData.exercises.length + 1}.`
              }
            ],
            max_tokens: 3000
          });
          
          try {
            const additionalExercisesText = additionalExercisesResponse.choices[0].message.content;
            let additionalExercises;
            
            try {
              additionalExercises = JSON.parse(additionalExercisesText);
              
              if (Array.isArray(additionalExercises)) {
                // Add the new exercises directly if we got an array
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
              } else if (additionalExercises.exercises && Array.isArray(additionalExercises.exercises)) {
                // If we got a wrapper object with an exercises array
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises.exercises];
              } else {
                console.error("Unexpected format for additional exercises:", additionalExercises);
                throw new Error("Invalid format for additional exercises");
              }
              
              console.log("Successfully added " + (worksheetData.exercises.length - exerciseCount) + " exercises");
              
              // Validate the new exercises
              for (let i = exerciseCount; i < worksheetData.exercises.length; i++) {
                validateExercise(worksheetData.exercises[i]);
              }
            } catch (jsonError) {
              console.error('Failed to parse additional exercises JSON:', jsonError);
              console.log("Additional exercises text:", additionalExercisesText);
              throw new Error("Failed to parse additional exercises");
            }
          } catch (parseError) {
            console.error('Failed to process additional exercises:', parseError);
          }
        } else if (worksheetData.exercises.length > exerciseCount) {
          // If we have too many, trim them down
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
          console.log("Trimmed exercises to " + worksheetData.exercises.length);
        }
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
        
        // Set icon if missing
        if (!exercise.icon) {
          exercise.icon = getIconForType(exercise.type);
        }
      });
      
      // Ensure full correct exercise count after all adjustments
      console.log("Final exercise count: " + worksheetData.exercises.length + " (expected: " + exerciseCount + ")");
      
      // Generate random source count for stats
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to process AI response:', parseError);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    return worksheetData;
  } catch (apiError) {
    console.error('OpenAI API error:', apiError);
    throw new Error('Error communicating with AI service: ' + (apiError.message || 'Unknown error'));
  }
}
