
import { supabase } from '@/integrations/supabase/client';
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

/**
 * Generates a worksheet using the Edge Function and saves it to database
 */
export async function generateWorksheetAPI(formData: WorksheetFormData & { fullPrompt?: string; formDataForStorage?: any; studentId?: string | null }, userId: string) {
  console.log('📡 Calling generateWorksheet Edge Function...');
  console.log('Form data:', formData);
  console.log('Student ID:', formData.studentId);
  
  const { data, error } = await supabase.functions.invoke('generateWorksheet', {
    body: {
      ...formData,
      userId: userId,
      studentId: formData.studentId || null
    }
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Worksheet generation failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data received from worksheet generation');
  }

  console.log('✅ Worksheet generated and saved:', data);
  return data;
}
