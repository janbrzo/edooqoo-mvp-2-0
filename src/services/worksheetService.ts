
import { FormData as WorksheetFormData } from '@/components/WorksheetForm';
import { generateWorksheetAPI } from './worksheetService/apiService';
import { submitFeedbackAPI, updateFeedbackAPI } from './worksheetService/feedbackService';
import { trackWorksheetEventAPI } from './worksheetService/trackingService';

/**
 * Główny eksport usługi dla funkcjonalności worksheetu
 */
export { 
  generateWorksheet,
  submitFeedback, 
  updateFeedback, 
  trackWorksheetEvent 
};

/**
 * Generuje worksheet przy użyciu Edge Function
 * 
 * @param prompt Dane formularza worksheetu
 * @param userId ID użytkownika
 * @returns Obietnica z wygenerowanym worksheetem
 */
async function generateWorksheet(prompt: WorksheetFormData, userId: string) {
  return generateWorksheetAPI(prompt, userId);
}

/**
 * Wysyła ocenę dla arkusza pracy
 * 
 * @param worksheetId ID arkusza pracy
 * @param rating Ocena (1-5)
 * @param comment Komentarz użytkownika (opcjonalny)
 * @param userId ID użytkownika
 * @returns Obietnica z wynikiem wysyłania oceny
 */
async function submitFeedback(worksheetId: string, rating: number, comment: string, userId: string) {
  return submitFeedbackAPI(worksheetId, rating, comment, userId);
}

/**
 * Aktualizuje komentarz do istniejącej oceny
 * 
 * @param id ID oceny
 * @param comment Komentarz
 * @param userId ID użytkownika dla weryfikacji
 * @returns Obietnica z wynikiem aktualizacji
 */
async function updateFeedback(id: string, comment: string, userId: string) {
  return updateFeedbackAPI(id, comment, userId);
}

/**
 * Śledzi zdarzenie (wyświetlenie, pobranie, itp.)
 * 
 * @param type Typ zdarzenia (np. 'view', 'download', 'share')
 * @param worksheetId ID arkusza pracy
 * @param userId ID użytkownika
 * @param metadata Dodatkowe dane
 * @returns Obietnica z wynikiem śledzenia
 */
async function trackWorksheetEvent(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  return trackWorksheetEventAPI(type, worksheetId, userId, metadata);
}
