
import React, { useEffect } from "react";
import { ArrowUp } from "lucide-react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { submitWorksheetFeedback, trackEvent } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";
import { FormData } from "@/types/worksheetFormTypes";

interface WorksheetDisplayWrapperProps {
  worksheet: any;
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  worksheetId: string | null;
  userId: string;
  onBack: () => void;
  showScrollTop: boolean;
  scrollToTop: () => void;
}

const WorksheetDisplayWrapper: React.FC<WorksheetDisplayWrapperProps> = ({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  worksheetId,
  userId,
  onBack,
  showScrollTop,
  scrollToTop
}) => {
  const { toast } = useToast();
  
  useEffect(() => {
    if (userId && worksheetId && worksheet) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackEvent('view', worksheetId, userId);
      }
    }
  }, [userId, worksheetId, worksheet]);

  const handleDownloadEvent = () => {
    if (userId && worksheetId) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackEvent('download', worksheetId, userId);
      }
    }
  };
  
  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    console.log('Submitting feedback:', { worksheetId, rating, feedback, userId });
    
    if (!userId || !worksheetId) {
      toast({
        title: "Feedback submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitWorksheetFeedback(worksheetId, rating, feedback, userId);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service."
      });
      
      // Track the feedback event
      trackEvent('feedback', worksheetId, userId, { rating });
      
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Feedback submission failed",
        description: "We couldn't submit your feedback. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <WorksheetDisplay 
        worksheet={worksheet} 
        inputParams={inputParams} 
        generationTime={generationTime} 
        sourceCount={sourceCount} 
        onBack={onBack} 
        wordBankOrder={worksheet?.exercises?.find((ex: any) => ex.type === "matching")?.shuffledTerms?.map((item: any) => item.definition)}
        onDownload={handleDownloadEvent}
        onSubmitRating={handleFeedbackSubmit}
      />

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-worksheet-purple text-white p-3 rounded-full shadow-lg hover:bg-worksheet-purpleDark transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </>
  );
};

export default WorksheetDisplayWrapper;
