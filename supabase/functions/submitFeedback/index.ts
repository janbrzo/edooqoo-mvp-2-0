
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worksheetId, rating, comment, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!worksheetId || !rating || !userId) {
      throw new Error('Missing required parameters');
    }

    console.log('Submitting feedback:', { worksheetId, rating, comment: comment?.substring(0, 20) + '...', userId });

    // Insert feedback into database
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        worksheet_id: worksheetId,
        user_id: userId,
        rating,
        comment,
        status: 'submitted'
      })
      .select();

    if (feedbackError) {
      console.error('Error saving feedback to database:', feedbackError);
      throw new Error(`Failed to save feedback: ${feedbackError.message}`);
    }

    // Log event
    await supabase.from('events').insert({
      type: 'feedback',
      event_type: 'feedback',
      worksheet_id: worksheetId,
      user_id: userId,
      metadata: { rating, ip },
      ip_address: ip
    });

    console.log('Feedback submitted successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Feedback submitted successfully',
      data: feedback
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
