
import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import Sidebar from "@/components/Sidebar";
import GeneratingModal from "@/components/GeneratingModal";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import WorksheetRating from "@/components/WorksheetRating";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet, submitWorksheetFeedback, trackEvent } from "@/services/worksheetService";
import { v4 as uuidv4 } from 'uuid';

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

const getExercisesByTime = (exercises: any[], lessonTime: string) => {
  if (lessonTime === "30 min") {
    return exercises.slice(0, 4); // First 4 exercises for 30 min
  } else if (lessonTime === "45 min") {
    return exercises.slice(0, 6); // First 6 exercises for 45 min
  } else if (lessonTime === "60 min") {
    return exercises.slice(0, 8); // First 8 exercises for 60 min
  }
  return exercises.slice(0, 6); // Default to 6 exercises
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function Index() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const { toast } = useToast();
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const { userId, loading: authLoading } = useAnonymousAuth();

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

  const handleFormSubmit = async (data: FormData) => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setInputParams(data);
    setIsGenerating(true);
    
    // Show realistic generation metrics
    setGenerationTime(Math.floor(Math.random() * (65 - 31) + 31));
    setSourceCount(Math.floor(Math.random() * (90 - 50) + 50));
    
    try {
      // Generate worksheet using the actual API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // If we have a real worksheet, use it
      if (worksheetData && worksheetData.exercises && worksheetData.title) {
        // Handle shuffling for matching exercises
        worksheetData.exercises.forEach((exercise: any) => {
          if (exercise.type === "matching" && exercise.items) {
            exercise.originalItems = [...exercise.items];
            exercise.shuffledTerms = shuffleArray([...exercise.items]);
          }
        });
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        setWorksheetId(wsId);
        
        setGeneratedWorksheet(worksheetData);
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
      
      toast({
        title: "Worksheet generated successfully!",
        description: "Your custom worksheet is now ready to use.",
        className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
      });
    } catch (error) {
      console.error("Worksheet generation error:", error);
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      fallbackWorksheet.exercises = getExercisesByTime(fallbackWorksheet.exercises, data.lessonTime);
      
      fallbackWorksheet.exercises.forEach((exercise: any) => {
        if (exercise.type === "matching" && exercise.items) {
          exercise.originalItems = [...exercise.items];
          exercise.shuffledTerms = shuffleArray([...exercise.items]);
        }
      });
      
      const tempId = uuidv4();
      setWorksheetId(tempId);
      setGeneratedWorksheet(fallbackWorksheet);
      
      // Let the user know we're using a fallback
      toast({
        title: "Using sample worksheet",
        description: error instanceof Error 
          ? `Generation error: ${error.message}. Using a sample worksheet instead.` 
          : "An unexpected error occurred. Using a sample worksheet instead.",
        variant: "destructive"  // Changed from "warning" to "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
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
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Feedback submission failed",
        description: "We couldn't submit your feedback. Please try again later.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackEvent('view', worksheetId, userId);
      }
    }
  }, [userId, worksheetId, generatedWorksheet]);

  const handleDownloadEvent = () => {
    if (userId && worksheetId) {
      // Only track events if we have a valid ID
      if (worksheetId.length > 10) {
        trackEvent('download', worksheetId, userId);
      }
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
    </div>;
  }

  return <div className="min-h-screen bg-gray-100">
      {!generatedWorksheet ? <div className="container mx-auto flex main-container">
          <div className="w-1/5 mx-0 py-[48px]">
            <Sidebar />
          </div>
          <div className="w-4/5 px-6 py-6 form-container">
            <WorksheetForm onSubmit={handleFormSubmit} />
          </div>
        </div> : <>
          
          <WorksheetDisplay 
            worksheet={generatedWorksheet} 
            inputParams={inputParams} 
            generationTime={generationTime} 
            sourceCount={sourceCount} 
            onBack={handleBack} 
            wordBankOrder={generatedWorksheet?.exercises?.find((ex: any) => ex.type === "matching")?.shuffledTerms?.map((item: any) => item.definition)}
            onDownload={handleDownloadEvent}
          />
          <WorksheetRating onSubmitRating={handleFeedbackSubmit} />
          {showScrollTop && <button onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 bg-worksheet-purple text-white p-3 rounded-full shadow-lg hover:bg-worksheet-purpleDark transition-colors" aria-label="Scroll to top">
              <ArrowUp size={24} />
            </button>}
        </>}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>;
}
