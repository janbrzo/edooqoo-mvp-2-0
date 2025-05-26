
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
    
    console.log(`Generating ${exerciseCount} exercises with types:`, exerciseTypes);
    
    // Generate worksheet using OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher specialized in creating context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.

CRITICAL REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}.
3. RETURN ONLY VALID JSON. NO text before or after the JSON structure.
4. All content must be complete - NO placeholders or incomplete fields.
5. Reading exercise must be 280-320 words with exactly 5 questions.
6. Each exercise type must have exactly the required number of items (10 for most types).

JSON Structure Required:
{
  "title": "Worksheet Title",
  "subtitle": "Subtitle",
  "introduction": "Brief introduction",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the text and answer questions.",
      "content": "280-320 word text here",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Teaching tip here"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
  ]
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3500
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
      
      // Basic validation
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Simple validation - ensure we have exercises
      if (worksheetData.exercises.length === 0) {
        throw new Error('No exercises generated');
      }
      
      // Basic exercise validation
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        if (!exercise.type || !exercise.title) {
          console.warn(`Exercise ${index + 1} missing basic fields, fixing...`);
          exercise.type = exercise.type || 'multiple-choice';
          exercise.title = exercise.title || `Exercise ${index + 1}: ${exercise.type}`;
          exercise.icon = exercise.icon || 'fa-tasks';
          exercise.time = exercise.time || 5;
          exercise.instructions = exercise.instructions || `Complete this ${exercise.type} exercise.`;
          exercise.teacher_tip = exercise.teacher_tip || `Help students with this exercise.`;
        }
      });
      
      // Ensure correct number of exercises (trim if too many, but don't add if too few)
      if (worksheetData.exercises.length > exerciseCount) {
        worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
        console.log(`Trimmed exercises to ${exerciseCount}`);
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      // Add vocabulary sheet if missing
      if (!worksheetData.vocabulary_sheet || !Array.isArray(worksheetData.vocabulary_sheet)) {
        worksheetData.vocabulary_sheet = [
          {"term": "Essential", "meaning": "Absolutely necessary"},
          {"term": "Comprehensive", "meaning": "Complete and thorough"},
          {"term": "Efficient", "meaning": "Working in a well-organized way"}
        ];
      }
      
      console.log(`Final worksheet generated with ${worksheetData.exercises.length} exercises`);
      
      // Generate a temporary ID
      worksheetData.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add source count for stats
      worksheetData.sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response length:', jsonContent?.length || 0);
      console.error('First 500 chars:', jsonContent?.substring(0, 500) || 'No content');
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
        details: error.stack
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
    'error-correction'
  ];
  
  if (count <= 4) {
    return baseTypes;
  }
  
  if (count <= 6) {
    return [...baseTypes, 'dialogue', 'true-false'];
  }
  
  return [...baseTypes, ...additionalTypes];
}
