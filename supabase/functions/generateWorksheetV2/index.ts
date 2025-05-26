
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

// Improved exercise type selection
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

// Enhanced validation
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
        if (wordCount < 250) {
          errors.push(`Exercise ${index + 1}: Reading content too short (${wordCount} words)`);
        }
      }
      
      if (!exercise.questions || exercise.questions.length < 5) {
        errors.push(`Exercise ${index + 1}: Reading exercise needs at least 5 questions`);
      }
    }
    
    if (exercise.type === 'matching' && (!exercise.items || exercise.items.length < 8)) {
      errors.push(`Exercise ${index + 1}: Matching exercise needs at least 8 items`);
    }
    
    if (exercise.type === 'fill-in-blanks') {
      if (!exercise.sentences || exercise.sentences.length < 8) {
        errors.push(`Exercise ${index + 1}: Fill-in-blanks needs at least 8 sentences`);
      }
      if (!exercise.word_bank || exercise.word_bank.length < 8) {
        errors.push(`Exercise ${index + 1}: Fill-in-blanks needs at least 8 words in word bank`);
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

// Simplified prompt system
const createEnhancedPrompt = (prompt: string, exerciseCount: number): string => {
  const exerciseTypes = getOptimalExerciseTypes(exerciseCount);
  
  return `You are an expert ESL teacher creating a complete English worksheet for 1-on-1 tutoring.

TOPIC: ${prompt}

REQUIREMENTS:
- Create EXACTLY ${exerciseCount} exercises: ${exerciseTypes.map((type, i) => `${i + 1}. ${type}`).join(', ')}
- Exercise 1 (reading): 280-320 words with 5 comprehension questions
- All other exercises: At least 8-10 items/questions each
- Include practical teacher tips for each exercise
- Ensure all content relates to the specified topic

CRITICAL: Return ONLY valid JSON. No additional text.

JSON Structure:
{
  "title": "Worksheet title",
  "subtitle": "Brief subtitle", 
  "introduction": "2-3 sentence introduction",
  "exercises": [
    // Exactly ${exerciseCount} exercises
  ],
  "vocabulary_sheet": [
    // 15 vocabulary terms
  ]
}

Generate the worksheet now:`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('V2: Starting worksheet generation');
    
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    console.log('V2: Received data:', { prompt: prompt?.substring(0, 100), userId, hasFormData: !!formData });
    
    if (!prompt) {
      console.error('V2: Missing prompt parameter');
      throw new Error('Missing prompt parameter');
    }

    if (!Deno.env.get('OPENAI_API_KEY')) {
      console.error('V2: Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }

    // Determine exercise count
    let exerciseCount = 6;
    if (prompt.includes('30 min')) {
      exerciseCount = 4;
    } else if (prompt.includes('45 min')) {
      exerciseCount = 6;
    } else if (prompt.includes('60 min')) {
      exerciseCount = 8;
    }

    console.log(`V2: Target exercise count: ${exerciseCount}`);

    const enhancedPrompt = createEnhancedPrompt(prompt, exerciseCount);
    
    console.log('V2: Calling OpenAI API');
    
    // Single, comprehensive AI call
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
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

    console.log('V2: OpenAI API call completed');
    const jsonContent = aiResponse.choices[0].message.content;
    
    if (!jsonContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('V2: Parsing JSON response');

    // Parse and validate
    let worksheetData;
    try {
      // Extract JSON from response
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
      console.error('V2: Response content:', jsonContent?.substring(0, 500));
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Comprehensive validation
    const validation = validateWorksheetStructure(worksheetData, exerciseCount);
    
    if (!validation.isValid) {
      console.error('V2: Validation failed:', validation.errors);
      console.log('V2: Attempting to fix validation issues...');
      
      // Try to fix some common issues
      if (!worksheetData.exercises) {
        worksheetData.exercises = [];
      }
      
      // Ensure we have vocabulary sheet
      if (!worksheetData.vocabulary_sheet) {
        worksheetData.vocabulary_sheet = [];
      }
      
      // Re-validate after fixes
      const revalidation = validateWorksheetStructure(worksheetData, exerciseCount);
      if (!revalidation.isValid) {
        throw new Error(`Worksheet validation failed: ${revalidation.errors.join('; ')}`);
      }
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
      console.log('V2: Saving to database');
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

    console.log('V2: Generation completed successfully');
    
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('V2: Error in generateWorksheetV2:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        version: 'v2',
        stack: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
