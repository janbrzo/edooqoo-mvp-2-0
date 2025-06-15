import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL for the Edge Function
const SUBMIT_FEEDBACK_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/submitFeedback';

/**
 * Submits feedback for a worksheet using the Edge Function
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    console.log('Submitting feedback via Edge Function:', { worksheetId, rating, comment, userId });
    
    if (!worksheetId || !userId) {
      console.error('Missing required parameters for feedback:', { worksheetId, userId });
      throw new Error('Missing worksheet ID or user ID');
    }

    // Basic client-side validation to prevent sending invalid IDs
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(worksheetId)) {
        console.error('Invalid worksheetId format for feedback submission:', worksheetId);
        throw new Error('Invalid Worksheet ID. Cannot submit feedback.');
    }

    const response = await fetch(SUBMIT_FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        worksheetId,
        rating,
        comment,
        userId
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Feedback submission failed with status: ' + response.status }));
        console.error('Error submitting feedback via API:', errorData.error);
        throw new Error(errorData.error || 'An unknown error occurred during feedback submission.');
    }
    
    const result = await response.json();
    console.log('Feedback submission successful via API:', result);
    return result.data;

  } catch (error) {
    console.error('Error during feedback submission process:', error);
    toast.error(`We couldn't submit your rating: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Updates existing feedback with a comment
 */
export async function updateFeedbackAPI(id: string, comment: string, userId: string) {
  try {
    console.log('Updating feedback with comment:', { id, comment });

    const { data, error } = await supabase
      .from('feedbacks')
      .update({ comment })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Error updating feedback:', error);
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
    
    console.log('Feedback updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
}
