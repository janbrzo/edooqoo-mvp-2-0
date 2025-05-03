import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { getExerciseCountByDuration, getExerciseTypes } from "@/utils/exerciseTypeUtils";

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  // State for tracking worksheet generation process
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  
  // Hooks
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAnonymousAuth();

  /**
   * Handles form submission and worksheet generation
   */
  const handleFormSubmit = async (data: FormData) => {
    // Check for valid user session
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    // Store form data and start generation process
    setInputParams(data);
    setIsGenerating(true);
    
    // Record start time for accurate generation time calculation
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    try {
      // Generate worksheet using the API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Calculate actual generation time
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(actualGenerationTime);
      
      // Set source count from the API or default
      setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      // If we have a valid worksheet, use it
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
        
        // Check if exercise count matches lesson time
        let expectedExerciseCount = getExerciseCountByDuration(data.lessonTime);
        console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
        
        // Validate and format all exercises
        worksheetData.exercises = worksheetData.exercises.map((exercise: any, index: number) => {
          // Make sure exercise number is correct
          const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
          exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
          
          // Check if it's a reading exercise with appropriate word count
          if (exercise.type === 'reading' && exercise.content) {
            const wordCount = exercise.content.split(/\s+/).length;
            console.log(`Reading exercise word count: ${wordCount}`);
            
            if (wordCount < 280) {
              toast({
                title: "Reading content warning",
                description: `The reading exercise has only ${wordCount} words (recommended 280-320)`,
                variant: "default"
              });
            }
          }
          
          return exercise;
        });
        
        // Check if we need to add vocabulary sheet
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = createSampleVocabulary(15);
        }
        
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
      
      // Get correct exercise count based on lesson time
      let expectedExerciseCount = getExerciseCountByDuration(data?.lessonTime || '60 min');
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Ensure exercise titles have correct numbering
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.map((exercise: any, index: number) => {
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
        return exercise;
      });
      
      // Process fallback exercises
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.map((exercise: any, index: number) => {
        // Process matching exercises
        if (exercise.type === "matching" && exercise.items) {
          exercise.originalItems = [...exercise.items];
          exercise.shuffledTerms = shuffleArray([...exercise.items]);
        }
        
        return exercise;
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

  /**
   * Helper function to create sample vocabulary
   */
  const createSampleVocabulary = (count: number) => {
    const terms = ['Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose', 'Kinetic', 'Luminous', 'Meticulous', 'Nostalgia', 'Omnipotent'];
    const meanings = ['Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 'Sociable', 'Random or lacking organization', 'Perfect, flawless', 'To place side by side', 'Related to motion', 'Full of light', 'Showing great attention to detail', 'Sentimental longing for the past', 'Having unlimited power'];
    
    return Array(count).fill(null).map((_, i) => ({
      term: terms[i],
      meaning: meanings[i]
    }));
  };

  /**
   * Resets the view to the form
   */
  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
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

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default Index;
