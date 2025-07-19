
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import { mockWorksheetData } from '@/mockWorksheetData';
import { formatPromptForAI, createFormDataForStorage } from "@/utils/promptFormatter";
import { processExercises } from "@/utils/exerciseProcessor";
import { getExpectedExerciseCount, validateWorksheet, createSampleVocabulary } from "@/utils/worksheetUtils";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useTokenSystem } from "@/hooks/useTokenSystem";

export const useWorksheetGeneration = (
  userId: string | null,
  worksheetState: any,
  studentId?: string | null
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  const { toast } = useToast();
  const { trackEvent } = useEventTracking(userId);
  const { tokenBalance, hasTokens, isDemo, consumeToken } = useTokenSystem(userId);

  const generateWorksheetHandler = async (data: FormData) => {
    console.log('🚀 Starting worksheet generation for:', data.lessonTime);
    console.log('🔧 Form data received:', { 
      lessonTime: data.lessonTime, 
      grammarFocus: data.teachingPreferences,
      hasGrammar: !!(data.teachingPreferences && data.teachingPreferences.trim())
    });

    // Check token requirements for authenticated users
    if (!isDemo && !hasTokens) {
      toast({
        title: "No tokens available",
        description: "You need tokens to generate worksheets. Please upgrade your plan or purchase tokens.",
        variant: "destructive"
      });
      return;
    }
    
    worksheetState.clearWorksheetStorage();

    const newWorksheetId = uuidv4();
    worksheetState.setWorksheetId(newWorksheetId);
    console.log('🆔 Generated worksheet ID:', newWorksheetId);

    worksheetState.setInputParams(data);
    setIsGenerating(true);
    
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    // Track worksheet generation start
    trackEvent({
      eventType: 'worksheet_generation_start',
      eventData: {
        worksheetId: newWorksheetId,
        timestamp: new Date().toISOString()
      }
    });
    
    try {
      console.log('📡 Calling generateWorksheet API...');
      
      // NEW: Create full prompt for ChatGPT and save it to database
      const fullPrompt = formatPromptForAI(data);
      const formDataForStorage = createFormDataForStorage(data);
      
      // Pass the full prompt to the API
      const worksheetData = await generateWorksheet({ 
        ...data, 
        fullPrompt,
        formDataForStorage,
        studentId
      }, userId || 'anonymous');

      // Consume token for authenticated users AFTER successful generation
      if (!isDemo && userId) {
        const tokenConsumed = await consumeToken(newWorksheetId);
        if (!tokenConsumed) {
          console.warn('⚠️ Failed to consume token, but worksheet was generated');
        }
      }
      
      console.log("✅ Generated worksheet data received:", {
        hasData: !!worksheetData,
        exerciseCount: worksheetData?.exercises?.length || 0,
        hasTitle: !!worksheetData?.title,
        hasVocabulary: !!worksheetData?.vocabulary_sheet
      });
      
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      console.log('⏱️ Generation time:', actualGenerationTime, 'seconds');
      
      worksheetState.setGenerationTime(actualGenerationTime);
      worksheetState.setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`🎯 Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      console.log('🔍 Starting worksheet validation...');
      if (validateWorksheet(worksheetData, expectedExerciseCount)) {
        console.log('✅ Worksheet validation passed, processing exercises...');
        
        // CRITICAL: Deep fix the entire worksheet before processing
        console.log('🔧 DEEP FIXING entire worksheet before processing...');
        const deepFixedWorksheet = deepFixTextObjects(worksheetData, 'worksheet');
        console.log('🔧 Worksheet after deep fix:', deepFixedWorksheet);
        
        // Trim exercises if more than expected are returned
        if (deepFixedWorksheet.exercises.length > expectedExerciseCount) {
          console.log(`✂️ Trimming exercises from ${deepFixedWorksheet.exercises.length} to ${expectedExerciseCount}`);
          deepFixedWorksheet.exercises = deepFixedWorksheet.exercises.slice(0, expectedExerciseCount);
        }
        
        // FIXED: Pass correct lessonTime and hasGrammar parameters
        const hasGrammar = !!(data.teachingPreferences && data.teachingPreferences.trim());
        console.log('🔧 Processing exercises with parameters:', { 
          lessonTime: data.lessonTime, 
          hasGrammar,
          exerciseCount: deepFixedWorksheet.exercises.length 
        });
        
        deepFixedWorksheet.exercises = processExercises(deepFixedWorksheet.exercises, data.lessonTime, hasGrammar);
        deepFixedWorksheet.id = newWorksheetId;
        
        if (!deepFixedWorksheet.vocabulary_sheet || deepFixedWorksheet.vocabulary_sheet.length === 0) {
          console.log('📝 Creating sample vocabulary sheet...');
          deepFixedWorksheet.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        console.log('💾 Setting both worksheets in state ATOMICALLY...');
        console.log('💾 Final worksheet before setState:', deepFixedWorksheet);
        
        // CRITICAL FIX: Set both states atomically in the same synchronous operation
        worksheetState.setGeneratedWorksheet(deepFixedWorksheet);
        worksheetState.setEditableWorksheet(deepFixedWorksheet);
        
        // Track successful worksheet generation
        trackEvent({
          eventType: 'worksheet_generation_complete',
          eventData: {
            worksheetId: newWorksheetId,
            success: true,
            generationTimeSeconds: actualGenerationTime,
            timestamp: new Date().toISOString()
          }
        });
        
        console.log('🎉 Worksheet generation completed successfully!');
        toast({
          title: "Worksheet generated successfully!",
          description: "Your custom worksheet is now ready to use.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        console.log('❌ Worksheet validation failed');
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
    } catch (error) {
      console.error("💥 Worksheet generation error:", error);
      
      // Track failed worksheet generation
      trackEvent({
        eventType: 'worksheet_generation_complete',
        eventData: {
          worksheetId: newWorksheetId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      const expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60min');
      
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // FIXED: Pass correct parameters to fallback processExercises too
      const hasGrammar = !!(data?.teachingPreferences && data.teachingPreferences.trim());
      console.log('🔧 Processing fallback exercises with parameters:', { 
        lessonTime: data?.lessonTime || '60min', 
        hasGrammar,
        exerciseCount: fallbackWorksheet.exercises.length 
      });
      
      fallbackWorksheet.exercises = processExercises(fallbackWorksheet.exercises, data?.lessonTime || '60min', hasGrammar);
      fallbackWorksheet.id = newWorksheetId;
      
      // CRITICAL FIX: Set both states atomically for fallback case too
      worksheetState.setGeneratedWorksheet(fallbackWorksheet);
      worksheetState.setEditableWorksheet(fallbackWorksheet);
      
      toast({
        title: "Using sample worksheet",
        description: error instanceof Error 
          ? `Generation error: ${error.message}. Using a sample worksheet instead.` 
          : "An unexpected error occurred. Using a sample worksheet instead.",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Finishing generation process...');
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateWorksheetHandler,
    tokenBalance,
    hasTokens,
    isDemo
  };
};
