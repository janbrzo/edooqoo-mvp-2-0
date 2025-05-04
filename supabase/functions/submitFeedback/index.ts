
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
    
    if (!rating || !userId) {
      throw new Error('Missing required parameters: rating and userId are required');
    }

    console.log('Submitting feedback:', { worksheetId, rating, comment: comment?.substring(0, 20) + '...', userId });

    // Check if worksheet exists
    let shouldCreatePlaceholder = false;
    let actualWorksheetId = worksheetId;
    
    if (worksheetId && worksheetId !== 'unknown') {
      const { data: worksheetExists, error: existsError } = await supabase
        .from('worksheets')
        .select('id')
        .eq('id', worksheetId)
        .maybeSingle();

      if (existsError) {
        console.error('Error checking worksheet existence:', existsError);
      }

      if (!worksheetExists) {
        console.log(`Worksheet with ID ${worksheetId} not found, creating placeholder.`);
        shouldCreatePlaceholder = true;
      }
    } else {
      shouldCreatePlaceholder = true;
    }

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
          title: 'Generated Worksheet'
        })
        .select();

      if (placeholderError) {
        console.error('Error creating placeholder worksheet:', placeholderError);
        throw new Error(`Failed to create placeholder worksheet: ${placeholderError.message}`);
      }

      if (placeholderData && placeholderData.length > 0) {
        actualWorksheetId = placeholderData[0].id;
        console.log(`Created placeholder worksheet with ID: ${actualWorksheetId}`);
      } else {
        throw new Error('Failed to create placeholder worksheet');
      }
    }

    // Check if feedback for this worksheet and user already exists
    const { data: existingFeedback, error: existingFeedbackError } = await supabase
      .from('feedbacks')
      .select('id, comment')
      .eq('worksheet_id', actualWorksheetId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingFeedbackError) {
      console.error('Error checking existing feedback:', existingFeedbackError);
    }
    
    let feedback;
    
    // Update existing feedback or insert new one
    if (existingFeedback) {
      console.log('Updating existing feedback record:', existingFeedback.id);
      
      // Merge existing comment with new one if provided
      const updatedComment = comment || existingFeedback.comment || '';
      
      const { data: updatedFeedback, error: updateError } = await supabase
        .from('feedbacks')
        .update({
          rating: rating,
          comment: updatedComment
        })
        .eq('id', existingFeedback.id)
        .select();
        
      if (updateError) {
        console.error('Error updating feedback:', updateError);
        throw new Error(`Failed to update feedback: ${updateError.message}`);
      }
      
      feedback = updatedFeedback;
    } else {
      // Insert new feedback
      const { data: newFeedback, error: insertError } = await supabase
        .from('feedbacks')
        .insert({
          worksheet_id: actualWorksheetId,
          user_id: userId,
          rating,
          comment,
          status: 'new'
        })
        .select();
        
      if (insertError) {
        console.error('Error inserting feedback:', insertError);
        throw new Error(`Failed to create feedback: ${insertError.message}`);
      }
      
      feedback = newFeedback;
    }

    // Log event
    await supabase.from('events').insert({
      type: 'feedback',
      event_type: 'feedback',
      worksheet_id: actualWorksheetId,
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
