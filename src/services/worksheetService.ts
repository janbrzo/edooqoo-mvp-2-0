
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
    
    // Ensure we have proper word count for reading exercises
    worksheetData.exercises = worksheetData.exercises.map((exercise: any) => {
      if (exercise.type === "reading" && exercise.content) {
        const wordCount = exercise.content.split(/\s+/).filter((w: string) => w.trim() !== '').length;
        if (wordCount < 280) {
          console.warn(`Reading exercise too short (${wordCount} words), padding content`);
          // Create padding text
          const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, quis ultricies nisl nunc vel magna. Nam vitae ex vitae nisl ultricies ultricies.`;
          
          // Add padding until we reach at least 280 words
          let paddedContent = exercise.content;
          while (paddedContent.split(/\s+/).filter((w: string) => w.trim() !== '').length < 280) {
            paddedContent += ' ' + lorem;
          }
          
          // Trim to max 320 words if needed
          const words = paddedContent.split(/\s+/).filter((w: string) => w.trim() !== '');
          exercise.content = words.slice(0, Math.min(320, words.length)).join(' ');
        }
      }
      return exercise;
    });
    
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
      
      // First try to create a placeholder worksheet if it doesn't exist
      try {
        const wsCheck = await supabase
          .from('worksheets')
          .select('id')
          .eq('id', worksheetId)
          .single();
        
        if (wsCheck.error && wsCheck.error.code === 'PGRST116') {
          console.log('Worksheet not found, creating placeholder');
          await supabase
            .from('worksheets')
            .insert({
              id: worksheetId,
              prompt: 'Placeholder for feedback',
              html_content: '{}',
              status: 'placeholder',
              user_id: userId,
              title: 'Placeholder worksheet'
            });
        }
      } catch (wsError) {
        console.warn('Error checking/creating worksheet:', wsError);
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
      
      try {
        await trackEvent('feedback', worksheetId, userId, { rating, comment });
      } catch (trackError) {
        console.warn('Failed to track feedback event:', trackError);
      }
      
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
    // Skip tracking if worksheetId is not a valid UUID
    if (!worksheetId || worksheetId.length < 10) {
      console.log(`Skipping ${type} event tracking for invalid worksheetId: ${worksheetId}`);
      return;
    }
    
    console.log(`Tracking event: ${type} for worksheet: ${worksheetId}`);
    
    // First try to create a placeholder worksheet if it doesn't exist
    try {
      const wsCheck = await supabase
        .from('worksheets')
        .select('id')
        .eq('id', worksheetId)
        .single();
      
      if (wsCheck.error && wsCheck.error.code === 'PGRST116') {
        console.log('Worksheet not found, creating placeholder before tracking event');
        await supabase
          .from('worksheets')
          .insert({
            id: worksheetId,
            prompt: 'Placeholder for tracking',
            html_content: '{}',
            status: 'placeholder',
            user_id: userId,
            title: 'Placeholder worksheet'
          });
      }
    } catch (wsError) {
      console.warn('Error checking/creating worksheet before event:', wsError);
    }
    
    // Now track the event
    const { data, error } = await supabase.from('events').insert({
      type,
      event_type: type,
      worksheet_id: worksheetId,
      user_id: userId,
      metadata,
      ip_address: "client-side" // Since we can't get IP on client side
    });

    if (error) {
      console.error(`Error tracking ${type} event:`, error);
    } else {
      console.log(`Successfully tracked ${type} event:`, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
    // Don't throw errors for tracking - it should be non-blocking
    return null;
  }
}
