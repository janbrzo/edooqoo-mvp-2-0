
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

    console.log('Submitting feedback:', { worksheetId, rating, comment: comment?.substring(0, 20) + '...', userId, ip });

    // First check if worksheet exists
    const { data: worksheetCheck, error: worksheetCheckError } = await supabase
      .from('worksheets')
      .select('id')
      .eq('id', worksheetId)
      .single();
    
    if (worksheetCheckError) {
      console.log('Worksheet check error:', worksheetCheckError);
      // If worksheet doesn't exist, we need to create a temporary one
      if (worksheetCheckError.code === 'PGRST116') {
        console.log('Worksheet not found, creating placeholder');
        const { data: newWorksheet, error: newWorksheetError } = await supabase
          .from('worksheets')
          .insert({
            id: worksheetId,
            prompt: 'Placeholder for feedback',
            html_content: '{}',
            status: 'placeholder',
            user_id: userId,
            ip_address: ip,
            title: 'Placeholder worksheet'
          })
          .select();
        
        if (newWorksheetError) {
          console.error('Error creating placeholder worksheet:', newWorksheetError);
          throw new Error(`Failed to create placeholder worksheet: ${newWorksheetError.message}`);
        } else {
          console.log('Created placeholder worksheet:', newWorksheet);
        }
      }
    }

    // Insert feedback into database
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        worksheet_id: worksheetId,
        user_id: userId,
        rating,
        comment: comment || '',
        status: 'new'
      })
      .select();

    if (feedbackError) {
      console.error('Error saving feedback to database:', feedbackError);
      throw new Error(`Failed to save feedback: ${feedbackError.message}`);
    }

    // Log event
    const { error: eventError } = await supabase.from('events').insert({
      type: 'feedback',
      event_type: 'feedback',
      worksheet_id: worksheetId,
      user_id: userId,
      metadata: { rating, comment: comment || '', ip },
      ip_address: ip
    });

    if (eventError) {
      console.error('Error logging feedback event:', eventError);
      // Continue even if event logging fails
    }

    console.log('Feedback submitted successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Feedback submitted successfully',
      data: feedback
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while submitting feedback',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
