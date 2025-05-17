
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks an event (view, download, etc.)
 */
export async function trackWorksheetEventAPI(type: string, worksheetId: string, userId: string, metadata: any = {}) {
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
