
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
  console.log('=== SUBMIT FEEDBACK FUNCTION CALLED ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log('Raw request data received:', JSON.stringify(requestData, null, 2));

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
    console.log('Validated feedback data:', JSON.stringify(feedbackData, null, 2));

    // Additional UUID validation
    if (!isValidUUID(feedbackData.worksheetId)) {
      console.error('Invalid worksheetId UUID format:', feedbackData.worksheetId);
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format for worksheetId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(feedbackData.userId)) {
      console.error('Invalid userId UUID format:', feedbackData.userId);
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format for userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('UUID validation passed for both worksheetId and userId');

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

    console.log('Rate limiting passed, proceeding to database submission');

    // Submit feedback to database
    const result = await submitFeedbackToDatabase(feedbackData);

    if (!result.success) {
      console.error('Database submission failed:', result.error);
      
      // Handle foreign key constraint error gracefully
      if (result.error && result.error.includes('violates foreign key constraint')) {
        console.error('Foreign key constraint violation - worksheet not found');
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

    console.log('Feedback submitted successfully:', result.data);
    
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
