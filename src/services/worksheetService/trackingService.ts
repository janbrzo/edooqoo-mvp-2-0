
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
      // Log event in console
      console.log(`Event tracked: ${type} for worksheet ${worksheetId} by user ${userId}`, metadata);
      
      // For download events, increment the download counter
      if (type === 'download') {
        try {
          // Use the dedicated function for incrementing download count
          await supabase.rpc('increment_worksheet_download_count', {
            p_worksheet_id: worksheetId
          });
          console.log(`Download count incremented for worksheet: ${worksheetId}`);
        } catch (countError) {
          console.error(`Failed to increment download count: ${countError}`);
        }
      }
      
      // For view events, update the last_modified_at timestamp
      if (type === 'view') {
        try {
          await supabase
            .from('worksheets')
            .update({ 
              last_modified_at: new Date().toISOString() 
            })
            .eq('id', worksheetId);
          console.log(`Last viewed timestamp updated for worksheet: ${worksheetId}`);
        } catch (viewError) {
          console.error(`Failed to update view timestamp: ${viewError}`);
        }
      }
    } catch (innerError) {
      console.error(`Error in event tracking flow: ${innerError}`);
    }
  } catch (error) {
    console.error(`Error tracking ${type} event:`, error);
  }
}
