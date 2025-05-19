
import { supabase } from '@/integrations/supabase/client';

/**
 * Wysyła ocenę dla arkusza pracy
 * 
 * @param worksheetId ID arkusza pracy
 * @param rating Ocena (1-5)
 * @param comment Komentarz użytkownika (opcjonalny)
 * @param userId ID użytkownika
 * @returns Obietnica z wynikiem wysyłania oceny
 */
export async function submitFeedbackAPI(worksheetId: string, rating: number, comment: string, userId: string) {
  try {
    // Weryfikacja poprawności danych
    if (!worksheetId || !rating || rating < 1 || rating > 5) {
      throw new Error("Invalid feedback data");
    }
    
    // Sprawdź czy ocena już istnieje
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('worksheet_id', worksheetId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Error checking existing feedback: ${checkError.message}`);
    }
    
    let response;
    
    if (existingFeedback) {
      // Aktualizuj istniejącą ocenę
      response = await supabase
        .from('feedbacks')
        .update({ 
          rating,
          comment,
          status: 'updated'
        })
        .eq('id', existingFeedback.id)
        .select();
    } else {
      // Dodaj nową ocenę
      response = await supabase
        .from('feedbacks')
        .insert({
          worksheet_id: worksheetId,
          user_id: userId,
          rating,
          comment,
          status: 'submitted'
        })
        .select();
    }
    
    if (response.error) {
      throw new Error(`Error submitting feedback: ${response.error.message}`);
    }
    
    return response.data?.[0] || null;
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    throw error;
  }
}

/**
 * Aktualizuje komentarz do istniejącej oceny
 * 
 * @param id ID oceny
 * @param comment Komentarz
 * @param userId ID użytkownika dla weryfikacji
 * @returns Obietnica z wynikiem aktualizacji
 */
export async function updateFeedbackAPI(id: string, comment: string, userId: string) {
  try {
    // Weryfikacja, czy ocena należy do tego użytkownika
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError || !existingFeedback) {
      throw new Error("Feedback not found or access denied");
    }
    
    // Aktualizuj komentarz
    const { data, error } = await supabase
      .from('feedbacks')
      .update({ 
        comment,
        status: 'updated'
      })
      .eq('id', id)
      .select();
    
    if (error) {
      throw new Error(`Error updating feedback comment: ${error.message}`);
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Error in updateFeedback:", error);
    throw error;
  }
}
