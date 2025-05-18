
import { supabase } from '@/integrations/supabase/client';

/**
 * Submits feedback for a worksheet
 * 
 * @param worksheetId The ID of the worksheet
 * @param rating Rating value (1-5)
 * @param comment User comment (optional)
 * @param userId The ID of the user submitting feedback
 * @returns Promise with feedback submission result
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    // Check if the worksheet exists
    const { data: worksheetExists } = await supabase
      .from('worksheets')
      .select('id')
      .eq('id', worksheetId)
      .single();
    
    if (!worksheetExists) {
      console.warn(`Worksheet ${worksheetId} not found, skipping feedback submission`);
      return { error: 'Worksheet not found' };
    }

    // Insert the feedback
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([{
        worksheet_id: worksheetId,
        rating: rating,
        comment: comment || '',
        user_id: userId
      }])
      .select();
    
    if (error) {
      console.error('Error submitting feedback:', error);
      return { error: 'Failed to submit feedback' };
    }
    
    return data;
  } catch (error) {
    console.error('Error in submitFeedbackAPI:', error);
    return { error: 'Failed to submit feedback due to server error' };
  }
}

/**
 * Updates existing feedback with a comment
 * 
 * @param id Feedback ID
 * @param comment User comment
 * @param userId User ID for verification
 * @returns Promise with feedback update result
 */
export async function updateFeedbackAPI(id: string, comment: string, userId: string) {
  try {
    // Verify ownership
    const { data: feedback } = await supabase
      .from('feedbacks')
      .select('id, user_id')
      .eq('id', id)
      .single();
    
    if (!feedback) {
      return { error: 'Feedback not found' };
    }
    
    if (feedback.user_id !== userId) {
      return { error: 'Not authorized to update this feedback' };
    }
    
    // Update the feedback
    const { data, error } = await supabase
      .from('feedbacks')
      .update({
        comment: comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating feedback:', error);
      return { error: 'Failed to update feedback' };
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateFeedbackAPI:', error);
    return { error: 'Failed to update feedback due to server error' };
  }
}
