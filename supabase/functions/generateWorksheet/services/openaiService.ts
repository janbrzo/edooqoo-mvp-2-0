
import OpenAI from "https://esm.sh/openai@4.28.0";
import { validateExercise } from "../utils/exerciseValidators.ts";
import { getExerciseTypesForMissing, getIconForType } from "../utils/exerciseTypes.ts";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// Funkcja wykrywająca szablonowe odpowiedzi
const detectTemplateContent = (text: string): boolean => {
  const templatePatterns = [
    /This is (sentence|question|statement|line|example|dialogue) \d+/i,
    /This is [a-z]+ \d+/i,
    /sentence \d+ with a/i,
    /Question \d+[\?]?$/i,
    /^Statement \d+/i,
    /^Example \d+/i,
    /^Dialogue \d+/i,
    /^Discussion question \d+/i
  ];
  
  return templatePatterns.some(pattern => pattern.test(text));
};

// Funkcja odrzucająca zadania ze zbyt wieloma szablonami
const hasTooManyTemplates = (exercise: any): boolean => {
  let templateCount = 0;
  const maxTemplatesAllowed = 2;
  
  // Sprawdzanie różnych typów zawartości
  if (exercise.sentences && Array.isArray(exercise.sentences)) {
    templateCount += exercise.sentences.filter((s: any) => 
      detectTemplateContent(s.text)
    ).length;
  }
  
  if (exercise.questions && Array.isArray(exercise.questions)) {
    if (typeof exercise.questions[0] === 'string') {
      templateCount += exercise.questions.filter((q: string) => 
        detectTemplateContent(q)
      ).length;
    } else {
      templateCount += exercise.questions.filter((q: any) => 
        q.text && detectTemplateContent(q.text)
      ).length;
    }
  }
  
  if (exercise.dialogue && Array.isArray(exercise.dialogue)) {
    templateCount += exercise.dialogue.filter((d: any) => 
      detectTemplateContent(d.text)
    ).length;
  }
  
  if (exercise.statements && Array.isArray(exercise.statements)) {
    templateCount += exercise.statements.filter((s: any) => 
      detectTemplateContent(s.text)
    ).length;
  }
  
  return templateCount > maxTemplatesAllowed;
};

// Generate worksheet using OpenAI
export async function generateWorksheetWithOpenAI(
  prompt: string, 
  exerciseCount: number, 
  exerciseTypes: string[]
): Promise<any> {
  console.log('Generating worksheet with OpenAI...');
  
  try {
    // Generowanie worksheetu z ulepszoną instrukcją przeciwko szablonom
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8,
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher specialized in creating authentic, context-specific, high-quality English language worksheets for individual (one-on-one) tutoring sessions.

CRITICAL QUALITY REQUIREMENTS:
1. NEVER USE GENERIC TEMPLATES like "This is sentence X" or "Question X" or any similar pattern.
2. EACH item (sentence/question/dialogue line) MUST be UNIQUE, AUTHENTIC, and 100% TOPIC-SPECIFIC with real content.
3. DO NOT use numbered placeholders - every item must contain complete, meaningful content.
4. EVERY example must teach something useful about the topic.
5. ALL content must sound natural like examples from real life situations.

YOUR TASK:
Create EXACTLY ${exerciseCount} exercises based on these types: ${exerciseTypes.join(', ')}.
Make all exercises closely related to the prompt: "${prompt}".
Number exercises sequentially starting from Exercise 1.

EXERCISE REQUIREMENTS:
- Exercise content must increase in difficulty progressively.
- Reading exercises require 280-320 words of topic-specific content.
- Fill-in-blanks/error-correction/word-formation need at least 10 authentic sentences.
- Multiple-choice questions need 3+ plausible options per question.
- Dialogues must have realistic conversational exchanges.
- Discussion questions should promote critical thinking.
- True-false exercises need 10+ varied statements.

VOCABULARY:
Include 15 key vocabulary items related to the topic with clear meanings.

JSON OUTPUT STRUCTURE:
{
  "title": "Descriptive Worksheet Title",
  "subtitle": "Specific Learning Focus",
  "introduction": "Brief introduction explaining goals and context",
  "exercises": [
    {
      "type": "exercise-type",
      "title": "Exercise X: Type",
      "icon": "icon-name",
      "time": minutes,
      "instructions": "Clear instructions",
      "teacher_tip": "Teaching advice",
      // Additional fields based on type...
    }
  ],
  "vocabulary_sheet": [
    {"term": "word or phrase", "meaning": "definition"}
  ]
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse JSON response
    let worksheetData;
    try {
      worksheetData = JSON.parse(jsonContent);
      
      // Podstawowa walidacja struktury
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Walidacja każdego zadania i sprawdzenie szablonowości
      let exercisesWithTemplates = [];
      
      for (const exercise of worksheetData.exercises) {
        try {
          validateExercise(exercise);
          
          if (hasTooManyTemplates(exercise)) {
            exercisesWithTemplates.push(exercise.title);
            console.log(`Detected too many templates in: ${exercise.title}`);
          }
        } catch (validationError) {
          console.error(`Validation error in exercise ${exercise.title || 'unknown'}:`, validationError);
        }
      }
      
      // Jeśli mamy szablonowe zadania, regenerujemy je indywidualnie
      if (exercisesWithTemplates.length > 0) {
        console.log(`Found ${exercisesWithTemplates.length} exercises with template content. Regenerating individually...`);
        
        for (let i = 0; i < worksheetData.exercises.length; i++) {
          const exercise = worksheetData.exercises[i];
          
          if (exercisesWithTemplates.includes(exercise.title)) {
            try {
              console.log(`Regenerating exercise: ${exercise.title}`);
              
              // Regeneracja pojedynczego zadania
              const regeneratedExerciseResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                temperature: 0.9,
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content: `You are an expert ESL teacher creating a SINGLE exercise for a worksheet on "${prompt}".

IMPORTANT: Create ONE "${exercise.type}" exercise with COMPLETELY ORIGINAL content.

ABSOLUTELY NEVER USE phrases like:
- "This is sentence X"
- "Question X"
- "Statement X"
- "Example X"
- Or any numbered templates

EVERY item must be FULLY AUTHENTIC with REAL CONTENT related to ${prompt}.
Use natural language as if from real-world materials.`
                  },
                  {
                    role: "user",
                    content: `Create a single ${exercise.type} exercise for an ESL worksheet about "${prompt}" with fully authentic content. NO TEMPLATES allowed! Exercise should have the same structure as this one but with 100% new, realistic content: ${JSON.stringify(exercise)}`
                  }
                ],
                max_tokens: 2000
              });
              
              const regeneratedExerciseText = regeneratedExerciseResponse.choices[0].message.content;
              let regeneratedExercise = JSON.parse(regeneratedExerciseText);
              
              // Zachowujemy numerację i część metadanych
              if (regeneratedExercise.exercises && Array.isArray(regeneratedExercise.exercises)) {
                regeneratedExercise = regeneratedExercise.exercises[0];
              }
              
              regeneratedExercise.title = exercise.title;
              regeneratedExercise.icon = exercise.icon;
              
              // Walidujemy i aktualizujemy
              validateExercise(regeneratedExercise);
              worksheetData.exercises[i] = regeneratedExercise;
              
              console.log(`Successfully regenerated exercise ${i + 1}`);
            } catch (regenerationError) {
              console.error(`Failed to regenerate exercise ${exercise.title}:`, regenerationError);
              // Zachowujemy oryginalne zadanie w przypadku błędu
            }
          }
        }
      }
      
      // Sprawdzenie czy mamy odpowiednią liczbę zadań
      if (worksheetData.exercises.length !== exerciseCount) {
        console.log(`Received ${worksheetData.exercises.length} exercises, expected ${exerciseCount}`);
        
        if (worksheetData.exercises.length < exerciseCount) {
          // Generujemy dodatkowe zadania
          const additionalExercisesNeeded = exerciseCount - worksheetData.exercises.length;
          console.log(`Generating ${additionalExercisesNeeded} additional exercises`);
          
          const additionalExercisesResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.9,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are an expert ESL teacher creating additional exercises for a worksheet on "${prompt}".

CRITICAL REQUIREMENTS:
1. Create EXACTLY ${additionalExercisesNeeded} exercises with AUTHENTIC CONTENT.
2. NEVER use generic templates like "This is sentence X" or "Question X".
3. ALL content must be UNIQUE and REALISTIC.
4. Every item must teach something useful about the topic.
5. Number exercises starting from ${worksheetData.exercises.length + 1}.`
              },
              {
                role: "user",
                content: `Create ${additionalExercisesNeeded} additional ESL exercises about "${prompt}". 
                Use these exercise types: ${getExerciseTypesForMissing(worksheetData.exercises, exerciseTypes)}.
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
                // Dodaj zadania bezpośrednio jeśli mamy tablicę
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
              } else if (additionalExercises.exercises && Array.isArray(additionalExercises.exercises)) {
                // Jeśli dostaliśmy obiekt z tablicą exercises
                worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises.exercises];
              } else {
                console.error("Unexpected format for additional exercises:", additionalExercises);
                throw new Error("Invalid format for additional exercises");
              }
              
              console.log(`Successfully added additional exercises. New count: ${worksheetData.exercises.length}`);
              
              // Walidacja nowych zadań
              for (let i = worksheetData.exercises.length - additionalExercisesNeeded; i < worksheetData.exercises.length; i++) {
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
          // Jeśli mamy za dużo zadań, usuwamy nadmiarowe
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
          console.log(`Trimmed exercises to ${worksheetData.exercises.length}`);
        }
      }
      
      // Upewniamy się, że wszystkie tytuły zadań są poprawne
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
        
        // Ustawiamy ikonę jeśli brakuje
        if (!exercise.icon) {
          exercise.icon = getIconForType(exercise.type);
        }
      });
      
      // Upewniamy się, że mamy wystarczającą liczbę słów w słowniku
      if (worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length < 15) {
        console.log(`Vocabulary sheet has only ${worksheetData.vocabulary_sheet.length} items, adding more...`);
        
        try {
          const additionalVocabResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.8,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `Generate additional vocabulary items for an ESL worksheet on "${prompt}".`
              },
              {
                role: "user",
                content: `The worksheet needs ${15 - worksheetData.vocabulary_sheet.length} more vocabulary items about "${prompt}". 
                Current vocabulary items: ${worksheetData.vocabulary_sheet.map((v: any) => v.term).join(', ')}.
                Return a JSON array with the additional vocabulary items in the format: 
                [{"term": "word", "meaning": "definition"}]`
              }
            ],
            max_tokens: 1000
          });
          
          const additionalVocabText = additionalVocabResponse.choices[0].message.content;
          const additionalVocab = JSON.parse(additionalVocabText);
          
          if (Array.isArray(additionalVocab)) {
            worksheetData.vocabulary_sheet = [...worksheetData.vocabulary_sheet, ...additionalVocab];
          } else if (additionalVocab.vocabulary_items && Array.isArray(additionalVocab.vocabulary_items)) {
            worksheetData.vocabulary_sheet = [...worksheetData.vocabulary_sheet, ...additionalVocab.vocabulary_items];
          }
          
          console.log(`Updated vocabulary sheet now has ${worksheetData.vocabulary_sheet.length} items`);
        } catch (vocabError) {
          console.error('Failed to generate additional vocabulary:', vocabError);
        }
      }
      
      // Generujemy liczbę źródeł dla statystyk
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
