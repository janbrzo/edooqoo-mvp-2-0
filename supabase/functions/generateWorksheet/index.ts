
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { validateRequest, validateFormData, validateWorksheetContent } from './validators.ts';
import { checkRateLimit } from './rateLimiter.ts';
import { getClientIP, getGeolocation } from './geolocation.ts';
import { sanitizeInput, sanitizeWorksheetContent } from './security.ts';
import { generatePrompt, estimateExerciseCount, trimExercisesToLimit } from './helpers.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  let worksheetData: any = null;
  let title = '';

  try {
    // Validate request
    const validatedData = await validateRequest(req);
    const { prompt, formDataForStorage, userId, studentId } = validatedData;

    console.log('Received validated prompt:', prompt.substring(0, 100) + '...');

    // Get client information
    const clientIP = getClientIP(req);
    const { country, city } = await getGeolocation(clientIP);
    console.log('Geo data:', country, city);

    // Get user's email from profile
    let teacherEmail = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (profile?.email) {
        teacherEmail = profile.email;
        console.log('Retrieved teacher email:', teacherEmail);
      }
    } catch (error) {
      console.error('Error fetching teacher email:', error);
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(userId, clientIP);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded', 
        details: rateLimitResult.message 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate and sanitize form data
    const validatedFormData = validateFormData(formDataForStorage);
    const sanitizedPrompt = sanitizeInput(prompt);

    // Generate AI content
    const targetExerciseCount = estimateExerciseCount(validatedFormData.lessonTime);
    console.log(`Generating ${targetExerciseCount} exercises, will trim to ${targetExerciseCount} if needed`);

    const fullPrompt = generatePrompt(sanitizedPrompt, targetExerciseCount);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response received, processing...');

    // Process and validate AI response
    let cleanedContent = aiResponse;
    if (cleanedContent.includes('```json')) {
      cleanedContent = cleanedContent.split('```json')[1].split('```')[0].trim();
    } else if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent.split('```')[1].split('```')[0].trim();
    }

    console.log('Attempting to parse cleaned JSON content');
    
    try {
      worksheetData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid AI response format',
        details: 'Unable to parse worksheet content'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate worksheet structure
    const validationResult = validateWorksheetContent(worksheetData);
    if (!validationResult.isValid) {
      console.error('Worksheet validation failed:', validationResult.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid worksheet structure',
        details: validationResult.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize and trim exercises
    const sanitizedWorksheet = sanitizeWorksheetContent(worksheetData);
    const finalWorksheet = trimExercisesToLimit(sanitizedWorksheet, targetExerciseCount);

    console.log('Grammar Rules included:', !!finalWorksheet.grammar_rules);
    console.log(`Final exercise count: ${finalWorksheet.exercises?.length || 0} (target: ${targetExerciseCount})`);

    title = finalWorksheet.title || 'Generated Worksheet';

    // Calculate generation time
    const endTime = performance.now();
    const generationTimeSeconds = Math.round((endTime - startTime) / 1000);
    console.log(`Generation time: ${generationTimeSeconds} seconds`);

    // Store in database using the bypass function
    const { data: insertResult, error: insertError } = await supabase.rpc(
      'insert_worksheet_bypass_limit',
      {
        p_prompt: sanitizedPrompt,
        p_form_data: validatedFormData,
        p_ai_response: JSON.stringify(finalWorksheet),
        p_html_content: '',
        p_user_id: userId,
        p_ip_address: clientIP,
        p_status: 'completed',
        p_title: title,
        p_generation_time_seconds: generationTimeSeconds,
        p_country: country,
        p_city: city,
        p_teacher_email: teacherEmail
      }
    );

    if (insertError) {
      console.error('Database insertion error:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save worksheet',
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const worksheetId = insertResult?.[0]?.id;
    console.log('Worksheet generated and saved successfully with ID:', worksheetId);

    // Update student assignment if studentId provided
    if (studentId && worksheetId) {
      try {
        const { error: updateError } = await supabase
          .from('worksheets')
          .update({ student_id: studentId })
          .eq('id', worksheetId);

        if (updateError) {
          console.error('Error updating student assignment:', updateError);
        } else {
          console.log('Student assignment updated successfully');
        }
      } catch (error) {
        console.error('Error in student assignment update:', error);
      }
    }

    return new Response(JSON.stringify({
      worksheet: finalWorksheet,
      worksheetId: worksheetId,
      generationTime: generationTimeSeconds,
      sourceCount: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generateWorksheet function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Worksheet generation failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
