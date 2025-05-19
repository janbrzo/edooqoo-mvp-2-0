
import React, { useState, useEffect } from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { ArrowUp } from "lucide-react";
import { FormData } from "@/components/WorksheetForm";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback, trackWorksheetEvent } from "@/services/worksheetService";
import { useScrollToTop } from "@/hooks/useScrollToTop";

// Typy
interface GenerationViewProps {
  worksheetId: string | null;
  generatedWorksheet: any;
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  userId: string | null;
}

/**
 * Widok po wygenerowaniu arkusza pracy
 */
const GenerationView: React.FC<GenerationViewProps> = ({
  worksheetId,
  generatedWorksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  userId
}) => {
  const { toast } = useToast();
  const { showScrollTop, scrollToTop } = useScrollToTop();

  // Po załadowaniu, śledź zdarzenie wyświetlenia
  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      // Śledź tylko gdy ID jest prawidłowe
      trackWorksheetEvent('view', worksheetId, userId);
    }
  }, [userId, worksheetId, generatedWorksheet]);

  /**
   * Obsługuje wysłanie oceny
   */
  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (!userId) {
      toast({
        title: "Błąd wysyłania oceny",
        description: "Wystąpił problem z sesją. Odśwież stronę i spróbuj ponownie.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitFeedback(worksheetId || 'unknown', rating, feedback, userId);
      
      toast({
        title: "Dziękujemy za ocenę!",
        description: "Twoja ocena i komentarze pomagają nam ulepszać naszą usługę."
      });
    } catch (error) {
      console.error("Błąd wysyłania oceny:", error);
      toast({
        title: "Nie udało się wysłać oceny",
        description: "Nie mogliśmy wysłać Twojej oceny. Spróbuj ponownie później.",
        variant: "destructive"
      });
    }
  };

  /**
   * Śledzi zdarzenie pobrania
   */
  const handleDownloadEvent = () => {
    if (userId && worksheetId) {
      trackWorksheetEvent('download', worksheetId, userId);
    }
  };

  return (
    <>
      <WorksheetDisplay 
        worksheet={generatedWorksheet} 
        inputParams={inputParams} 
        generationTime={generationTime} 
        sourceCount={sourceCount} 
        onBack={onBack}
        worksheetId={worksheetId}
        wordBankOrder={generatedWorksheet?.exercises?.find((ex: any) => ex.type === "matching")?.shuffledTerms?.map((item: any) => item.definition)}
        onDownload={handleDownloadEvent}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="fixed bottom-6 right-6 z-50 bg-worksheet-purple text-white p-3 rounded-full shadow-lg hover:bg-worksheet-purpleDark transition-colors" 
          aria-label="Przewiń do góry"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </>
  );
};

export default GenerationView;
