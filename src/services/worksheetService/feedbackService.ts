
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a rating for a worksheet
 * 
 * @param worksheetId ID of the worksheet
 * @param rating Rating (1-5)
 * @param comment User's comment (optional)
 * @param userId User's ID
 * @returns Promise with the result of sending the rating
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    // Verify data validity
    if (!worksheetId || !rating || rating < 1 || rating > 5) {
      throw new Error("Invalid feedback data");
    }
    
    console.log("submitFeedbackAPI - Starting with params:", { worksheetId, rating, userId });
    
    // Check if rating already exists
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('worksheet_id', worksheetId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Check existing feedback error:", checkError);
      throw new Error(`Error checking existing feedback: ${checkError.message}`);
    }
    
    console.log("Existing feedback check result:", existingFeedback);
    
    let response;
    
    if (existingFeedback) {
      // Update existing rating
      console.log("Updating existing feedback:", existingFeedback.id);
      response = await supabase
        .from('feedbacks')
        .update({ 
          rating,
          comment,
          status: 'updated'
        })
        .eq('id', existingFeedback.id);
    } else {
      // Add new rating
      console.log("Inserting new feedback");
      response = await supabase
        .from('feedbacks')
        .insert({
          worksheet_id: worksheetId,
          user_id: userId,
          rating,
          comment,
          status: 'submitted'
        });
    }
    
    console.log("Feedback upsert response:", response);
    
    if (response.error) {
      console.error("Feedback submission error:", response.error);
      throw new Error(`Error submitting feedback: ${response.error.message}`);
    }
    
    // Bezpieczne zwracanie danych - jeśli data jest null, zwróć null zamiast próbować dostępu do data[0]
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    throw error;
  }
}

/**
 * Updates a comment for an existing rating
 * 
 * @param id Rating ID
 * @param comment Comment
 * @param userId User's ID for verification
 * @returns Promise with the update result
 */
export async function updateFeedbackAPI(id: string, comment: string, userId: string) {
  try {
    console.log("updateFeedbackAPI - Starting with params:", { id, userId });
    
    // Verify the rating belongs to this user
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError || !existingFeedback) {
      console.error("Feedback not found error:", checkError);
      throw new Error("Feedback not found or access denied");
    }
    
    console.log("Existing feedback verified:", existingFeedback);
    
    // Update comment
    const { data, error } = await supabase
      .from('feedbacks')
      .update({ 
        comment,
        status: 'updated'
      })
      .eq('id', id)
      .select();
    
    console.log("Update feedback response:", { data, error });
    
    if (error) {
      console.error("Update feedback error:", error);
      throw new Error(`Error updating feedback comment: ${error.message}`);
    }
    
    // Poprawiona obsługa zwracanych danych
    if (!data) {
      return null;
    }
    
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error in updateFeedback:", error);
    throw error;
  }
}
