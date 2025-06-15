
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateSubmitFeedbackRequest, isValidUUID } from './validation.ts';
import { rateLimiter } from './rateLimiter.ts';
import { submitFeedbackToDatabase } from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log('Received simplified feedback submission request');

    // Validate input
    const validation = validateSubmitFeedbackRequest(requestData);
    if (!validation.isValid) {
      console.error('Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feedbackData = validation.validatedData!;

    // Additional UUID validation
    if (!isValidUUID(feedbackData.worksheetId) || !isValidUUID(feedbackData.userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format for worksheetId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimitKey = `${clientIp}:${feedbackData.userId}`;
    
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for: ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ error: 'Too many feedback submissions. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple direct feedback submission
    console.log('Submitting feedback directly to database');
    const result = await submitFeedbackToDatabase(feedbackData);

    if (!result.success) {
      console.error('Database operation failed:', result.error);
      
      // Handle foreign key constraint error gracefully
      if (result.error && result.error.includes('violates foreign key constraint')) {
        return new Response(
          JSON.stringify({ error: 'Cannot submit feedback: worksheet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to process feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Feedback processed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback submitted successfully',
        data: result.data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in submitFeedback function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
