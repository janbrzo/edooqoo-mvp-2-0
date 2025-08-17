
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { RateLimiter } from './rateLimiter.ts';
import { validatePrompt, getExpectedExerciseCount } from './validators.ts';
import { checkAuth, logSecurityEvent } from './security.ts';
import { getLocationData } from './geolocation.ts';
import { 
  generateWorksheetContent, 
  saveWorksheetToDatabase, 
  createWorksheetResponse 
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize rate limiter
const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { prompt, formData, userId, studentId } = await req.json();
    
    console.log('[generateWorksheet] Request received:', {
      hasPrompt: !!prompt,
      hasFormData: !!formData,
      userId: userId || 'anonymous',
      studentId: studentId || 'none'
    });

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    // For anonymous users, use IP for rate limiting
    // For authenticated users, use userId
    const rateLimitKey = userId || clientIP;
    
    // Check rate limit
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`[generateWorksheet] Rate limit exceeded for: ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ error: 'You have reached your daily limit for worksheet generation. Please try again tomorrow.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate prompt
    if (!validatePrompt(prompt)) {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get location data
    const locationData = await getLocationData(clientIP);
    
    // Generate worksheet content using OpenAI
    const worksheetContent = await generateWorksheetContent(prompt, formData);
    
    // Save to database - pass all required data including teacher_email
    const worksheetData = await saveWorksheetToDatabase(
      supabase,
      {
        prompt,
        formData,
        worksheetContent,
        userId: userId || null, // Allow null for anonymous users
        studentId: studentId || null,
        locationData,
        clientIP,
        userAgent: req.headers.get('user-agent') || null
      }
    );
    
    // Create response
    const response = createWorksheetResponse(worksheetContent, worksheetData);
    
    console.log('[generateWorksheet] Success:', { 
      worksheetId: response.id,
      userId: userId || 'anonymous'
    });
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generateWorksheet] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate worksheet. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
