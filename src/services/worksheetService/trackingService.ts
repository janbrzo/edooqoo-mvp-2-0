
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks a worksheet event (view, download, etc.)
 * 
 * @param type Event type (view, download, etc.)
 * @param worksheetId The ID of the worksheet
 * @param userId The ID of the user
 * @param metadata Additional metadata
 * @returns Promise with tracking result
 */
export async function trackWorksheetEventAPI(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  try {
    console.log(`Tracking worksheet event: ${type} for worksheet ${worksheetId}`);
    
    // Increment download count if this is a download event
    if (type === 'download') {
      await supabase.rpc('increment_worksheet_download_count', { 
        p_worksheet_id: worksheetId 
      });
    }
    
    // Log the event in the console for debugging
    console.log(`Event tracked successfully: ${type} for worksheet ${worksheetId}`);
    
    return {
      success: true,
      type: type,
      worksheetId: worksheetId,
      userId: userId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error tracking worksheet event:', error);
    return {
      success: false,
      error: 'Failed to track worksheet event'
    };
  }
}
