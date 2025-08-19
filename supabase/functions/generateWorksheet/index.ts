
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { validateWorksheetRequest } from './validators.ts';
import { checkRateLimit } from './rateLimiter.ts';
import { getLocationData } from './geolocation.ts';
import { checkSecurityLimits } from './security.ts';
import { 
  promptFormatter, 
  structureFormatter, 
  responseProcessor, 
  errorHandler,
  logWorksheetGeneration 
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase;
  let startTime = Date.now();
  let worksheetData = null;
  let userId = null;
  let userEmail = null;

  try {
    // Initialize Supabase client
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user authentication
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (!authError && user) {
        userId = user.id;
        userEmail = user.email;
        console.log('Authenticated user:', userId, userEmail);
      }
    }

    // Parse request body
    const body = await req.json();
    console.log('Request body received:', body);

    // Validate the request
    const validation = validateWorksheetRequest(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, formData, userAgent, referrerUrl, sessionId } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Get location data
    const locationData = await getLocationData(ipAddress);
    
    // Check security limits
    const securityCheck = await checkSecurityLimits(supabase, ipAddress, userAgent);
    if (!securityCheck.allowed) {
      return new Response(JSON.stringify({ error: securityCheck.reason }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(supabase, ipAddress, userId);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: rateLimitCheck.message,
        isTokenLimited: rateLimitCheck.isTokenLimited 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the prompt for OpenAI
    const formattedPrompt = promptFormatter(prompt, formData);
    console.log('Formatted prompt length:', formattedPrompt.length);

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [{ role: 'user', content: formattedPrompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const rawResponse = openAIData.choices[0].message.content;
    
    // Process the response
    const processedData = responseProcessor(rawResponse, formData);
    worksheetData = processedData;

    // Calculate generation time
    const generationTime = Math.round((Date.now() - startTime) / 1000);

    // Get teacher email from profile if user is authenticated
    let teacherEmail = userEmail;
    if (userId && !teacherEmail) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (profile?.email) {
          teacherEmail = profile.email;
        }
      } catch (error) {
        console.log('Could not fetch teacher email from profile:', error);
      }
    }

    // Save to database using the existing function
    const { data: savedWorksheet, error: saveError } = await supabase.rpc(
      'insert_worksheet_bypass_limit',
      {
        p_prompt: prompt,
        p_form_data: formData,
        p_ai_response: JSON.stringify(worksheetData),
        p_html_content: structureFormatter(worksheetData),
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_status: 'completed',
        p_title: worksheetData.title || 'English Worksheet',
        p_generation_time_seconds: generationTime,
        p_country: locationData.country,
        p_city: locationData.city,
        p_teacher_email: teacherEmail  // Now properly saving teacher_email
      }
    );

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error('Failed to save worksheet to database');
    }

    console.log('Worksheet saved successfully:', savedWorksheet);

    // Log the generation
    await logWorksheetGeneration(supabase, userId, savedWorksheet[0].id, generationTime);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      worksheetData,
      worksheetId: savedWorksheet[0].id,
      generationTime,
      title: worksheetData.title || 'English Worksheet'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateWorksheet function:', error);
    
    return errorHandler(error, {
      corsHeaders,
      supabase,
      userId,
      worksheetData,
      startTime
    });
  }
});
