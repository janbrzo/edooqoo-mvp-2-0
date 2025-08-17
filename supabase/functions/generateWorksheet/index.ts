
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateWorksheetRequest } from './validators.ts';
import { checkRateLimit } from './rateLimiter.ts';
import { validateSecurity } from './security.ts';
import { getLocation } from './geolocation.ts';
import { 
  sanitizeFormData, 
  formatPrompt, 
  generateWorksheetContent,
  processWorksheetResponse 
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header and validate user
    const authHeader = req.headers.get('Authorization');
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    console.log(`Request from IP: ${clientIP}`);

    // Security validation
    const securityResult = await validateSecurity(req, clientIP, userAgent);
    if (!securityResult.valid) {
      return new Response(
        JSON.stringify({ error: securityResult.reason }),
        { status: securityResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user (can be anonymous or authenticated)
    let user = null;
    let userEmail = null;
    if (authHeader) {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        if (authUser) {
          user = authUser;
          // Get user email - for registered users it's user.email, for anonymous users it's null
          userEmail = user.email || null;
          
          // If user is registered, try to get email from profile as backup
          if (!userEmail && !user.is_anonymous) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', user.id)
              .single();
            userEmail = profile?.email || null;
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }

    const userId = user?.id || null;
    console.log(`User ID: ${userId}, Email: ${userEmail}, Anonymous: ${user?.is_anonymous}`);

    // Parse and validate request
    const body = await req.json();
    const validation = validateWorksheetRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(clientIP, userId);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: rateLimitResult.error,
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          } 
        }
      );
    }

    // Token consumption for registered users
    if (userId && !user?.is_anonymous) {
      const { data: tokenConsumed, error: tokenError } = await supabase
        .rpc('consume_token', { p_teacher_id: userId, p_worksheet_id: crypto.randomUUID() });
      
      if (tokenError || !tokenConsumed) {
        console.log('Token consumption failed:', tokenError);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient tokens. Please upgrade your plan or purchase more tokens.',
            code: 'INSUFFICIENT_TOKENS'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Token consumed successfully for user:', userId);
    }

    // Get location data
    const location = await getLocation(clientIP);
    console.log(`Location: ${location.city}, ${location.country}`);

    // Sanitize and process form data
    const sanitizedData = sanitizeFormData(validation.data);
    const fullPrompt = formatPrompt(sanitizedData);
    
    console.log('Starting worksheet generation...');
    const startTime = Date.now();

    // Generate worksheet content
    const aiResponse = await generateWorksheetContent(fullPrompt);
    const processingResult = await processWorksheetResponse(aiResponse, sanitizedData);
    
    const generationTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(`Generation completed in ${generationTimeSeconds} seconds`);

    // Save worksheet to database
    const { data: worksheetData, error: saveError } = await supabase
      .rpc('insert_worksheet_bypass_limit', {
        p_prompt: fullPrompt,
        p_form_data: sanitizedData,
        p_ai_response: aiResponse,
        p_html_content: processingResult.htmlContent,
        p_user_id: userId,
        p_ip_address: clientIP,
        p_status: 'completed',
        p_title: processingResult.title,
        p_generation_time_seconds: generationTimeSeconds,
        p_country: location.country,
        p_city: location.city,
        p_teacher_email: userEmail // Pass teacher email to the function
      });

    if (saveError) {
      console.error('Error saving worksheet:', saveError);
      throw new Error('Failed to save worksheet');
    }

    const worksheetId = worksheetData?.[0]?.id;
    console.log(`Worksheet saved with ID: ${worksheetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        worksheet: processingResult.worksheet,
        worksheetId: worksheetId,
        generationTime: generationTimeSeconds,
        sourceCount: processingResult.sourceCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generateWorksheet:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
