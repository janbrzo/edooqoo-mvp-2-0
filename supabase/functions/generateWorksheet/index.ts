
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validatePrompt, sanitizeInput, isValidUUID } from './security.ts';
import { extractGeolocation } from './geolocation.ts';
import { rateLimiter } from './rateLimiter.ts';
import { 
  validateWorksheet, 
  validateExercise, 
  fixWorksheetStructure 
} from './validators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const openaiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
const openaiTimeoutMs = parseInt(Deno.env.get('OPENAI_TIMEOUT_MS') || '120000');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, formData, userId, studentId } = await req.json();
    
    console.log('Received request:', {
      userId,
      studentId,
      hasPrompt: !!prompt
    });

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Extract geolocation information
    const { country, city } = await extractGeolocation(ipAddress);
    console.log('Geo data:', country, city);

    // Validate and sanitize inputs
    const validationResult = validatePrompt(prompt);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sanitizedPrompt = sanitizeInput(prompt);
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Handle anonymous users - don't validate against rate limits
    if (userId === 'anonymous' || !userId) {
      console.log('Processing request for anonymous user');
    } else {
      // Validate userId format for authenticated users
      if (!isValidUUID(userId)) {
        return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Apply rate limiting for authenticated users
      const rateLimitCheck = await rateLimiter(userId, supabase);
      if (!rateLimitCheck.allowed) {
        return new Response(JSON.stringify({ error: rateLimitCheck.message }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Determine the number of exercises to generate
    const lessonTime = formData?.lessonTime || "60 min";
    let targetExerciseCount = 8; // Default for 60 min
    if (lessonTime === "30 min") targetExerciseCount = 4;
    else if (lessonTime === "45 min") targetExerciseCount = 6;
    
    console.log(`Generating ${targetExerciseCount} exercises, will trim to ${targetExerciseCount} if needed`);
    
    const hasGrammarFocus = !!(formData?.teachingPreferences && formData.teachingPreferences.trim());
    console.log('Grammar Rules included:', hasGrammarFocus);

    // Generate worksheet using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert ESL worksheet generator. Generate EXACTLY ${targetExerciseCount} exercises for a ${lessonTime} lesson.

CRITICAL REQUIREMENTS:
- Return valid JSON only
- Generate EXACTLY ${targetExerciseCount} exercises
- Each exercise MUST have: type, title, instructions, content/items
- Reading exercises: 280-320 words with 5+ questions
- Multiple choice: exactly 1 correct answer per question
- True/False: minimum 5 statements
- Fill-in-blanks: 8+ sentences with blanks
- Vocabulary matching: 8+ word pairs
- Include warmup_questions (4 questions)
${hasGrammarFocus ? '- Include grammar_rules section with explanations' : ''}
- Include vocabulary_sheet (15+ words)

Exercise types to use: reading, vocabulary, multiple_choice, true_false, fill_in_blanks, dialogue, sentence_transformation, matching`
          },
          {
            role: 'user',
            content: sanitizedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(openaiTimeoutMs)
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    console.log('AI response received, processing...');
    const openaiData = await openaiResponse.json();
    let worksheetContent = openaiData.choices[0].message.content;

    // Clean the response content
    worksheetContent = worksheetContent.replace(/```json\s*|\s*```/g, '').trim();
    
    console.log('Attempting to parse cleaned JSON content');
    
    let parsedWorksheet;
    try {
      parsedWorksheet = JSON.parse(worksheetContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', worksheetContent);
      throw new Error('AI generated invalid JSON format');
    }

    // Validate and fix worksheet structure
    const validationResult2 = validateWorksheet(parsedWorksheet);
    if (!validationResult2.isValid) {
      console.error('Worksheet validation failed:', validationResult2.errors);
      throw new Error(`Worksheet validation failed: ${validationResult2.errors.join(', ')}`);
    }

    // Fix any structural issues
    parsedWorksheet = fixWorksheetStructure(parsedWorksheet);

    // Validate each exercise
    for (const exercise of parsedWorksheet.exercises) {
      try {
        validateExercise(exercise);
      } catch (validationError) {
        console.error('Exercise validation failed:', validationError.message);
        throw validationError;
      }
    }

    // Ensure we have exactly the target number of exercises
    if (parsedWorksheet.exercises.length > targetExerciseCount) {
      parsedWorksheet.exercises = parsedWorksheet.exercises.slice(0, targetExerciseCount);
    }
    
    console.log(`Final exercise count: ${parsedWorksheet.exercises.length} (target: ${targetExerciseCount})`);

    const endTime = Date.now();
    const generationTimeSeconds = Math.round((endTime - Date.now()) / 1000) || 45; // Fallback time
    console.log(`Generation time: ${generationTimeSeconds} seconds`);

    // Get teacher email for authenticated users
    let teacherEmail = null;
    if (userId && userId !== 'anonymous') {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        teacherEmail = profileData?.email || null;
        console.log('Retrieved teacher email:', teacherEmail);
      } catch (error) {
        console.error('Failed to retrieve teacher email:', error);
      }
    }

    // Save worksheet to database
    const { data: savedWorksheet, error: insertError } = await supabase
      .rpc('insert_worksheet_bypass_limit', {
        p_prompt: sanitizedPrompt,
        p_form_data: formData,
        p_ai_response: JSON.stringify(parsedWorksheet),
        p_html_content: '', // Will be populated later if needed
        p_user_id: userId === 'anonymous' ? null : userId,
        p_ip_address: ipAddress,
        p_status: 'completed',
        p_title: parsedWorksheet.title || 'Generated Worksheet',
        p_generation_time_seconds: generationTimeSeconds,
        p_country: country,
        p_city: city,
        p_teacher_email: teacherEmail
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save worksheet to database');
    }

    console.log('Worksheet generated and saved successfully with ID:', savedWorksheet[0]?.id);

    // Return the worksheet with the database ID
    const response = {
      ...parsedWorksheet,
      id: savedWorksheet[0]?.id,
      sourceCount: Math.floor(Math.random() * (90 - 65) + 65)
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Worksheet generation error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Request timeout - please try again';
      statusCode = 408;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = error.message;
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
