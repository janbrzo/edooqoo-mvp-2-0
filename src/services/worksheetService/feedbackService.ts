
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL for the Edge Function
const SUBMIT_FEEDBACK_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/submitFeedback';

/**
 * Submits feedback for a worksheet - ONLY creates feedback, never creates worksheet
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    console.log('=== FEEDBACK SERVICE START ===');
    console.log('Submitting feedback with params:', { worksheetId, rating, comment, userId });
    
    if (!worksheetId || !userId) {
      console.error('Missing required parameters:', { worksheetId, userId });
      throw new Error('Missing worksheet ID or user ID');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(worksheetId)) {
      console.error('Invalid worksheetId format:', worksheetId);
      throw new Error('Invalid worksheet ID format');
    }
    
    if (!uuidRegex.test(userId)) {
      console.error('Invalid userId format:', userId);
      throw new Error('Invalid user ID format');
    }

    console.log('UUID validation passed, calling Edge Function...');
    
    // Call the edge function
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

    console.log('Edge Function response status:', response.status);
    console.log('Edge Function response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('Edge Function success:', result);
      toast.success('Thank you for your feedback!');
      return result.data;
    }
    
    const errorData = await response.text();
    console.error('Edge Function error response:', errorData);
    
    // Parse error if it's JSON
    let errorMessage = 'Failed to submit feedback';
    try {
      const parsedError = JSON.parse(errorData);
      errorMessage = parsedError.error || errorMessage;
    } catch (e) {
      errorMessage = errorData || errorMessage;
    }
    
    throw new Error(errorMessage);
      
  } catch (error) {
    console.error('Error in submitFeedbackAPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`We couldn't submit your rating: ${errorMessage}`);
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
