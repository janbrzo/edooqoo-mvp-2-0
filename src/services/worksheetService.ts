
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

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
  try {
    const response = await fetch('/api/generateWorksheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API error:', errorData);
      
      if (response.status === 429) {
        throw new Error('You have reached your daily limit for worksheet generation. Please try again tomorrow.');
      }
      throw new Error(`Failed to generate worksheet: ${errorData?.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('Worksheet generated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error generating worksheet:', error);
    throw error;
  }
}

/**
 * Submits feedback for a worksheet (placeholder for now)
 */
async function submitFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
  console.log('Feedback submitted:', { worksheetId, rating, comment, userId });
  // Placeholder - will be implemented later when Supabase is added back
  return { success: true };
}

/**
 * Updates existing feedback with a comment (placeholder for now)
 */
async function updateFeedback(id: string, comment: string, userId: string) {
  console.log('Feedback updated:', { id, comment, userId });
  // Placeholder - will be implemented later when Supabase is added back
  return { success: true };
}

/**
 * Tracks an event (view, download, etc.) (placeholder for now)
 */
async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  console.log('Event tracked:', { type, worksheetId, userId, metadata });
  // Placeholder - will be implemented later when Supabase is added back
  return { success: true };
}
