import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL for the Edge Function
const SUBMIT_FEEDBACK_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/submitFeedback';

/**
 * Submits feedback for a worksheet - ONLY creates feedback, never creates worksheet
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    console.log('Submitting feedback:', { worksheetId, rating, comment, userId });
    
    if (!worksheetId || !userId) {
      console.error('Missing required parameters for feedback:', { worksheetId, userId });
      throw new Error('Missing worksheet ID or user ID');
    }
    
    // Try using the edge function first
    try {
      const response = await fetch(SUBMIT_FEEDBACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId,
          rating,
          comment,
          userId,
          status: 'submitted'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Feedback submission successful via API:', result);
        toast.success('Thank you for your feedback!');
        return result.data;
      }
      
      const errorText = await response.text();
      // Only log as an error if the status is 500 or something critical.
      // A 404 for worksheet not found is an expected failure case.
      if (response.status >= 500) {
        console.error('Error submitting feedback via API:', errorText);
      } else {
        console.warn('API submission failed (likely worksheet not found):', errorText);
      }
    } catch (apiError) {
      console.error('API feedback submission error:', apiError);
    }
    
    // If edge function fails, try direct database submission (but never create worksheet)
    console.log('Edge function failed, falling back to direct DB insert.');
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        { 
          worksheet_id: worksheetId, 
          user_id: userId, 
          rating, 
          comment,
          status: 'submitted'
        }
      ])
      .select();
      
    if (error) {
      console.error('Direct feedback submission error:', error);
      
      // If worksheet doesn't exist, return a meaningful error - DO NOT CREATE WORKSHEET
      if (error.message.includes('violates foreign key constraint')) {
        throw new Error('Cannot submit feedback: worksheet not found or invalid');
      }
      
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
      
    toast.success('Thank you for your feedback!');
    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
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
