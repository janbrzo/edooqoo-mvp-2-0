
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
    
    try {
      // Create events table if it doesn't exist yet
      await supabase.rpc('create_events_table_if_not_exists').catch(err => {
        console.log('Table might already exist or we have no permission to create it:', err);
      });
      
      // Insert the event
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
      } else {
        console.log(`Successfully tracked ${type} event`);
      }
    } catch (innerError) {
      console.error(`Error in event tracking flow: ${innerError}`);
    }
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
  }
}
