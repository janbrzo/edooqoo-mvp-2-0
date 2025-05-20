
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { generateWorksheetAPI } from './worksheetService/apiService';
// Tymczasowo usuwamy problematyczne importy
// import { submitFeedbackAPI, updateFeedbackAPI } from './worksheetService/feedbackService';
// import { trackWorksheetEventAPI } from './worksheetService/trackingService';

/**
 * Main service export for worksheet functionality
 */
export { 
  generateWorksheet,
  submitFeedback, 
  updateFeedback, 
  trackWorksheetEvent 
};

/**
 * Generates a worksheet using the Edge Function
 */
async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  return generateWorksheetAPI(prompt, userId);
}

/**
 * Submits feedback for a worksheet - temporary mock implementation
 */
async function submitFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
  console.log('Feedback submitted:', { worksheetId, rating, comment, userId });
  return { success: true, id: 'mock-feedback-id' };
}

/**
 * Updates existing feedback with a comment - temporary mock implementation
 */
async function updateFeedback(id: string, comment: string, userId: string) {
  console.log('Feedback updated:', { id, comment, userId });
  return { success: true };
}

/**
 * Tracks an event (view, download, etc.) - temporary mock implementation
 */
async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  console.log('Event tracked:', { type, worksheetId, userId, metadata });
  return { success: true };
}
