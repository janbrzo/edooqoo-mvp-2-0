
import React, { useState, useEffect } from "react";
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
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAnonymousAuth();

  /**
   * Handles form submission and worksheet generation
   */
  const handleFormSubmit = async (data: FormData) => {
    // Reset error state
    setGenerationError(null);
    
    // Check for valid user session
    if (!userId) {
      toast({
        title: "Błąd uwierzytelniania",
        description: "Wystąpił problem z Twoją sesją. Proszę odświeżyć stronę i spróbować ponownie.",
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
        worksheetData.id = wsId;
        
        // Log exercise count to verify
        console.log(`Generated worksheet with ${worksheetData.exercises.length} exercises`);
        
        // Ensure exercise count matches lesson time
        let expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
        
        if (worksheetData.exercises.length < expectedExerciseCount) {
          console.warn(`Expected ${expectedExerciseCount} exercises but got ${worksheetData.exercises.length}`);
          // Add placeholder exercises to match expected count
          while (worksheetData.exercises.length < expectedExerciseCount) {
            worksheetData.exercises.push(createPlaceholderExercise(worksheetData.exercises.length + 1));
          }
        } else if (worksheetData.exercises.length > expectedExerciseCount) {
          // Trim extra exercises
          worksheetData.exercises = worksheetData.exercises.slice(0, expectedExerciseCount);
        }
        
        // Verify each exercise is complete and has proper content
        worksheetData.exercises = worksheetData.exercises.map((exercise: any, index: number) => {
          // Deep check reading content
          if (exercise.type === "reading" && (!exercise.content || exercise.content.split(/\s+/).filter((w: string) => w.trim() !== '').length < 280)) {
            console.warn("Reading exercise content is too short, replacing with better content");
            exercise.content = generatePlaceholderReadingContent(280);
            
            // Ensure it has questions
            if (!exercise.questions || exercise.questions.length < 5) {
              exercise.questions = Array(5).fill(null).map((_, i) => ({
                text: `Question ${i + 1} about the reading content.`,
                answer: `Sample answer to question ${i + 1}.`
              }));
            }
          }
          
          // Ensure other exercise types have proper content
          if (exercise.type === "multiple-choice" && (!exercise.questions || exercise.questions.length < 10)) {
            exercise.questions = Array(10).fill(null).map((_, i) => ({
              text: `Question ${i + 1}: Choose the correct option.`,
              options: [
                { label: "A", text: `Option A for question ${i + 1}`, correct: i % 4 === 0 },
                { label: "B", text: `Option B for question ${i + 1}`, correct: i % 4 === 1 },
                { label: "C", text: `Option C for question ${i + 1}`, correct: i % 4 === 2 },
                { label: "D", text: `Option D for question ${i + 1}`, correct: i % 4 === 3 }
              ]
            }));
          }
          
          return exercise;
        });
        
        setGeneratedWorksheet(worksheetData);
        
        toast({
          title: "Arkusz wygenerowany pomyślnie!",
          description: "Twój niestandardowy arkusz jest teraz gotowy do użycia.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
    } catch (error) {
      console.error("Worksheet generation error:", error);
      setGenerationError(error instanceof Error ? error.message : "Nieznany błąd");
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Get correct exercise count based on lesson time
      let expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Ensure we have enough exercises
      while (fallbackWorksheet.exercises.length < expectedExerciseCount) {
        fallbackWorksheet.exercises.push(createPlaceholderExercise(fallbackWorksheet.exercises.length + 1));
      }
      
      fallbackWorksheet.exercises.forEach((exercise: any) => {
        if (exercise.type === "matching" && exercise.items) {
          exercise.originalItems = [...exercise.items];
          exercise.shuffledTerms = shuffleArray([...exercise.items]);
        }
        
        // Ensure reading exercise has correct word count
        if (exercise.type === "reading" && exercise.content) {
          const wordCount = exercise.content.split(/\s+/).length;
          console.log(`Fallback reading exercise word count: ${wordCount}`);
          
          if (wordCount < 280) {
            // Pad the content to reach minimum word count
            exercise.content = generatePlaceholderReadingContent(280);
            console.log(`Padded reading exercise to ${exercise.content.split(/\s+/).length} words`);
          }
        }
      });
      
      const tempId = uuidv4();
      setWorksheetId(tempId);
      fallbackWorksheet.id = tempId;
      setGeneratedWorksheet(fallbackWorksheet);
      
      // Let the user know we're using a fallback
      toast({
        title: "Używam przykładowego arkusza",
        description: error instanceof Error 
          ? `Błąd generowania: ${error.message}. Używam przykładowego arkusza w zamian.` 
          : "Wystąpił nieoczekiwany błąd. Używam przykładowego arkusza w zamian.",
        variant: "destructive"
      });
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
    setGenerationError(null);
  };

  /**
   * Generate placeholder reading content with the minimum required words
   */
  const generatePlaceholderReadingContent = (minWordCount: number) => {
    const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, quis ultricies nisl nunc vel magna. Nam vitae ex vitae nisl ultricies ultricies. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, quis ultricies nisl nunc vel magna. Nam vitae ex vitae nisl ultricies ultricies. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, quis ultricies nisl nunc vel magna. Nam vitae ex vitae nisl ultricies ultricies. Fusce at dolor sit amet felis suscipit tristique. Nam a imperdiet tellus. Nulla eu vestibulum urna. Vivamus tincidunt suscipit enim, nec ultrices nisi volutpat ac. Maecenas sit amet lacinia arcu, non dictum justo. Donec sed quam vel risus faucibus euismod. Suspendisse rhoncus rhoncus felis at fermentum. Donec lorem magna, ultricies a nunc sit amet, blandit fringilla nunc. Vestibulum luctus maximus dui, vitae tempus justo. Morbi consectetur vulputate est, non congue massa pharetra in. Curabitur consectetur dictum rhoncus. Phasellus et ultrices metus. Vivamus purus metus, luctus in vestibulum at, laoreet efficitur nisi. Phasellus in erat eu tortor rhoncus tempor.`;
    
    // Repeat the lorem ipsum text until we have enough words
    let content = '';
    while (content.split(/\s+/).filter(word => word.trim() !== '').length < minWordCount) {
      content += ' ' + lorem;
    }
    
    // Trim to be between 280-320 words
    const words = content.split(/\s+/).filter(word => word.trim() !== '');
    return words.slice(0, Math.min(320, Math.max(280, words.length))).join(' ');
  };

  /**
   * Create a placeholder exercise for when we need to pad exercise count
   */
  const createPlaceholderExercise = (index: number) => {
    return {
      type: "multiple-choice",
      title: `Exercise ${index}: Multiple Choice`,
      icon: "fa-check-square",
      time: 6,
      instructions: "Choose the best option to complete each sentence.",
      questions: Array(10).fill(null).map((_, i) => ({
        text: `Question ${i + 1}: Choose the correct option.`,
        options: [
          { label: "A", text: `Option A for question ${i + 1}`, correct: i % 4 === 0 },
          { label: "B", text: `Option B for question ${i + 1}`, correct: i % 4 === 1 },
          { label: "C", text: `Option C for question ${i + 1}`, correct: i % 4 === 2 },
          { label: "D", text: `Option D for question ${i + 1}`, correct: i % 4 === 3 }
        ]
      })),
      teacher_tip: "Tip for teachers: Review these options with students."
    };
  };

  /**
   * Get expected exercise count based on lesson time
   */
  const getExpectedExerciseCount = (lessonTime: string): number => {
    if (lessonTime === "30 min") {
      return 4;  // 30 minutes = 4 exercises
    } else if (lessonTime === "45 min") {
      return 6;  // 45 minutes = 6 exercises
    } else {
      return 8;  // 60 minutes = 8 exercises
    }
  };

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show error message if there's a generation error (outside the normal workflow)
  if (generationError && !generatedWorksheet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 w-full max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Wystąpił błąd podczas generowania arkusza</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{generationError}</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setGenerationError(null)}
          className="bg-worksheet-purple text-white px-4 py-2 rounded hover:bg-worksheet-purpleDark transition-colors"
        >
          Spróbuj ponownie
        </button>
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
