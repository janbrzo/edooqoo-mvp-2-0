
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
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
      studentId,
      isDemo,
      userId
    });

    // Check token requirements for authenticated users only
    if (!isDemo && !hasTokens) {
      toast({
        title: "No tokens available",
        description: "You need tokens to generate worksheets. Please upgrade your plan or purchase tokens.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear storage but DON'T set any worksheet ID yet
    worksheetState.clearWorksheetStorage();

    // Generate temporary ID but DON'T set it in state yet
    const temporaryWorksheetId = uuidv4();
    console.log('🆔 Generated temporary worksheet ID (for fallback only):', temporaryWorksheetId);

    worksheetState.setInputParams(data);
    setIsGenerating(true);
    
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    // Track worksheet generation start
    trackEvent({
      eventType: 'worksheet_generation_start',
      eventData: {
        worksheetId: temporaryWorksheetId,
        timestamp: new Date().toISOString()
      }
    });
    
    try {
      console.log('📡 Calling generateWorksheet API...');
      
      // Create full prompt for ChatGPT and save it to database
      const fullPrompt = formatPromptForAI(data);
      const formDataForStorage = createFormDataForStorage(data);
      
      // Pass userId (can be null for anonymous users)
      const worksheetResult = await generateWorksheet({ 
        ...data, 
        fullPrompt,
        formDataForStorage,
        studentId
      }, userId); // userId can be null - edge function will handle it

      console.log("✅ Generated worksheet result received:", {
        hasData: !!worksheetResult,
        hasId: !!worksheetResult?.id,
        realId: worksheetResult?.id,
        hasBackendId: !!worksheetResult?.backendId,
        backendId: worksheetResult?.backendId,
        exerciseCount: worksheetResult?.exercises?.length || 0,
        hasTitle: !!worksheetResult?.title,
        hasVocabulary: !!worksheetResult?.vocabulary_sheet
      });

      // Use the correct ID from backend response
      let finalWorksheetId: string;
      
      // First priority: use 'id' field from worksheetResult
      if (worksheetResult?.id) {
        finalWorksheetId = worksheetResult.id;
        console.log('✅ Using primary backend ID:', finalWorksheetId);
      } 
      // Fallback: use 'backendId' field if 'id' doesn't exist
      else if (worksheetResult?.backendId) {
        finalWorksheetId = worksheetResult.backendId;
        console.log('✅ Using fallback backend ID:', finalWorksheetId);
      } 
      // Error case: no valid ID from backend
      else {
        console.error('❌ CRITICAL: No valid ID received from backend!');
        throw new Error("Failed to save worksheet to database - no ID returned");
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
        
        // Deep fix the entire worksheet before processing
        console.log('🔧 DEEP FIXING entire worksheet before processing...');
        const deepFixedWorksheet = deepFixTextObjects(worksheetResult, 'worksheet');
        console.log('🔧 Worksheet after deep fix:', deepFixedWorksheet);
        
        // Trim exercises if more than expected are returned
        if (deepFixedWorksheet.exercises.length > expectedExerciseCount) {
          console.log(`✂️ Trimming exercises from ${deepFixedWorksheet.exercises.length} to ${expectedExerciseCount}`);
          deepFixedWorksheet.exercises = deepFixedWorksheet.exercises.slice(0, expectedExerciseCount);
        }
        
        // Process exercises with correct parameters
        const hasGrammar = !!(data.teachingPreferences && data.teachingPreferences.trim());
        console.log('🔧 Processing exercises with parameters:', { 
          lessonTime: data.lessonTime, 
          hasGrammar,
          exerciseCount: deepFixedWorksheet.exercises.length 
        });
        
        deepFixedWorksheet.exercises = processExercises(deepFixedWorksheet.exercises, data.lessonTime, hasGrammar);
        
        // Set the correct worksheet ID on the worksheet object
        deepFixedWorksheet.id = finalWorksheetId;
        
        if (!deepFixedWorksheet.vocabulary_sheet || deepFixedWorksheet.vocabulary_sheet.length === 0) {
          console.log('📝 Creating sample vocabulary sheet...');
          deepFixedWorksheet.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        console.log('💾 Setting worksheet ID FIRST, then worksheet data');
        
        // Set the worksheet ID FIRST before setting worksheet data
        worksheetState.setWorksheetId(finalWorksheetId);
        
        // Add small delay to ensure state is updated
        setTimeout(() => {
          console.log('💾 Now setting both worksheets in state with final ID:', finalWorksheetId);
          worksheetState.setGeneratedWorksheet(deepFixedWorksheet);
          worksheetState.setEditableWorksheet(deepFixedWorksheet);
        }, 100);
        
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
        
        console.log('🎉 Worksheet generation completed successfully with ID:', finalWorksheetId);
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
          worksheetId: temporaryWorksheetId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Worksheet generation failed",
        description: error instanceof Error 
          ? `Error: ${error.message}. Please try again with different parameters.` 
          : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      
      // Don't clear the form data - user stays on form with preserved data
    } finally {
      console.log('🏁 Finishing generation process...');
      setIsGenerating(false);
      
      // Update student activity if studentId is provided - AT THE VERY END
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
