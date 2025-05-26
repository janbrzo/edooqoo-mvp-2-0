
import React, { useState, useEffect } from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { ArrowUp } from "lucide-react";
import { FormData } from "@/components/WorksheetForm";

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Simple placeholder functions for feedback that don't save to database
  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    console.log('User feedback:', { rating, feedback, worksheetId });
    // Just log feedback locally - no database storage
  };

  const handleDownloadEvent = () => {
    console.log('Download event:', { worksheetId, userId });
    // Just log download event locally - no database storage
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
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </>
  );
};

export default GenerationView;
