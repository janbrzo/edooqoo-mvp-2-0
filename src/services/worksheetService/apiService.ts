
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generuje worksheet przy użyciu Edge Function
 * 
 * @param prompt Dane formularza worksheetu
 * @param userId ID użytkownika
 * @returns Obietnica z wygenerowanym worksheetem
 */
export async function generateWorksheetAPI(prompt: WorksheetFormData, userId: string) {
  try {
    console.log("Generating worksheet with params:", prompt);
    
    // Buduj prosty prompt do generowania - używamy typu WorksheetFormData, który ma właściwe pola
    const promptText = `${prompt.topic}: ${prompt.focusArea} - ${prompt.teachingObjective}. Teaching preferences: ${prompt.teachingPreferences}. Student profile: ${prompt.studentProfile}. Student struggles: ${prompt.studentStruggles}. Lesson duration: ${prompt.lessonTime}.`;
    
    // Wywołaj Edge Function
    const { data, error } = await supabase.functions.invoke('generateWorksheet', {
      body: {
        prompt: promptText,
        formData: prompt,
        userId: userId
      }
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Failed to generate worksheet: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("No data received from worksheet generation");
    }
    
    return data;
  } catch (error) {
    console.error("Error in generateWorksheet:", error);
    throw error;
  }
}
