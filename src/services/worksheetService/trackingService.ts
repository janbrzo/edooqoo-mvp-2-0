
import { supabase } from '@/integrations/supabase/client';

/**
 * Śledzi zdarzenia związane z arkuszem pracy
 * 
 * @param type Typ zdarzenia (np. 'view', 'download', 'share')
 * @param worksheetId ID arkusza pracy
 * @param userId ID użytkownika
 * @param metadata Dodatkowe dane
 * @returns Obietnica z wynikiem śledzenia
 */
export async function trackWorksheetEventAPI(type: string, worksheetId: string, userId: string, metadata: any = {}) {
  // Unikaj śledzenia dla nieprawidłowych ID
  if (!worksheetId || worksheetId === 'unknown' || worksheetId.length < 10) {
    console.log("Skipping tracking for invalid worksheet ID:", worksheetId);
    return null;
  }
  
  try {
    // Pobierz informacje o przeglądarce i urządzeniu
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Jeśli to zdarzenie pobrania, zaktualizuj licznik pobrań w arkuszu
    if (type === 'download') {
      // Wywołaj procedurę bazodanową przez RPC
      await supabase.rpc('increment_worksheet_download_count', { 
        p_worksheet_id: worksheetId 
      });
    }
    
    // Dodaj zdarzenie do tabeli zdarzeń
    const { data, error } = await supabase
      .from('events')
      .insert({
        worksheet_id: worksheetId,
        user_id: userId,
        type: type,
        device_type: deviceType,
        metadata: metadata
      })
      .select()
      .single();
    
    if (error) {
      console.warn("Error tracking worksheet event:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in trackWorksheetEvent:", error);
    // Nie rzucamy błędu - śledzenie nie powinno przerywać głównego działania aplikacji
    return null;
  }
}
