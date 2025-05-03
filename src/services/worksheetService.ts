
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { trackWorksheetEvent } from './feedbackService';
import { createExercisePrompt } from '@/utils/exerciseTypeUtils';

// URLs for the Edge Functions
const GENERATE_WORKSHEET_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';

/**
 * Generates a worksheet using the Edge Function
 */
export async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  try {
    console.log('Generating worksheet with prompt:', prompt);
    
    // Create a formatted prompt string with detailed instructions on exercise count and types
    const formattedPrompt = `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    // Add specific exercise type requirements based on lesson time
    const exercisePrompt = createExercisePrompt(prompt.lessonTime);
    const fullPrompt = `${formattedPrompt}\n\n${exercisePrompt}`;
    
    console.log('Sending formatted prompt to API:', fullPrompt);
    
    // Track worksheet generation event
    try {
      await trackWorksheetEvent('generate', 'initial-request', userId, { prompt: formattedPrompt });
    } catch (trackError) {
      console.warn('Failed to track generation event, continuing anyway:', trackError);
    }
    
    // Make the request to generate the worksheet
    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
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
    
    // Validate the returned data
    if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('No exercises found in generated worksheet');
    }
    
    // Track successful generation with actual worksheet ID
    if (worksheetData.id) {
      try {
        await trackWorksheetEvent('view', worksheetData.id, userId);
      } catch (trackError) {
        console.warn('Failed to track view event, continuing anyway:', trackError);
      }
    }
    
    return worksheetData;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw error;
  }
}
