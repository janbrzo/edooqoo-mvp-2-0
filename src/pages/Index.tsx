
import React, { useState, useEffect, useCallback } from "react";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import GeneratingModal from "@/components/GeneratingModal";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import mockWorksheetData from "@/mockWorksheetData";

const Index = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const { toast } = useToast();
  const { userId } = useAnonymousAuth();

  const handleSubmit = useCallback(async (data: FormData) => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "Please wait for authentication to complete and try again.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting worksheet generation with user ID:', userId);
    setFormData(data);
    setIsGenerating(true);
    setGenerationTime(0);
    
    const startTime = Date.now();
    
    try {
      console.log('Calling generateWorksheet API...');
      const result = await generateWorksheet(data, userId);
      console.log('Generation result:', result);
      
      if (result && result.worksheet) {
        const endTime = Date.now();
        const timeInSeconds = Math.round((endTime - startTime) / 1000);
        
        console.log('Successfully generated worksheet:', result.id);
        setWorksheetId(result.id);
        setGeneratedWorksheet(result.worksheet);
        setGenerationTime(timeInSeconds);
        setSourceCount(result.sourceCount || 0);
      } else {
        throw new Error('Invalid response format from generation service');
      }
    } catch (error) {
      console.error('Worksheet generation failed:', error);
      
      toast({
        title: "Generation failed",
        description: "There was an error generating your worksheet. Please try again.",
        variant: "destructive"
      });
      
      // Do NOT show mockup on failure - just reset state
      setIsGenerating(false);
      return;
    }
    
    setIsGenerating(false);
  }, [userId, toast]);

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setWorksheetId(null);
    setFormData(null);
    setGenerationTime(0);
    setSourceCount(0);
  };

  if (generatedWorksheet) {
    return (
      <GenerationView
        worksheetId={worksheetId}
        generatedWorksheet={generatedWorksheet}
        inputParams={formData}
        generationTime={generationTime}
        sourceCount={sourceCount}
        onBack={handleBack}
        userId={userId}
      />
    );
  }

  return (
    <>
      <FormView onSubmit={handleSubmit} />
      <GeneratingModal isOpen={isGenerating} />
    </>
  );
};

export default Index;
