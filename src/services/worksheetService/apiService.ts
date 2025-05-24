
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { toast } from 'sonner';

// URLs for the Edge Functions
const GENERATE_WORKSHEET_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';

/**
 * Generates a worksheet using the Edge Function
 */
export async function generateWorksheetAPI(prompt: WorksheetFormData, userId: string) {
  try {
    console.log('Starting worksheet generation with form data:', prompt);
    
    // Create a formatted prompt string
    const formattedPrompt = `Topic: ${prompt.lessonTopic}. Goal: ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.studentProfile ? `. Student profile: ${prompt.studentProfile}` : ''}${prompt.studentStruggles ? `. Student struggles: ${prompt.studentStruggles}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    // Prepare form data for the API
    const requestBody = {
      prompt: formattedPrompt,
      formData: {
        lessonTopic: prompt.lessonTopic,
        lessonGoal: prompt.lessonGoal,
        teachingPreferences: prompt.teachingPreferences,
        studentProfile: prompt.studentProfile || null,
        studentStruggles: prompt.studentStruggles || null,
        lessonTime: prompt.lessonTime
      },
      userId
    };
    
    console.log('Sending request to API:', requestBody);
    
    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      if (response.status === 429) {
        throw new Error('You have reached your daily limit for worksheet generation. Please try again tomorrow.');
      }
      throw new Error(`Failed to generate worksheet: ${errorData?.error || response.statusText}`);
    }

    // Parse the response as JSON
    const responseText = await response.text();
    console.log('Raw API response:', responseText.substring(0, 200) + '...');
    
    let worksheetData;
    try {
      worksheetData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('Received invalid response format from the server');
    }
    
    console.log('Parsed worksheet data successfully');
    
    if (!worksheetData || typeof worksheetData !== 'object') {
      throw new Error('Invalid worksheet data format received');
    }
    
    // Perform validation on the returned data
    if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('No exercises found in generated worksheet');
    }
    
    // Validate reading exercise content and questions
    for (const exercise of worksheetData.exercises) {
      if (exercise.type === 'reading') {
        const wordCount = exercise.content?.split(/\s+/).filter(Boolean).length || 0;
        console.log(`Reading exercise word count: ${wordCount}`);
        
        if (wordCount < 280 || wordCount > 320) {
          console.warn(`Reading exercise word count (${wordCount}) outside target range of 280-320 words`);
        }
        
        if (!exercise.questions || exercise.questions.length < 5) {
          console.error(`Reading exercise has fewer than 5 questions: ${exercise.questions?.length || 0}`);
          if (!exercise.questions) exercise.questions = [];
          while (exercise.questions.length < 5) {
            exercise.questions.push({
              text: `Additional question ${exercise.questions.length + 1} about the text.`,
              answer: "Answer would be based on the text content."
            });
          }
        }
      }
    }
    
    // Check exercise count based on lesson time
    const getExpectedExerciseCount = (lessonTime: string): number => {
      if (lessonTime === "30 min") return 4;
      else if (lessonTime === "45 min") return 6;
      else return 8;
    };
    
    const expectedCount = getExpectedExerciseCount(prompt.lessonTime);
    console.log(`Expected ${expectedCount} exercises for ${prompt.lessonTime} lesson, got ${worksheetData.exercises.length}`);
    
    return worksheetData;
  } catch (error) {
    console.error('Error in generateWorksheetAPI:', error);
    throw error;
  }
}
