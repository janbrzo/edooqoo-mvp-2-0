
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
  const { tokenLeft, hasTokens, isDemo, consumeToken } = useTokenSystem(userId);

  const generateWorksheetHandler = async (data: FormData) => {
    console.log('🚀 Starting worksheet generation for:', data.lessonTime);
    console.log('🔧 Form data received:', { 
      lessonTime: data.lessonTime, 
      grammarFocus: data.teachingPreferences,
      hasGrammar: !!(data.teachingPreferences && data.teachingPreferences.trim()),
      studentId
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
    console.log('🆔 Generated temporary worksheet ID:', newWorksheetId);

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
      const worksheetResult = await generateWorksheet({ 
        ...data, 
        fullPrompt,
        formDataForStorage,
        studentId
      }, userId || 'anonymous');

      console.log("✅ Generated worksheet result received:", {
        hasData: !!worksheetResult,
        hasBackendId: !!worksheetResult?.backendId,
        exerciseCount: worksheetResult?.exercises?.length || 0,
        hasTitle: !!worksheetResult?.title,
        hasVocabulary: !!worksheetResult?.vocabulary_sheet
      });

      // CRITICAL FIX: Use the real database ID if available
      let finalWorksheetId = newWorksheetId;
      if (worksheetResult?.backendId) {
        finalWorksheetId = worksheetResult.backendId;
        console.log('🔄 Using backend ID instead of local ID:', finalWorksheetId);
        worksheetState.setWorksheetId(finalWorksheetId);
      } else {
        console.warn('⚠️ No backend ID received, using local ID');
      }

      // Consume token for authenticated users AFTER successful generation
      if (!isDemo && userId) {
        const tokenConsumed = await consumeToken(finalWorksheetId);
        if (!tokenConsumed) {
          console.warn('⚠️ Failed to consume token, but worksheet was generated');
        }
      }
      
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      console.log('⏱️ Generation time:', actualGenerationTime, 'seconds');
      
      worksheetState.setGenerationTime(actualGenerationTime);
      worksheetState.setSourceCount(worksheetResult.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`🎯 Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      console.log('🔍 Starting worksheet validation...');
      if (validateWorksheet(worksheetResult, expectedExerciseCount)) {
        console.log('✅ Worksheet validation passed, processing exercises...');
        
        // CRITICAL: Deep fix the entire worksheet before processing
        console.log('🔧 DEEP FIXING entire worksheet before processing...');
        const deepFixedWorksheet = deepFixTextObjects(worksheetResult, 'worksheet');
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
        deepFixedWorksheet.id = finalWorksheetId; // Use the correct ID here
        
        if (!deepFixedWorksheet.vocabulary_sheet || deepFixedWorksheet.vocabulary_sheet.length === 0) {
          console.log('📝 Creating sample vocabulary sheet...');
          deepFixedWorksheet.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        console.log('💾 Setting both worksheets in state ATOMICALLY...');
        console.log('💾 Final worksheet before setState with ID:', finalWorksheetId);
        
        // CRITICAL FIX: Set both states atomically in the same synchronous operation
        worksheetState.setGeneratedWorksheet(deepFixedWorksheet);
        worksheetState.setEditableWorksheet(deepFixedWorksheet);
        
        // Track successful worksheet generation
        trackEvent({
          eventType: 'worksheet_generation_complete',
          eventData: {
            worksheetId: finalWorksheetId,
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
      
      // MOVED HERE: Update student activity if studentId is provided - AT THE VERY END
      if (studentId) {
        console.log('🔄 FINAL STEP: Updating student activity for:', studentId);
        
        // Add a small delay to ensure the worksheet has been fully processed
        setTimeout(() => {
          // Dispatch custom event to notify other components about student update
          window.dispatchEvent(new CustomEvent('studentUpdated', { 
            detail: { studentId } 
          }));
          
          console.log('🔄 StudentUpdated event dispatched AFTER generation completed for:', studentId);
        }, 500);
      }
    }
  };

  return {
    isGenerating,
    generateWorksheetHandler,
    tokenLeft,
    hasTokens,
    isDemo
  };
};
