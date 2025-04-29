
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

    // Generate worksheet using OpenAI with improved prompt structure
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
      "content": "Content text goes here...",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"}
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
        {"term": "Term 2", "definition": "Definition 2"}
      ],
      "teacher_tip": "Tip for teachers on this exercise"
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["word1", "word2", "word3"],
      "sentences": [
        {"text": "Sentence with _____ blank.", "answer": "word1"},
        {"text": "Another _____ here.", "answer": "word2"}
      ],
      "teacher_tip": "Tip for teachers on this exercise"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
  ]
}

IMPORTANT RULES:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt.
2. For matching exercises, include EXACTLY 10 items to match.
3. For vocabulary sheets, include EXACTLY 15 terms.
4. Ensure all JSON is valid with no trailing commas.
5. Make sure all exercises are appropriate for ESL students.
6. Vary the exercise types to include at least: reading, matching, fill-in-blanks, multiple-choice, dialogue.
7. Each exercise must have a teacher_tip field.
8. Use appropriate time values for each exercise (5-10 minutes).
9. DO NOT include any text outside of the JSON structure.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
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
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    // Save worksheet to database - but don't trigger the row limit check
    // Only store the reference, not the actual content to avoid errors when IP limit is reached
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
    if (worksheet?.id) {
      await supabase.from('events').insert({
        type: 'generate',
        event_type: 'generate',
        worksheet_id: worksheet.id,
        user_id: userId,
        metadata: { prompt, ip },
        ip_address: ip
      });
      console.log('Worksheet generated and saved successfully with ID:', worksheet.id);
      // Add the ID to the worksheet data so frontend can use it
      worksheetData.id = worksheet.id;
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
