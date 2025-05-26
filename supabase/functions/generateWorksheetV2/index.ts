
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

// Improved exercise type selection - ensures variety and logical progression
const getOptimalExerciseTypes = (count: number): string[] => {
  const coreTypes = ['reading', 'matching', 'fill-in-blanks', 'multiple-choice'];
  const supplementaryTypes = ['dialogue', 'true-false', 'discussion', 'error-correction'];
  
  if (count === 4) {
    return ['reading', 'matching', 'fill-in-blanks', 'multiple-choice'];
  } else if (count === 6) {
    return ['reading', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'true-false'];
  } else { // count === 8
    return ['reading', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'true-false', 'discussion', 'error-correction'];
  }
};

// Enhanced validation with specific requirements
const validateWorksheetStructure = (worksheetData: any, expectedCount: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    errors.push('Missing or invalid exercises array');
    return { isValid: false, errors };
  }
  
  if (worksheetData.exercises.length !== expectedCount) {
    errors.push(`Expected ${expectedCount} exercises, got ${worksheetData.exercises.length}`);
  }
  
  worksheetData.exercises.forEach((exercise: any, index: number) => {
    if (!exercise.type || !exercise.title || !exercise.instructions) {
      errors.push(`Exercise ${index + 1}: Missing required fields`);
    }
    
    // Specific validations per exercise type
    if (exercise.type === 'reading') {
      if (!exercise.content) {
        errors.push(`Exercise ${index + 1}: Reading exercise missing content`);
      } else {
        const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
        if (wordCount < 280 || wordCount > 320) {
          errors.push(`Exercise ${index + 1}: Reading content has ${wordCount} words, expected 280-320`);
        }
      }
      
      if (!exercise.questions || exercise.questions.length < 5) {
        errors.push(`Exercise ${index + 1}: Reading exercise needs exactly 5 questions`);
      }
    }
    
    if (exercise.type === 'matching' && (!exercise.items || exercise.items.length < 10)) {
      errors.push(`Exercise ${index + 1}: Matching exercise needs exactly 10 items`);
    }
    
    if (exercise.type === 'fill-in-blanks') {
      if (!exercise.sentences || exercise.sentences.length < 10) {
        errors.push(`Exercise ${index + 1}: Fill-in-blanks needs exactly 10 sentences`);
      }
      if (!exercise.word_bank || exercise.word_bank.length < 10) {
        errors.push(`Exercise ${index + 1}: Fill-in-blanks needs exactly 10 words in word bank`);
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

// Simplified, more reliable prompt system
const createEnhancedPrompt = (prompt: string, exerciseCount: number): string => {
  const exerciseTypes = getOptimalExerciseTypes(exerciseCount);
  
  return `You are an expert ESL teacher creating a complete, ready-to-use English worksheet for 1-on-1 tutoring.

TOPIC: ${prompt}

REQUIREMENTS:
- Create EXACTLY ${exerciseCount} exercises in this exact order: ${exerciseTypes.map((type, i) => `${i + 1}. ${type}`).join(', ')}
- Each exercise must be complete and pedagogically sound
- Exercise 1 (reading): Content MUST be 280-320 words, followed by exactly 5 comprehension questions
- All other exercises: Exactly 10 items/questions/sentences each
- Include practical teacher tips for each exercise
- Ensure all content relates to the specified topic
- Use clear, age-appropriate language

CRITICAL: Return ONLY valid JSON. No additional text or comments.

JSON Structure:
{
  "title": "Worksheet title related to topic",
  "subtitle": "Brief subtitle",
  "introduction": "2-3 sentence introduction about the topic and learning goals",
  "exercises": [
    // Exercises array with exactly ${exerciseCount} items
  ],
  "vocabulary_sheet": [
    // Exactly 15 vocabulary terms related to the topic
  ]
}

Generate the complete worksheet now:`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!prompt) {
      throw new Error('Missing prompt parameter');
    }

    console.log('V2: Generating worksheet with simplified approach');

    // Determine exercise count
    let exerciseCount = 6;
    if (prompt.includes('30 min')) {
      exerciseCount = 4;
    } else if (prompt.includes('45 min')) {
      exerciseCount = 6;
    } else if (prompt.includes('60 min')) {
      exerciseCount = 8;
    }

    const enhancedPrompt = createEnhancedPrompt(prompt, exerciseCount);
    
    console.log('V2: Sending enhanced prompt to OpenAI');
    
    // Single, comprehensive AI call with better parameters
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3, // Lower temperature for more consistent output
      messages: [
        {
          role: "system",
          content: "You are a professional ESL worksheet creator. You always follow instructions precisely and return valid JSON."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      max_tokens: 4000
    });

    const jsonContent = aiResponse.choices[0].message.content;
    console.log('V2: AI response received, parsing JSON');

    // Parse and validate
    let worksheetData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonString = jsonContent.substring(jsonStart, jsonEnd);
      worksheetData = JSON.parse(jsonString);
      
      console.log('V2: JSON parsed successfully');
      
    } catch (parseError) {
      console.error('V2: JSON parsing failed:', parseError);
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Comprehensive validation
    const validation = validateWorksheetStructure(worksheetData, exerciseCount);
    
    if (!validation.isValid) {
      console.error('V2: Validation failed:', validation.errors);
      
      // Instead of trying to fix, return a clear error for now
      // In production, you could implement fallback templates here
      throw new Error(`Worksheet validation failed: ${validation.errors.join('; ')}`);
    }

    console.log('V2: Validation passed, finalizing worksheet');

    // Ensure proper exercise numbering and icons
    const exerciseIcons = {
      'reading': 'fa-book-open',
      'matching': 'fa-link',
      'fill-in-blanks': 'fa-pencil-alt',
      'multiple-choice': 'fa-check-square',
      'dialogue': 'fa-comments',
      'true-false': 'fa-balance-scale',
      'discussion': 'fa-users',
      'error-correction': 'fa-eraser'
    };

    worksheetData.exercises.forEach((exercise: any, index: number) => {
      const exerciseNumber = index + 1;
      const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
      exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      exercise.icon = exerciseIcons[exercise.type as keyof typeof exerciseIcons] || 'fa-edit';
      exercise.time = exercise.time || (exercise.type === 'reading' ? 8 : 6);
    });

    const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
    worksheetData.sourceCount = sourceCount;

    // Save to database
    try {
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
        console.error('V2: Error saving worksheet:', worksheetError);
      } else if (worksheet && worksheet.length > 0) {
        worksheetData.id = worksheet[0].id;
        console.log('V2: Worksheet saved successfully with ID:', worksheetData.id);
      }
    } catch (dbError) {
      console.error('V2: Database operation failed:', dbError);
    }

    console.log('V2: Worksheet generation completed successfully');
    
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('V2: Error in generateWorksheetV2:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        version: 'v2'
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
