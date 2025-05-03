
import { supabase } from '@/integrations/supabase/client';

/**
 * Submit feedback for a worksheet
 */
export async function submitWorksheetFeedback(
  worksheetId: string, 
  rating: number, 
  comment: string, 
  userId: string
) {
  try {
    console.log('Submitting feedback:', { worksheetId, rating, comment, userId });
    
    // First check if we already have a feedback entry for this worksheet and user
    const { data: existingFeedback, error: fetchError } = await supabase
      .from('feedbacks')
      .select('id, comment')  // dodajemy comment do wybranych pól
      .eq('worksheet_id', worksheetId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError && !fetchError.message.includes('No rows found')) {
      console.error('Error checking existing feedback:', fetchError);
      throw new Error(`Failed to check existing feedback: ${fetchError.message}`);
    }
    
    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('feedbacks')
        .update({ 
          rating, 
          comment: comment || existingFeedback.comment || '', // Zapewniamy że comment zawsze istnieje
          status: 'updated'
        })
        .eq('id', existingFeedback.id)
        .select();
        
      if (error) {
        console.error('Error updating feedback:', error);
        throw new Error(`Failed to update feedback: ${error.message}`);
      }
      
      console.log('Feedback updated successfully:', data);
      return data;
    } else {
      // Insert new feedback
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
        console.error('Feedback submission error:', error);
        
        // If direct insert fails and we don't have a worksheet_id, try creating a placeholder
        if (error.message.includes('violates foreign key constraint')) {
          console.log('Creating placeholder worksheet for feedback');
          
          // Make sure the client has permission to insert to worksheets
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
              ])
              .select();
                
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
        
      console.log('Feedback submitted successfully:', data);
      return data;
    }
  } catch (error) {
    console.error('Error in submitWorksheetFeedback:', error);
    throw error;
  }
}

/**
 * Track worksheet events (view, download, etc.)
 */
export async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  try {
    // Skip tracking if worksheetId is not a valid UUID
    if (!worksheetId || worksheetId.length < 10) {
      console.log(`Skipping ${type} event tracking for invalid worksheetId: ${worksheetId}`);
      return;
    }
    
    console.log(`Tracking worksheet event: ${type} for worksheet: ${worksheetId}`);
    const { error } = await supabase.from('events').insert({
      type: 'worksheet_event', // This is required by the schema
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
            type: 'worksheet_event',
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
