
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { generateWorksheetAPI } from './worksheetService/apiService';
import { submitFeedbackAPI, updateFeedbackAPI } from './worksheetService/feedbackService';
import { trackWorksheetEventAPI } from './worksheetService/trackingService';

/**
 * Main service export for worksheet functionality
 */
export { 
  generateWorksheet,
  submitFeedback, 
  updateFeedback, 
  trackWorksheetEvent,
  incrementDownloadCount
};

/**
 * Generates a worksheet using the Edge Function
 */
async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  return generateWorksheetAPI(prompt, userId);
}

/**
 * Submits feedback for a worksheet
 */
async function submitFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
  return submitFeedbackAPI(worksheetId, rating, comment, userId);
}

/**
 * Updates existing feedback with a comment
 */
async function updateFeedback(id: string, comment: string, userId: string) {
  return updateFeedbackAPI(id, comment, userId);
}

/**
 * Tracks an event (view, download, etc.)
 */
async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  return trackWorksheetEventAPI(type, worksheetId, userId, metadata);
}

/**
 * Increments download count for a worksheet
 */
async function incrementDownloadCount(worksheetId: string): Promise<boolean> {
  try {
    console.log('Incrementing download count for worksheet:', worksheetId);
    
    const { error } = await supabase.rpc('increment_worksheet_download_count', {
      p_worksheet_id: worksheetId
    });
    
    if (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
    
    console.log('Successfully incremented download count for worksheet:', worksheetId);
    return true;
  } catch (error) {
    console.error('Failed to increment download count:', error);
    return false;
  }
}
