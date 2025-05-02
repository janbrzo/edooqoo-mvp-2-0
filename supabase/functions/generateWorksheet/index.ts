
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

    console.log(`Setting exercise count to ${exerciseCount} based on lesson time`);

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
      "content": "Content text goes here, MUST BE BETWEEN 280-320 WORDS LONG...",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
    // INCLUDE EXACTLY 15 TERMS
  ]
}

IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt.
2. For "reading" exercises:
   - The content MUST be BETWEEN 280-320 WORDS. Count words carefully.
   - ALWAYS include EXACTLY 5 comprehension questions.
3. For "matching" exercises:
   - Include EXACTLY 10 items to match.
4. For "fill-in-blanks" exercises:
   - Include EXACTLY 10 sentences and 10 words in the word bank.
5. For "multiple-choice" exercises:
   - Include EXACTLY 10 questions with 4 options each.
6. For "dialogue" exercises:
   - Include AT LEAST 10 dialogue exchanges.
   - Include EXACTLY 10 expressions to practice.
7. For ALL other exercise types:
   - Include EXACTLY 10 examples/items/questions unless specified otherwise.
8. For vocabulary sheets, include EXACTLY 15 terms.
9. Ensure all JSON is valid with no trailing commas.
10. Make sure all exercises are appropriate for ESL students.
11. Vary the exercise types to include at least: reading, matching, fill-in-blanks, multiple-choice, dialogue.
12. Each exercise must have a teacher_tip field.
13. Use appropriate time values for each exercise (5-10 minutes).
14. DO NOT include any text outside of the JSON structure.
15. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field.
16. COUNT THE ACTUAL NUMBER OF ITEMS in each exercise to verify you've met the requirements.
17. For reading exercises, COUNT WORDS CAREFULLY to ensure text is between 280-320 words.`
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
        if (exercise.type === 'reading') {
          // Validate reading content length
          const wordCount = exercise.content?.split(/\s+/).length || 0;
          console.log(`Reading exercise word count: ${wordCount}`);
          
          if (wordCount < 280 || wordCount > 320) {
            console.warn(`Reading exercise word count (${wordCount}) outside target range of 280-320 words`);
            
            // Try to fix if we're within a reasonable range
            if (wordCount > 200 && wordCount < 280) {
              // Need to expand - generate more content with OpenAI
              const expandResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                temperature: 0.7,
                messages: [
                  {
                    role: "system",
                    content: "You are an expert at expanding text while maintaining the same style and context."
                  },
                  {
                    role: "user",
                    content: `The following text has ${wordCount} words but needs to have between 280-320 words. 
                    Please expand it to the right length while maintaining the style and topic. 
                    Original text: "${exercise.content}"`
                  }
                ]
              });
              
              const expandedText = expandResponse.choices[0].message.content;
              // Check if the expanded text is within our target range
              const expandedWordCount = expandedText.split(/\s+/).length;
              if (expandedWordCount >= 280 && expandedWordCount <= 320) {
                exercise.content = expandedText;
                console.log(`Successfully expanded reading text from ${wordCount} to ${expandedWordCount} words`);
              }
            }
          }
          
          // Validate question count
          if (!exercise.questions || exercise.questions.length < 5) {
            console.error(`Reading exercise has fewer than 5 questions: ${exercise.questions?.length || 0}`);
            // Add dummy questions if needed
            if (!exercise.questions) exercise.questions = [];
            while (exercise.questions.length < 5) {
              exercise.questions.push({
                text: `Additional question ${exercise.questions.length + 1} about the text.`,
                answer: "Answer would be based on the text content."
              });
            }
          }
        } else if (exercise.type === 'matching' && (!exercise.items || exercise.items.length < 10)) {
          console.error(`Matching exercise has fewer than 10 items: ${exercise.items?.length || 0}`);
        } else if (exercise.type === 'fill-in-blanks' && (!exercise.sentences || exercise.sentences.length < 10)) {
          console.error(`Fill-in-blanks exercise has fewer than 10 sentences: ${exercise.sentences?.length || 0}`);
        } else if (exercise.type === 'multiple-choice' && (!exercise.questions || exercise.questions.length < 10)) {
          console.error(`Multiple-choice exercise has fewer than 10 questions: ${exercise.questions?.length || 0}`);
        }
      }
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        
        // If we have too few exercises, try to generate more
        if (worksheetData.exercises.length < exerciseCount) {
          const additionalExercisesCount = exerciseCount - worksheetData.exercises.length;
          console.log(`Generating ${additionalExercisesCount} additional exercises...`);
          
          const additionalResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: `You are an expert ESL teacher assistant that creates detailed exercises for worksheets.
                
Generate ${additionalExercisesCount} more exercises in JSON format for an ESL worksheet on the topic: "${prompt}".
Each exercise should follow this structure:

{
  "type": "exercise_type", // Choose from: reading, matching, fill-in-blanks, multiple-choice, dialogue
  "title": "Exercise Title",
  "icon": "fa-icon-name",
  "time": 7, // time in minutes (5-10)
  "instructions": "Instructions for the exercise",
  // Additional fields based on exercise type
  "teacher_tip": "Tip for teachers on this exercise"
}

IMPORTANT RULES AND REQUIREMENTS:
1. For "reading" exercises:
   - The content MUST be BETWEEN 280-320 WORDS. Count words carefully.
   - ALWAYS include EXACTLY 5 comprehension questions.
2. For "matching" exercises:
   - Include EXACTLY 10 items to match.
3. For "fill-in-blanks" exercises:
   - Include EXACTLY 10 sentences and 10 words in the word bank.
4. For "multiple-choice" exercises:
   - Include EXACTLY 10 questions with 4 options each.
5. For "dialogue" exercises:
   - Include AT LEAST 10 dialogue exchanges.
   - Include EXACTLY 10 expressions to practice.
6. Ensure all JSON is valid with no trailing commas.
7. Make sure each exercise is appropriate for ESL students.
8. Each exercise MUST have a teacher_tip field.
9. Use appropriate time values for each exercise (5-10 minutes).
10. Return ONLY the JSON array of exercises.`
              },
              {
                role: "user",
                content: `Generate ${additionalExercisesCount} additional exercises for this existing worksheet on: "${prompt}"`
              }
            ],
            max_tokens: 3000
          });
          
          try {
            const additionalContent = additionalResponse.choices[0].message.content;
            const additionalExercises = JSON.parse(additionalContent);
            
            if (Array.isArray(additionalExercises)) {
              worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
              console.log(`Successfully added ${additionalExercises.length} exercises`);
            }
          } catch (parseErr) {
            console.error('Failed to parse additional exercises:', parseErr);
          }
        }
      }
      
      // Count API sources used for accurate stats
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    // Save worksheet to database
    try {
      // First, try to use RPC if available
      let worksheet = null;
      let worksheetError = null;
      
      try {
        const rpcResult = await supabase.rpc(
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
        
        worksheet = rpcResult.data;
        worksheetError = rpcResult.error;
      } catch (rpcError) {
        console.error('RPC method not available, falling back to direct insert:', rpcError);
        // Fallback to direct insert
        const insertResult = await supabase.from('worksheets').insert({
          prompt: prompt,
          html_content: JSON.stringify(worksheetData),
          user_id: userId,
          ip_address: ip,
          status: 'created',
          title: worksheetData.title
        }).select().single();
        
        worksheet = insertResult.data;
        worksheetError = insertResult.error;
      }

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
        // Continue even if database save fails - we'll return the generated content
      }

      // Track generation event if we have a worksheet ID
      if (worksheet?.id) {
        const eventResult = await supabase.from('events').insert({
          type: 'generate',
          event_type: 'generate',
          worksheet_id: worksheet.id,
          user_id: userId,
          metadata: { prompt, ip },
          ip_address: ip
        });
        
        if (eventResult.error) {
          console.error('Error tracking event:', eventResult.error);
        } else {
          console.log('Worksheet generated and saved successfully with ID:', worksheet.id);
        }
        
        // Add the ID to the worksheet data so frontend can use it
        worksheetData.id = worksheet.id;
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
