
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { generateWorksheetAPI } from './worksheetService/apiService';
import { submitFeedbackAPI, updateFeedbackAPI } from './worksheetService/feedbackService';
import { trackWorksheetEventAPI } from './worksheetService/trackingService';

/**
 * Main service export for worksheet functionality
 * 
 * This file exports all worksheet-related functionality from separate modules
 * for easier maintainability and organization.
 */
export { 
  generateWorksheet,
  submitFeedback, 
  updateFeedback, 
  trackWorksheetEvent 
};

/**
 * Generates a worksheet using the Edge Function
 * 
 * @param prompt The worksheet form data
 * @param userId The ID of the requesting user
 * @returns Promise with the generated worksheet
 */
async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  return generateWorksheetAPI(prompt, userId);
}

/**
 * Submits feedback for a worksheet
 * 
 * @param worksheetId The ID of the worksheet
 * @param rating Rating value (1-5)
 * @param comment User comment (optional)
 * @param userId The ID of the user submitting feedback
 * @returns Promise with feedback submission result
 */
async function submitFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
  return submitFeedbackAPI(worksheetId, rating, comment, userId);
}

/**
 * Updates existing feedback with a comment
 * 
 * @param id Feedback ID
 * @param comment User comment
 * @param userId User ID for verification
 * @returns Promise with feedback update result
 */
async function updateFeedback(id: string, comment: string, userId: string) {
  return updateFeedbackAPI(id, comment, userId);
}

/**
 * Tracks an event (view, download, etc.)
 * 
 * @param type Event type (view, download, etc.)
 * @param worksheetId The ID of the worksheet
 * @param userId The ID of the user
 * @param metadata Additional metadata
 * @returns Promise with tracking result
 */
async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  return trackWorksheetEventAPI(type, worksheetId, userId, metadata);
}
