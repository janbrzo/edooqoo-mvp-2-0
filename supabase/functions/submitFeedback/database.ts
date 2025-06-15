
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SubmitFeedbackRequest } from './validation.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export interface FeedbackRecord {
  id: string;
  worksheet_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

export async function submitFeedbackToDatabase(feedbackData: SubmitFeedbackRequest): Promise<{ success: boolean; data?: FeedbackRecord; error?: string }> {
  try {
    console.log('=== DATABASE SUBMISSION START ===');
    console.log('Submitting feedback with data:', {
      worksheet_id: feedbackData.worksheetId,
      user_id: feedbackData.userId,
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      status: feedbackData.status
    });

    // First, let's check if the worksheet exists
    console.log('Checking if worksheet exists...');
    const { data: worksheetCheck, error: worksheetError } = await supabase
      .from('worksheets')
      .select('id')
      .eq('id', feedbackData.worksheetId)
      .single();

    if (worksheetError) {
      console.error('Error checking worksheet existence:', worksheetError);
      if (worksheetError.code === 'PGRST116') {
        return { success: false, error: 'Worksheet not found' };
      }
      return { success: false, error: `Database error: ${worksheetError.message}` };
    }

    console.log('Worksheet exists:', worksheetCheck);

    // Now insert the feedback
    console.log('Inserting feedback...');
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        {
          worksheet_id: feedbackData.worksheetId,
          user_id: feedbackData.userId,
          rating: feedbackData.rating,
          comment: feedbackData.comment || '',
          status: feedbackData.status
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return { success: false, error: error.message };
    }

    console.log('Feedback successfully inserted:', data);
    console.log('=== DATABASE SUBMISSION END ===');
    return { success: true, data };

  } catch (error) {
    console.error('Unexpected database error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}
