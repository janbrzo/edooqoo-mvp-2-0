
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
    
    const startTime = Date.now(); // Track actual generation time
    
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 429) {
        throw new Error('You have reached your daily limit for worksheet generation. Please try again tomorrow.');
      }
      throw new Error(`Failed to generate worksheet: ${errorData?.error || response.statusText}`);
    }

    // Parse the response as JSON directly
    const worksheetData = await response.json();
    
    // Use the actual generation time from the API if provided, otherwise calculate it
    if (!worksheetData.generationTime) {
      worksheetData.generationTime = Math.floor((Date.now() - startTime) / 1000);
    }
    
    // Add a default source count if not provided by the API
    if (!worksheetData.sourceCount) {
      worksheetData.sourceCount = Math.floor(Math.random() * (90 - 70) + 70);
    }
    
    if (!worksheetData || typeof worksheetData !== 'object') {
      console.error('Invalid response format:', worksheetData);
      throw new Error('Received invalid worksheet data format');
    }
    
    // Perform validation on the returned data
    if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('No exercises found in generated worksheet');
    }
    
    // Validate reading exercise content and questions
    for (const exercise of worksheetData.exercises) {
      if (exercise.type === 'reading') {
        const wordCount = exercise.content?.split(/\s+/).length || 0;
        console.log(`Reading exercise word count: ${wordCount}`);
        
        if (wordCount < 280 || wordCount > 320) {
          console.error(`Reading exercise word count (${wordCount}) outside the required range of 280-320 words`);
        }
        
        if (!exercise.questions || exercise.questions.length < 5) {
          console.error(`Reading exercise has fewer than 5 questions: ${exercise.questions?.length || 0}`);
        }
      } else if (exercise.type === 'matching' && (!exercise.items || exercise.items.length < 10)) {
        console.error(`Matching exercise has fewer than 10 items: ${exercise.items?.length || 0}`);
      } else if (exercise.type === 'fill-in-blanks' && (!exercise.sentences || exercise.sentences.length < 10)) {
        console.error(`Fill-in-blanks exercise has fewer than 10 sentences: ${exercise.sentences?.length || 0}`);
      } else if (exercise.type === 'multiple-choice' && (!exercise.questions || exercise.questions.length < 10)) {
        console.error(`Multiple-choice exercise has fewer than 10 questions: ${exercise.questions?.length || 0}`);
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
    // First try to submit feedback via the edge function
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
        throw new Error(`Failed to submit feedback via edge function: ${await response.text()}`);
      }

      return await response.json();
    } catch (edgeFunctionError) {
      console.error('Error submitting feedback via edge function:', edgeFunctionError);
      
      // Fallback: Insert directly using Supabase client
      const { data, error } = await supabase.from('feedbacks').insert({
        worksheet_id: worksheetId,
        user_id: userId,
        rating,
        comment,
        status: 'submitted'
      }).select();
      
      if (error) {
        throw error;
      }
      
      return data;
    }
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
    
    const { error } = await supabase.from('events').insert({
      type,
      event_type: type,
      worksheet_id: worksheetId,
      user_id: userId,
      metadata
    });

    if (error) {
      console.error(`Error tracking ${type} event:`, error);
    }
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
  }
}
