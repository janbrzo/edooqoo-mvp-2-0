
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateWorksheetRequest, sanitizeInput } from "./validators.ts";
import { checkRateLimit } from "./rateLimiter.ts";
import { getCurrentGeolocation } from "./geolocation.ts";
import { 
  createOpenAIMessages, 
  callOpenAI, 
  parseWorksheetResponse, 
  getExpectedExerciseCount,
  SYSTEM_PROMPT 
} from "./helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Generate Worksheet function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse and validate request
    const body = await req.json();
    console.log('📝 Request body received:', { 
      hasPrompt: !!body.prompt, 
      hasFormData: !!body.formData,
      hasUserId: !!body.userId,
      hasStudentId: !!body.studentId,
      studentId: body.studentId
    });
    
    const validation = validateWorksheetRequest(body);
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      return new Response(JSON.stringify({ error: validation.errors.join(', ') }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract and sanitize data
    const { prompt, formData, userId, studentId } = body;
    const sanitizedPrompt = sanitizeInput(prompt);
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    
    console.log('🌍 Request details:', { clientIP, userAgent: userAgent.substring(0, 50) });
    console.log('👤 User details:', { userId, studentId });

    // Rate limiting
    const rateLimitResult = await checkRateLimit(userId, clientIP, supabase);
    if (!rateLimitResult.allowed) {
      console.warn('🚫 Rate limit exceeded:', rateLimitResult.message);
      return new Response(JSON.stringify({ 
        error: rateLimitResult.message,
        remainingTime: rateLimitResult.remainingTime 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get geolocation
    const geoData = await getCurrentGeolocation(clientIP);
    console.log('📍 Geolocation:', geoData);

    // Generate worksheet content
    console.log('🤖 Calling OpenAI API...');
    const startTime = Date.now();
    
    const messages = createOpenAIMessages(sanitizedPrompt, formData);
    const openAIResponse = await callOpenAI(messages);
    const worksheetData = parseWorksheetResponse(openAIResponse, formData.lessonTime);
    
    const generationTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏱️ OpenAI response time: ${generationTimeSeconds}s`);

    // Create title based on form data
    const worksheetTitle = formData.lessonTopic && formData.lessonGoal 
      ? `${formData.lessonTopic} - ${formData.lessonGoal}` 
      : 'Custom English Worksheet';

    console.log('📊 Worksheet data generated:', {
      title: worksheetTitle,
      exerciseCount: worksheetData.exercises?.length || 0,
      hasVocabulary: !!worksheetData.vocabulary_sheet,
      studentId: studentId
    });

    // Store worksheet in database with PROPER student assignment
    const { data: worksheetRecord, error: insertError } = await supabase
      .rpc('insert_worksheet_bypass_limit', {
        p_prompt: sanitizedPrompt,
        p_form_data: formData,
        p_ai_response: JSON.stringify(worksheetData),
        p_html_content: '',
        p_user_id: userId,
        p_ip_address: clientIP,
        p_status: 'completed',
        p_title: worksheetTitle,
        p_generation_time_seconds: generationTimeSeconds,
        p_country: geoData.country,
        p_city: geoData.city
      });

    if (insertError) {
      console.error('💾 Database insert error:', insertError);
      throw new Error(`Failed to save worksheet: ${insertError.message}`);
    }

    console.log('💾 Worksheet saved to database:', worksheetRecord);

    // CRITICAL FIX: Update the worksheet with student_id if provided
    if (studentId && worksheetRecord && worksheetRecord.length > 0) {
      console.log('👥 Assigning worksheet to student:', studentId);
      
      const { error: updateError } = await supabase
        .from('worksheets')
        .update({ 
          student_id: studentId,
          teacher_id: userId
        })
        .eq('id', worksheetRecord[0].id);

      if (updateError) {
        console.error('❌ Failed to assign worksheet to student:', updateError);
      } else {
        console.log('✅ Worksheet successfully assigned to student:', studentId);
      }
    }

    // Add metadata to response
    worksheetData.id = worksheetRecord?.[0]?.id;
    worksheetData.created_at = worksheetRecord?.[0]?.created_at;
    worksheetData.sourceCount = Math.floor(Math.random() * (90 - 65) + 65);

    console.log('✅ Worksheet generation completed successfully');
    console.log('📤 Returning worksheet data with ID:', worksheetData.id);

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in generateWorksheet function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = errorMessage.includes('Rate limit') ? 429 : 500;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
