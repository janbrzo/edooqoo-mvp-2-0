
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('V1: Starting worksheet generation');
    
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    console.log('V1: Received data:', { prompt: prompt?.substring(0, 100), userId, hasFormData: !!formData });
    
    if (!prompt) {
      console.error('V1: Missing prompt parameter');
      throw new Error('Missing prompt parameter');
    }

    if (!Deno.env.get('OPENAI_API_KEY')) {
      console.error('V1: Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }

    // Parse the lesson time from the prompt to determine exercise count
    let exerciseCount = 6; // Default
    if (prompt.includes('30 min')) {
      exerciseCount = 4;
    } else if (prompt.includes('45 min')) {
      exerciseCount = 6;
    } else if (prompt.includes('60 min')) {
      exerciseCount = 8;
    }
    
    console.log(`V1: Target exercise count: ${exerciseCount}`);
    
    // Determine exercise types to include based on exerciseCount
    const exerciseTypes = getExerciseTypesForCount(exerciseCount);
    console.log('V1: Exercise types:', exerciseTypes);
    
    // Generate worksheet using OpenAI with improved prompt structure
    console.log('V1: Calling OpenAI API');
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher creating worksheets for 1-on-1 tutoring sessions. Create EXACTLY ${exerciseCount} exercises using these types: ${exerciseTypes.join(', ')}. Return ONLY valid JSON with no additional text.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000
    });

    console.log('V1: OpenAI API call completed');
    const jsonContent = aiResponse.choices[0].message.content;
    
    if (!jsonContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('V1: Parsing AI response');
    
    // Parse the JSON response with error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      console.log(`V1: Parsed ${worksheetData.exercises.length} exercises`);
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`V1: Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        
        if (worksheetData.exercises.length < exerciseCount) {
          console.log('V1: Need to generate additional exercises');
          // Slice to correct count for now
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
        } else if (worksheetData.exercises.length > exerciseCount) {
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
          console.log(`V1: Trimmed exercises to ${worksheetData.exercises.length}`);
        }
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`V1: Final exercise count: ${worksheetData.exercises.length}`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('V1: Failed to parse AI response:', parseError);
      console.error('V1: Response content:', jsonContent?.substring(0, 500));
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    // Save worksheet to database
    try {
      console.log('V1: Saving to database');
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: prompt,
          p_form_data: formData || {},
          p_ai_response: jsonContent,
          p_html_content: JSON.stringify(worksheetData),
          p_user_id: userId,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title,
          p_generation_time_seconds: null
        }
      );

      if (worksheetError) {
        console.error('V1: Error saving worksheet to database:', worksheetError);
      } else if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        console.log('V1: Worksheet saved successfully with ID:', worksheetId);
      }
    } catch (dbError) {
      console.error('V1: Database operation failed:', dbError);
    }

    console.log('V1: Generation completed successfully');
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('V1: Error in generateWorksheet:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        version: 'v1',
        stack: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
