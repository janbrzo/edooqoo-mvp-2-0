import React, { useState, useEffect } from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { ArrowUp } from "lucide-react";
import { FormData } from "@/components/WorksheetForm";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback, trackWorksheetEvent } from "@/services/worksheetService";
import RatingSection from "./RatingSection";

interface GenerationViewProps {
  worksheetId: string | null;
  generatedWorksheet: any;
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  userId: string | null;
}

const GenerationView: React.FC<GenerationViewProps> = ({
  worksheetId,
  generatedWorksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  userId
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackWorksheetEvent('view', worksheetId, userId);
      }
    }
  }, [userId, worksheetId, generatedWorksheet]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubmitRating = async () => {
    if (!userId) {
      toast({
        title: "Feedback submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // If we already have a feedback ID, update the existing feedback with the comment
      if (feedbackId) {
        await submitFeedback(worksheetId || 'unknown', rating, feedback, userId);
        
        toast({
          title: "Thank you for your feedback!",
          description: "Your additional comments have been saved."
        });
      } 
      // Otherwise create a new feedback entry
      else {
        const result = await submitFeedback(worksheetId || 'unknown', rating, feedback, userId);
        
        // Store the feedback ID for future updates
        if (result && Array.isArray(result) && result.length > 0 && result[0].id) {
          setFeedbackId(result[0].id);
        }
        
        toast({
          title: "Thank you for your feedback!",
          description: "Your rating and comments help us improve our service."
        });
      }
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
        onFeedbackSubmit={handleSubmitRating}
      />
      
      <RatingSection
        rating={rating}
        setRating={setRating}
        feedback={feedback}
        setFeedback={setFeedback}
        handleSubmitRating={handleSubmitRating}
        worksheetId={worksheetId}
        userId={userId}
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

export default GenerationView;
