
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
    console.log('Generating worksheet with prompt:', prompt);
    
    // Create a formatted prompt string
    const formattedPrompt = `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    console.log('Sending formatted prompt to API:', formattedPrompt);
    
    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: formattedPrompt,
        userId
      })
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API error data:', errorData);
      
      if (response.status === 429) {
        throw new Error('You have reached your daily limit for worksheet generation. Please try again tomorrow.');
      }
      throw new Error(`Failed to generate worksheet: ${errorData?.error || response.statusText}`);
    }

    // Parse the response as JSON directly
    const worksheetData = await response.json();
    console.log('API returned worksheet data:', worksheetData);
    
    if (!worksheetData || typeof worksheetData !== 'object') {
      console.error('Invalid response format:', worksheetData);
      throw new Error('Received invalid worksheet data format');
    }
    
    // Perform validation on the returned data
    if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('No exercises found in generated worksheet');
    }
    
    // Track view event if worksheetId exists
    if (worksheetData.id && userId) {
      try {
        await trackEvent('view', worksheetData.id, userId);
        console.log('View event tracked for worksheet:', worksheetData.id);
      } catch (trackError) {
        console.warn('Failed to track view event:', trackError);
      }
    }
    
    return worksheetData;
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
    console.log('Submitting feedback:', { worksheetId, rating, comment: comment?.substring(0, 20) || '', userId });
    
    // Try using the edge function
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
      const errorData = await response.json().catch(() => ({
        error: `HTTP error: ${response.status} ${response.statusText}`
      }));
      console.error('Error submitting feedback via API:', errorData);
      
      // Fallback to direct Supabase insert if edge function fails
      console.log('Falling back to direct Supabase insert...');
      
      // First check if worksheet exists
      const { data: worksheetCheck, error: worksheetCheckError } = await supabase
        .from('worksheets')
        .select('id')
        .eq('id', worksheetId)
        .single();
      
      // If worksheet doesn't exist, create a placeholder
      if (worksheetCheckError || !worksheetCheck) {
        console.log('Worksheet not found, creating placeholder');
        const { error: newWorksheetError } = await supabase
          .from('worksheets')
          .insert({
            id: worksheetId,
            prompt: 'Placeholder for feedback',
            html_content: '{}',
            status: 'placeholder',
            user_id: userId,
            ip_address: 'client-side',
            title: 'Placeholder worksheet'
          });
        
        if (newWorksheetError) {
          console.error('Error creating placeholder worksheet:', newWorksheetError);
          throw new Error(`Failed to create placeholder worksheet: ${newWorksheetError.message}`);
        }
      }
      
      // Now insert the feedback
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          worksheet_id: worksheetId, 
          user_id: userId, 
          rating, 
          comment: comment || '',
          status: 'new'
        });
        
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }
        
      await trackEvent('feedback', worksheetId, userId, { rating, comment });
      return data;
    }
    
    const result = await response.json();
    console.log('Feedback submission successful:', result);
    
    // Even if submission was successful via edge function, also track the event
    try {
      await trackEvent('feedback', worksheetId, userId, { rating, comment });
    } catch (trackError) {
      console.warn('Failed to track feedback event:', trackError);
    }
    
    return result;
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
    // Skip tracking if worksheetId is invalid
    if (!worksheetId) {
      console.log(`Skipping ${type} event tracking for invalid worksheetId: ${worksheetId}`);
      return;
    }
    
    console.log(`Tracking event: ${type} for worksheet: ${worksheetId}`);
    
    // Dodawanie zdarzenia bezpośrednio do bazy danych
    const { data, error } = await supabase.from('events').insert({
      type,
      event_type: type,
      worksheet_id: worksheetId,
      user_id: userId,
      metadata,
      ip_address: "client-side" // Ponieważ nie możemy uzyskać adresu IP po stronie klienta
    });

    if (error) {
      console.error(`Error tracking ${type} event:`, error);
      throw error;
    }
    
    console.log(`Successfully tracked ${type} event`);
    return data;
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
    // Zwróć błąd, ale nie przerywaj wykonywania
    return null;
  }
}
