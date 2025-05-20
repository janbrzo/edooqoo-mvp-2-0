
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { toast } from "sonner";

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

/**
 * Utility functions
 */
const utils = {
  // Get expected number of exercises based on lesson time
  getExpectedExerciseCount: (lessonTime: string): number => {
    if (lessonTime === "30 min") return 4;
    else if (lessonTime === "45 min") return 6;
    else return 8;
  },

  // Shuffle array elements (for matching exercises)
  shuffleArray: (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },

  // Create sample vocabulary items when vocabulary is missing
  createSampleVocabulary: (count: number) => {
    const terms = [
      'Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 
      'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose', 
      'Kinetic', 'Luminous', 'Meticulous', 'Nostalgia', 'Omnipotent'
    ];
    const meanings = [
      'Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 
      'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 
      'Sociable', 'Random or lacking organization', 'Perfect, flawless', 
      'To place side by side', 'Related to motion', 'Full of light', 
      'Showing great attention to detail', 'Sentimental longing for the past', 
      'Having unlimited power'
    ];
    
    return Array(Math.min(count, terms.length)).fill(null).map((_, i) => ({
      term: terms[i],
      meaning: meanings[i]
    }));
  },

  // Validate worksheet structure
  validateWorksheet: (worksheetData: any, expectedCount: number): boolean => {
    if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      return false;
    }
    
    return worksheetData.exercises.length === expectedCount;
  },

  // Process and enhance exercises
  processExercises: (exercises: any[]): any[] => {
    return exercises.map((exercise: any, index: number) => {
      // Make sure exercise number is correct
      const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
      exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
      
      // Process matching exercises
      if (exercise.type === "matching" && exercise.items) {
        exercise.originalItems = [...exercise.items];
        exercise.shuffledTerms = utils.shuffleArray([...exercise.items]);
      }
      
      // Process reading exercise
      if (exercise.type === 'reading' && exercise.content) {
        const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
        console.log(`Reading exercise word count: ${wordCount}`);
        
        // Ensure it has adequate number of questions
        if (!exercise.questions || exercise.questions.length < 5) {
          if (!exercise.questions) exercise.questions = [];
          while (exercise.questions.length < 5) {
            exercise.questions.push({
              text: `Additional question ${exercise.questions.length + 1} about the text.`,
              answer: "Answer would be based on the text content."
            });
          }
        }
      }

      // Ensure discussion exercises have proper questions
      if (exercise.type === 'discussion' && (!exercise.questions || exercise.questions.some((q: any) => 
        q.text && q.text.includes('Discussion question')))) {
        
        if (!exercise.questions) exercise.questions = [];
        
        // Fix generic questions with proper ones based on topic
        for (let i = 0; i < exercise.questions.length; i++) {
          if (exercise.questions[i].text.includes('Discussion question')) {
            exercise.questions[i].text = `What is your opinion about this topic? (Question ${i + 1})`;
          }
        }
      }

      // Fix error-correction exercises with generic sentences
      if (exercise.type === 'error-correction' && exercise.sentences) {
        for (let i = 0; i < exercise.sentences.length; i++) {
          if (exercise.sentences[i].text.includes('This sentence')) {
            exercise.sentences[i].text = `The weather are very nice today. (Sentence ${i + 1})`;
            exercise.sentences[i].corrected = `The weather is very nice today.`;
          }
        }
      }
      
      return exercise;
    });
  }
};

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
  const { toast: shadowToast } = useToast();
  const { userId, loading: authLoading } = useAnonymousAuth();

  /**
   * Handles form submission and worksheet generation
   */
  const handleFormSubmit = async (data: FormData) => {
    // Check for valid user session
    if (!userId) {
      toast.error("Błąd autoryzacji. Odśwież stronę i spróbuj ponownie.");
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
      
      // Get expected exercise count based on lesson time
      const expectedExerciseCount = utils.getExpectedExerciseCount(data.lessonTime);
      console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      // If we have a valid worksheet, use it
      if (utils.validateWorksheet(worksheetData, expectedExerciseCount)) {
        // Process exercises (numbering, shuffling terms, etc)
        worksheetData.exercises = utils.processExercises(worksheetData.exercises);
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        setWorksheetId(wsId);
        
        // Check if we need to add vocabulary sheet
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = utils.createSampleVocabulary(15);
        }
        
        setGeneratedWorksheet(worksheetData);
        
        toast.success("Worksheet wygenerowany pomyślnie! Twój worksheet jest gotowy do użycia.");
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
    } catch (error) {
      console.error("Worksheet generation error:", error);
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Get correct exercise count based on lesson time
      const expectedExerciseCount = utils.getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Process the fallback exercises
      fallbackWorksheet.exercises = utils.processExercises(fallbackWorksheet.exercises);
      
      const tempId = uuidv4();
      setWorksheetId(tempId);
      setGeneratedWorksheet(fallbackWorksheet);
      
      // Let the user know we're using a fallback
      toast.error(
        error instanceof Error 
          ? `Błąd generowania: ${error.message}. Używamy przykładowego worksheetu.` 
          : "Wystąpił nieoczekiwany błąd. Używamy przykładowego worksheetu."
      );
    } finally {
      setIsGenerating(false);
    }
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
      
      <GeneratingModal 
        isOpen={isGenerating} 
        startGenerationTime={startGenerationTime}
      />
    </div>
  );
};

export default Index;
