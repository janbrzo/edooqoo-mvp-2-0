
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security utilities
function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

function validateRating(rating: number): { isValid: boolean; error?: string } {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return { isValid: false, error: 'Rating must be a number' };
  }
  
  if (rating < 1 || rating > 5) {
    return { isValid: false, error: 'Rating must be between 1 and 5' };
  }
  
  return { isValid: true };
}

function validateComment(comment: string): { isValid: boolean; error?: string } {
  if (typeof comment !== 'string') {
    return { isValid: false, error: 'Comment must be a string' };
  }
  
  if (comment.length > 2000) {
    return { isValid: false, error: 'Comment must be less than 2000 characters' };
  }
  
  return { isValid: true };
}

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worksheetId, rating, comment, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Input validation
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.isValid) {
      return new Response(
        JSON.stringify({ error: ratingValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId format
    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate comment if provided
    if (comment) {
      const commentValidation = validateComment(comment);
      if (!commentValidation.isValid) {
        return new Response(
          JSON.stringify({ error: commentValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting
    const rateLimitKey = `${ip}_${userId}`;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP/User: ${ip}/${userId}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedComment = comment ? sanitizeInput(comment, 2000) : null;
    
    console.log('Submitting feedback:', { 
      worksheetId: worksheetId?.substring(0, 8) + '...', 
      rating, 
      comment: sanitizedComment?.substring(0, 20) + '...', 
      userId: userId?.substring(0, 8) + '...' 
    });

    // Check if worksheet exists and user has access to it
    let shouldCreatePlaceholder = false;
    
    if (worksheetId && worksheetId !== 'unknown') {
      // Validate worksheetId format
      if (!isValidUUID(worksheetId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid worksheet ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: worksheetExists, error: existsError } = await supabase
        .from('worksheets')
        .select('id, user_id')
        .eq('id', worksheetId)
        .maybeSingle();

      if (existsError) {
        console.error('Error checking worksheet existence:', existsError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify worksheet access' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!worksheetExists) {
        console.log(`Worksheet with ID ${worksheetId} not found, creating placeholder.`);
        shouldCreatePlaceholder = true;
      }
    } else {
      shouldCreatePlaceholder = true;
    }

    let actualWorksheetId = worksheetId;

    // Create placeholder worksheet if needed
    if (shouldCreatePlaceholder) {
      const { data: placeholderData, error: placeholderError } = await supabase
        .from('worksheets')
        .insert({
          prompt: 'Generated worksheet',
          html_content: JSON.stringify({ title: 'Generated Worksheet', exercises: [] }),
          user_id: userId,
          ip_address: ip,
          status: 'created',
          title: 'Generated Worksheet',
          form_data: {},
          ai_response: 'Placeholder response'
        })
        .select()
        .single();

      if (placeholderError) {
        console.error('Error creating placeholder worksheet:', placeholderError);
        return new Response(
          JSON.stringify({ error: 'Failed to create worksheet record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (placeholderData) {
        actualWorksheetId = placeholderData.id;
        console.log(`Created placeholder worksheet with ID: ${actualWorksheetId}`);
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to create worksheet record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert feedback into database with explicit status value
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        worksheet_id: actualWorksheetId,
        user_id: userId,
        rating,
        comment: sanitizedComment,
        status: 'submitted'
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback to database:', feedbackError);
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Feedback submitted successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Feedback submitted successfully',
      data: { id: feedback.id }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred while submitting feedback' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
