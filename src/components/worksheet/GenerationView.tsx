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

  // This function handles the immediate rating submission
  const handleRatingChange = async (newRating: number) => {
    if (!userId || !worksheetId) {
      toast({
        title: "Rating submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setRating(newRating);
    
    try {
      // Submit just the rating immediately
      const result = await submitFeedback(worksheetId, newRating, "", userId);
      
      // Store the feedback ID for future updates
      if (result && Array.isArray(result) && result.length > 0 && result[0].id) {
        setFeedbackId(result[0].id);
        
        toast({
          title: "Thank you for your rating!",
          description: "Would you like to provide additional comments?"
        });
      }
    } catch (error) {
      console.error("Rating submission error:", error);
      toast({
        title: "Rating submission failed",
        description: "We couldn't submit your rating. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // This function handles the additional feedback submission
  const handleSubmitFeedback = async () => {
    if (!userId || !worksheetId) {
      toast({
        title: "Feedback submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // If we already have a feedback ID and have comments, update the existing feedback
      if (feedbackId && feedback) {
        await submitFeedback(worksheetId, rating, feedback, userId);
        
        toast({
          title: "Thank you for your feedback!",
          description: "Your additional comments have been saved."
        });
      }
      // Otherwise if we don't have an ID yet but have both rating and feedback
      else if (rating > 0 && feedback) {
        const result = await submitFeedback(worksheetId, rating, feedback, userId);
        
        // Store the feedback ID for future updates
        if (result && Array.isArray(result) && result.length > 0 && result[0].id) {
          setFeedbackId(result[0].id);
        }
        
        toast({
          title: "Thank you for your feedback!",
          description: "Your rating and comments help us improve our service."
        });
      }
      // If we have an ID but no additional feedback, just acknowledge the rating
      else if (feedbackId) {
        toast({
          title: "Thank you for your rating!",
          description: "Your rating has been saved."
        });
      }
      // If none of the above, we need at least a rating
      else if (rating === 0) {
        toast({
          title: "Please provide a rating",
          description: "Please select a star rating before submitting feedback.",
          variant: "destructive"
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
        onFeedbackSubmit={handleSubmitFeedback}
      />
      
      <RatingSection
        rating={rating}
        setRating={handleRatingChange}
        feedback={feedback}
        setFeedback={setFeedback}
        handleSubmitRating={handleSubmitFeedback}
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
