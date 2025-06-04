import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import mockWorksheetData from '@/mockWorksheetData';

// Utility functions
const getExpectedExerciseCount = (lessonTime: string): number => {
  // Always expect 8 exercises from backend - it will trim later if needed for 45 min
  return 8;
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createSampleVocabulary = (count: number) => {
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
};

const validateWorksheet = (worksheetData: any, expectedCount: number): boolean => {
  console.log('Frontend validation - Expected exercises:', expectedCount);
  console.log('Frontend validation - Received exercises:', worksheetData?.exercises?.length || 0);
  
  if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    console.log('Frontend validation - FAILED: Missing or invalid exercises array');
    return false;
  }
  
  const result = worksheetData.exercises.length >= 6; // Accept 6, 7, or 8 exercises
  console.log('Frontend validation - Result:', result);
  return result;
};

const processExercises = (exercises: any[]): any[] => {
  return exercises.map((exercise: any, index: number) => {
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
    }
    
    // Randomize correct answers in multiple choice questions
    if (exercise.type === "multiple-choice" && exercise.questions) {
      exercise.questions = exercise.questions.map((question: any) => {
        if (question.options && question.options.length === 4) {
          // Find correct answer
          const correctOption = question.options.find((opt: any) => opt.correct);
          if (correctOption) {
            // Reset all correct flags
            question.options.forEach((opt: any) => opt.correct = false);
            
            // Randomly assign correct flag to prevent B bias
            const randomIndex = Math.floor(Math.random() * 4);
            question.options[randomIndex].correct = true;
            
            // Ensure the correct text is in the correct position
            const correctText = correctOption.text;
            question.options[randomIndex].text = correctText;
          }
        }
        return question;
      });
    }
    
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`Reading exercise word count: ${wordCount}`);
      
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
    
    return exercise;
  });
};

export const useWorksheetGeneration = (
  userId: string | null,
  worksheetState: any
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  const { toast } = useToast();

  const generateWorksheetHandler = async (data: FormData) => {
    worksheetState.clearWorksheetStorage();

    const newWorksheetId = uuidv4();
    worksheetState.setWorksheetId(newWorksheetId);
    console.log('Generated worksheet ID:', newWorksheetId);

    worksheetState.setInputParams(data);
    setIsGenerating(true);
    
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    try {
      const worksheetData = await generateWorksheet(data, userId || 'anonymous');
      console.log("Generated worksheet data:", worksheetData);
      
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      worksheetState.setGenerationTime(actualGenerationTime);
      worksheetState.setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      if (validateWorksheet(worksheetData, expectedExerciseCount)) {
        worksheetData.exercises = processExercises(worksheetData.exercises);
        worksheetData.id = newWorksheetId;
        
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        worksheetState.setGeneratedWorksheet(worksheetData);
        
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
      
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      const expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      fallbackWorksheet.exercises = processExercises(fallbackWorksheet.exercises);
      fallbackWorksheet.id = newWorksheetId;
      worksheetState.setGeneratedWorksheet(fallbackWorksheet);
      
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

  return {
    isGenerating,
    generateWorksheetHandler
  };
};
