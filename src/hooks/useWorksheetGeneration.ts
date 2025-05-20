
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FormData } from '@/components/WorksheetForm';
import { generateWorksheet } from '@/services/worksheetService';
import { getExpectedExerciseCount, validateWorksheet, processExercises, createSampleVocabulary } from '@/utils/worksheetUtils';

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

export interface GenerationState {
  isGenerating: boolean;
  generatedWorksheet: any | null;
  inputParams: FormData | null; 
  generationTime: number;
  sourceCount: number;
  worksheetId: string | null;
  startGenerationTime: number;
}

export const useWorksheetGeneration = (userId: string | null) => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    generatedWorksheet: null,
    inputParams: null,
    generationTime: 0,
    sourceCount: 0,
    worksheetId: null,
    startGenerationTime: 0
  });

  const resetState = () => {
    setState({
      isGenerating: false,
      generatedWorksheet: null,
      inputParams: null,
      generationTime: 0,
      sourceCount: 0,
      worksheetId: null,
      startGenerationTime: 0
    });
  };

  const handleFormSubmit = async (data: FormData) => {
    // Check for valid user session
    if (!userId) {
      toast.error("Błąd autoryzacji. Odśwież stronę i spróbuj ponownie.");
      return;
    }

    // Store form data and start generation process
    setState(prev => ({
      ...prev,
      inputParams: data,
      isGenerating: true,
      startGenerationTime: Date.now()
    }));
    
    try {
      // Generate worksheet using the API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Calculate actual generation time
      const actualGenerationTime = Math.round((Date.now() - state.startGenerationTime) / 1000);
      
      // Set source count from the API or default
      const sourceCount = worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65);
      
      // Get expected exercise count based on lesson time
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      // If we have a valid worksheet, use it
      if (validateWorksheet(worksheetData, expectedExerciseCount)) {
        // Process exercises (numbering, shuffling terms, etc)
        worksheetData.exercises = processExercises(worksheetData.exercises);
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        
        // Check if we need to add vocabulary sheet
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        setState(prev => ({
          ...prev,
          generatedWorksheet: worksheetData,
          generationTime: actualGenerationTime,
          sourceCount: sourceCount,
          worksheetId: wsId,
          isGenerating: false
        }));
        
        toast.success("Worksheet wygenerowany pomyślnie! Twój worksheet jest gotowy do użycia.");
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
    } catch (error) {
      console.error("Worksheet generation error:", error);
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Get correct exercise count based on lesson time
      const expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Process the fallback exercises
      fallbackWorksheet.exercises = processExercises(fallbackWorksheet.exercises);
      
      const tempId = uuidv4();
      
      setState(prev => ({
        ...prev,
        generatedWorksheet: fallbackWorksheet,
        generationTime: Math.round((Date.now() - state.startGenerationTime) / 1000),
        sourceCount: Math.floor(Math.random() * (90 - 65) + 65),
        worksheetId: tempId,
        isGenerating: false
      }));
      
      // Let the user know we're using a fallback
      toast.error(
        error instanceof Error 
          ? `Błąd generowania: ${error.message}. Używamy przykładowego worksheetu.` 
          : "Wystąpił nieoczekiwany błąd. Używamy przykładowego worksheetu."
      );
    }
  };

  return {
    ...state,
    handleFormSubmit,
    resetState
  };
};
