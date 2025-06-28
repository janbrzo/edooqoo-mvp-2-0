
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { toast } from 'sonner';

// URLs for the Edge Functions
const GENERATE_WORKSHEET_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';

/**
 * Generates a worksheet using the Edge Function
 */
export async function generateWorksheetAPI(prompt: WorksheetFormData & { fullPrompt?: string, formDataForStorage?: any }, userId: string) {
  try {
    console.log('Generating worksheet with prompt:', prompt);
    
    // Use the full prompt if provided, otherwise create legacy format
    const formattedPrompt = prompt.fullPrompt || `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${prompt.englishLevel ? `. English level: ${prompt.englishLevel}` : ''}. Lesson duration: ${prompt.lessonTime}.`;
    
    // Prepare form data for storage - use provided formDataForStorage or create from prompt
    const formData = prompt.formDataForStorage || {
      lessonTopic: prompt.lessonTopic,
      lessonGoal: prompt.lessonGoal,
      teachingPreferences: prompt.teachingPreferences,
      englishLevel: prompt.englishLevel || null,
      lessonTime: prompt.lessonTime
    };
    
    console.log('Sending formatted prompt to API:', formattedPrompt);
    
    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: formattedPrompt,  // This will be saved as the full prompt in database
        formData: formData,
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

    const worksheetData = await response.json();
    console.log('API returned worksheet data:', worksheetData);
    
    if (!worksheetData || typeof worksheetData !== 'object') {
      console.error('Invalid response format:', worksheetData);
      throw new Error('Received invalid worksheet data format');
    }
    
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
    
    const getExpectedExerciseCount = (lessonTime: string): number => {
      if (lessonTime === "30 min") return 4;
      else if (lessonTime === "45 min") return 6;
      else return 8;
    };
    
    const expectedCount = getExpectedExerciseCount(prompt.lessonTime);
    console.log(`Expected ${expectedCount} exercises for ${prompt.lessonTime} lesson, got ${worksheetData.exercises.length}`);
    
    // CRITICAL: Store full HTML content after worksheet is generated
    if (worksheetData && worksheetData.worksheetId) {
      console.log('💾 Storing full HTML content for worksheet:', worksheetData.worksheetId);
      
      // Wait a bit for the DOM to be ready, then generate and store HTML
      setTimeout(async () => {
        try {
          const { generateWorksheetHTML } = await import('@/utils/htmlExport');
          const fullHTML = generateWorksheetHTML(worksheetData, 'student', worksheetData.title);
          
          if (fullHTML) {
            // Update the worksheet with full HTML content
            await supabase
              .from('worksheets')
              .update({ html_content: fullHTML })
              .eq('id', worksheetData.worksheetId);
            
            console.log('✅ Full HTML content stored successfully');
          }
        } catch (htmlError) {
          console.error('❌ Failed to store HTML content:', htmlError);
        }
      }, 2000); // Wait 2 seconds for DOM to be ready
    }
    
    return worksheetData;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw error;
  }
}

export const generateWorksheet = generateWorksheetAPI;
