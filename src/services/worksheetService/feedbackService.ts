import { supabase } from '@/integrations/supabase/client';

/**
 * Submits new feedback for a worksheet
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    console.log(`Submitting feedback for worksheet ${worksheetId} with rating ${rating} and comment "${comment}"`);
    
    // Check if this user has already submitted feedback for this worksheet
    const { data: existingFeedback, error: checkError } = await supabase
      .from('worksheet_feedback')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .eq('user_id', userId);
    
    if (checkError) {
      console.error('Error checking existing feedback:', checkError);
      throw new Error(`Failed to submit feedback: ${checkError.message}`);
    }
    
    // If user has already submitted feedback, update it
    if (existingFeedback && Array.isArray(existingFeedback) && existingFeedback.length > 0) {
      console.log('User has already submitted feedback, updating...');
      return updateFeedbackAPI(existingFeedback[0].id, comment, userId, rating);
    }
    
    // Otherwise, insert new feedback
    const { data, error } = await supabase
      .from('worksheet_feedback')
      .insert({
        worksheet_id: worksheetId,
        user_id: userId,
        rating,
        comment: comment || null
      })
      .select();
    
    if (error) {
      console.error('Error submitting feedback:', error);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
    
    console.log('Feedback submitted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in submitFeedbackAPI:', error);
    throw error;
  }
}

/**
 * Updates existing feedback with a new comment or rating
 */
export async function updateFeedbackAPI(id: string, comment: string, userId: string, newRating?: number) {
  try {
    console.log(`Updating feedback ${id} with comment "${comment}" and rating ${newRating || 'unchanged'}`);
    
    // Prepare update object
    const updateData: any = {};
    
    // Add comment if provided
    if (comment !== undefined && comment !== null) {
      updateData.comment = comment;
    }
    
    // Add new rating if provided
    if (newRating !== undefined && newRating !== null) {
      updateData.rating = newRating;
    }
    
    updateData.updated_at = new Date().toISOString();
    
    // Update the feedback
    const { data, error } = await supabase
      .from('worksheet_feedback')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)  // Security check
      .select();
    
    if (error) {
      console.error('Error updating feedback:', error);
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
    
    // Check if data is an array and has items
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('Feedback updated successfully:', data);
      return data[0];
    } else {
      console.log('Feedback update returned no data:', data);
      return null;
    }
  } catch (error) {
    console.error('Error in updateFeedbackAPI:', error);
    throw error;
  }
}
