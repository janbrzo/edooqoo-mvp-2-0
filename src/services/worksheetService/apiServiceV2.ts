
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

// Alternative API service using the V2 generation approach
const GENERATE_WORKSHEET_V2_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheetV2';

/**
 * Alternative worksheet generation with improved reliability
 */
export async function generateWorksheetV2API(prompt: WorksheetFormData, userId: string) {
  try {
    console.log('V2: Generating worksheet with improved system');
    
    const formattedPrompt = `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    const formData = {
      lessonTopic: prompt.lessonTopic,
      lessonGoal: prompt.lessonGoal,
      teachingPreferences: prompt.teachingPreferences,
      studentProfile: prompt.studentProfile || null,
      studentStruggles: prompt.studentStruggles || null,
      lessonTime: prompt.lessonTime
    };
    
    console.log('V2: Sending request to improved generation system');
    
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

    console.log('V2: API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('V2: API error data:', errorData);
      throw new Error(`V2 Generation failed: ${errorData?.error || response.statusText}`);
    }

    const worksheetData = await response.json();
    console.log('V2: Received worksheet data:', worksheetData);
    
    if (!worksheetData || !worksheetData.exercises) {
      throw new Error('V2: Invalid worksheet data received');
    }
    
    return worksheetData;
  } catch (error) {
    console.error('V2: Error generating worksheet:', error);
    throw error;
  }
}
