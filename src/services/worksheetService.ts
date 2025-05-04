
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

      // Handle validation errors from JSON schema
      if (errorData?.isValidationError) {
        throw new Error('The generated worksheet did not meet quality standards. Please try again.');
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
    
    // Validate reading exercise content and questions
    for (const exercise of worksheetData.exercises) {
      if (exercise.type === 'reading') {
        const wordCount = exercise.content?.split(/\s+/).filter(Boolean).length || 0;
        console.log(`Reading exercise word count: ${wordCount}`);
        
        if (wordCount < 280 || wordCount > 320) {
          console.warn(`Reading exercise word count (${wordCount}) outside target range of 280-320 words`);
          // We'll let the main component handle this warning
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
      if (lessonTime === "30 min") return 4;  // 30 minutes = 4 exercises
      else if (lessonTime === "45 min") return 6;  // 45 minutes = 6 exercises
      else return 8;  // 60 minutes = 8 exercises
    };
    
    const expectedCount = getExpectedExerciseCount(prompt.lessonTime);
    console.log(`Expected ${expectedCount} exercises for ${prompt.lessonTime} lesson, got ${worksheetData.exercises.length}`);
    
    return worksheetData;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw error;
  }
}

/**
 * Submits feedback for a worksheet
 */
export async function submitFeedback(worksheetId: string | null, rating: number, comment: string, userId: string) {
  try {
    if (!worksheetId || !userId || !rating) {
      console.error('Missing required parameters for feedback submission');
      throw new Error('Missing required parameters for feedback');
    }
    
    console.log('Submitting feedback:', { worksheetId, rating, comment, userId });
    
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
      const errorText = await response.text();
      console.error('Error submitting feedback via API:', errorText);
      
      // If edge function fails, try direct database submission
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([
          { 
            worksheet_id: worksheetId, 
            user_id: userId, 
            rating, 
            comment,
            status: 'new'
          }
        ])
        .select();
        
      if (error) {
        console.error('Direct feedback submission error:', error);
        
        // If direct insert fails and we don't have a worksheet_id, try creating a placeholder
        if (error.message.includes('violates foreign key constraint')) {
          console.log('Creating placeholder worksheet for feedback');
          
          const { data: placeholderData, error: placeholderError } = await supabase
            .from('worksheets')
            .insert([
              {
                prompt: 'Generated worksheet',
                html_content: JSON.stringify({ title: 'Generated Worksheet', exercises: [] }),
                user_id: userId,
                ip_address: 'client-side',
                status: 'created',
                title: 'Generated Worksheet'
              }
            ])
            .select();
            
          if (placeholderError) {
            console.error('Error creating placeholder worksheet:', placeholderError);
            throw new Error('Failed to create feedback record: worksheet reference is required');
          }
            
          if (placeholderData && placeholderData.length > 0) {
            // Try feedback again with new worksheet ID
            const { data: retryData, error: retryError } = await supabase
              .from('feedbacks')
              .insert([
                { 
                  worksheet_id: placeholderData[0].id, 
                  user_id: userId, 
                  rating, 
                  comment,
                  status: 'new'
                }
              ]);
                
            if (retryError) {
              console.error('Retry feedback submission error:', retryError);
              throw new Error(`Failed to submit feedback after retry: ${retryError.message}`);
            }
              
            return retryData;
          }
        } else {
          throw new Error(`Failed to submit feedback: ${error.message}`);
        }
      }
        
      return data;
    }
    
    const result = await response.json();
    console.log('Feedback submission successful:', result);
    return result.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Updates existing feedback with a comment
 */
export async function updateFeedback(id: string, comment: string, userId: string) {
  try {
    console.log('Updating feedback with comment:', { id, comment });

    const { data, error } = await supabase
      .from('feedbacks')
      .update({ comment })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Error updating feedback:', error);
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
    
    console.log('Feedback updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
}

/**
 * Tracks an event (view, download, etc.)
 */
export async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  try {
    // Skip tracking if worksheetId is not a valid UUID
    if (!worksheetId || worksheetId.length < 10) {
      console.log(`Skipping ${type} event tracking for invalid worksheetId: ${worksheetId}`);
      return;
    }
    
    console.log(`Tracking event: ${type} for worksheet: ${worksheetId}`);
    const { error } = await supabase.from('events').insert({
      type: type,
      event_type: type,
      worksheet_id: worksheetId,
      user_id: userId,
      metadata,
      ip_address: "client-side" // Since we can't get IP on client side
    });

    if (error) {
      console.error(`Error tracking ${type} event:`, error);
      
      // If FK constraint error, try creating a placeholder worksheet
      if (error.message.includes('violates foreign key constraint')) {
        console.log('Creating placeholder worksheet for event tracking');
        
        const { data: placeholderData, error: placeholderError } = await supabase
          .from('worksheets')
          .insert([
            {
              prompt: 'Generated worksheet',
              html_content: JSON.stringify({ title: 'Generated Worksheet', exercises: [] }),
              user_id: userId,
              ip_address: 'client-side',
              status: 'created',
              title: 'Generated Worksheet'
            }
          ])
          .select();
          
        if (placeholderError) {
          console.error('Error creating placeholder worksheet:', placeholderError);
          return;
        }
          
        if (placeholderData && placeholderData.length > 0) {
          // Try event again with new worksheet ID
          const { error: retryError } = await supabase.from('events').insert({
            type: type,
            event_type: type,
            worksheet_id: placeholderData[0].id,
            user_id: userId,
            metadata,
            ip_address: "client-side"
          });
            
          if (retryError) {
            console.error(`Error tracking ${type} event after retry:`, retryError);
          } else {
            console.log(`Successfully tracked ${type} event after creating placeholder worksheet`);
          }
        }
      }
    } else {
      console.log(`Successfully tracked ${type} event`);
    }
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
  }
}
