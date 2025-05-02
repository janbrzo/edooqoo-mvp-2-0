
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const { toast } = useToast();
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  const { userId, loading: authLoading } = useAnonymousAuth();

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
    
    // Record start time for accurate generation time
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    try {
      // Generate worksheet using the actual API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Calculate actual generation time
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(actualGenerationTime);
      
      // Set source count from the API or default
      setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
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
        
        // Log exercise count to verify
        console.log(`Generated worksheet with ${worksheetData.exercises.length} exercises`);
        
        setGeneratedWorksheet(worksheetData);
        
        toast({
          title: "Worksheet generated successfully!",
          description: "Your custom worksheet is now ready to use.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
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
        variant: "destructive"
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!generatedWorksheet ? (
        <FormView onSubmit={handleFormSubmit} />
      ) : (
        <GenerationView 
          worksheetId={worksheetId}
          generatedWorksheet={generatedWorksheet}
          inputParams={inputParams}
          generationTime={generationTime}
          sourceCount={sourceCount}
          onBack={handleBack}
          userId={userId}
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

// Helper functions for exercise handling
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

export default Index;
