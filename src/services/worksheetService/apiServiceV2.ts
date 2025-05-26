
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

// Alternative API service using the V2 generation approach
const GENERATE_WORKSHEET_V2_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheetV2';

/**
 * Alternative worksheet generation with improved reliability
 */
export async function generateWorksheetV2API(prompt: WorksheetFormData, userId: string) {
  try {
    console.log('V2 API: Starting generation request');
    
    const formattedPrompt = `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    const formData = {
      lessonTopic: prompt.lessonTopic,
      lessonGoal: prompt.lessonGoal,
      teachingPreferences: prompt.teachingPreferences,
      studentProfile: prompt.studentProfile || null,
      studentStruggles: prompt.studentStruggles || null,
      lessonTime: prompt.lessonTime
    };
    
    console.log('V2 API: Formatted prompt:', formattedPrompt.substring(0, 200));
    console.log('V2 API: Sending request to V2 generation system');
    
    const response = await fetch(GENERATE_WORKSHEET_V2_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: formattedPrompt,
        formData: formData,
        userId
      })
    });

    console.log('V2 API: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('V2 API: Error response:', errorData);
      throw new Error(`V2 Generation failed (${response.status}): ${errorData?.error || response.statusText}`);
    }

    const worksheetData = await response.json();
    console.log('V2 API: Received worksheet data with', worksheetData?.exercises?.length, 'exercises');
    
    if (!worksheetData || !worksheetData.exercises) {
      console.error('V2 API: Invalid worksheet data structure');
      throw new Error('V2: Invalid worksheet data received from server');
    }
    
    return worksheetData;
  } catch (error) {
    console.error('V2 API: Error generating worksheet:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('V2: Network error - unable to connect to generation service');
    }
    throw error;
  }
}
