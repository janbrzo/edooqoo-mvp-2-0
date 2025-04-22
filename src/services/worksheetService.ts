
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

// URLs for the Edge Functions
const GENERATE_WORKSHEET_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';
const SUBMIT_FEEDBACK_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/submitFeedback';

/**
 * Generates a worksheet using the Edge Function
 */
export async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  try {
    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`,
        userId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error('You have reached your daily limit for worksheet generation. Please try again tomorrow.');
      }
      throw new Error(`Failed to generate worksheet: ${errorText}`);
    }

    const htmlContent = await response.text();
    return htmlContent;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw error;
  }
}

/**
 * Submits feedback for a worksheet
 */
export async function submitWorksheetFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
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
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Tracks an event (view, download, etc.)
 */
export async function trackEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  try {
    const { error } = await supabase.from('events').insert({
      type,
      event_type: type,
      worksheet_id: worksheetId,
      user_id: userId,
      metadata
    });

    if (error) throw error;
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
  }
}
