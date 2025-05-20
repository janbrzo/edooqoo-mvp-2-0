
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback, trackWorksheetEvent } from "@/services/worksheetService";
import { Worksheet } from "@/types/worksheet";
import { FormData } from "@/components/WorksheetForm";

interface UseGenerationViewProps {
  worksheetId: string | null;
  userId: string | null;
  generatedWorksheet: Worksheet;
}

export const useGenerationView = ({
  worksheetId,
  userId,
  generatedWorksheet
}: UseGenerationViewProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackWorksheetEvent('view', worksheetId, userId);
      }
    }
  }, [userId, worksheetId, generatedWorksheet]);

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (!userId) {
      toast({
        title: "Feedback submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitFeedback(worksheetId || 'unknown', rating, feedback, userId);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service."
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Feedback submission failed",
        description: "We couldn't submit your feedback. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadEvent = () => {
    if (userId && worksheetId) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackWorksheetEvent('download', worksheetId, userId);
      }
    }
  };

  return {
    handleFeedbackSubmit,
    handleDownloadEvent
  };
};
