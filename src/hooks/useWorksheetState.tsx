
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormData } from "@/components/WorksheetForm";

export const useWorksheetState = (authLoading: boolean) => {
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const { toast } = useToast();

  // Restore worksheet state from sessionStorage on component mount
  useEffect(() => {
    const restoreWorksheetState = () => {
      try {
        const savedWorksheet = sessionStorage.getItem('currentWorksheet');
        const savedInputParams = sessionStorage.getItem('currentInputParams');
        const savedGenerationTime = sessionStorage.getItem('currentGenerationTime');
        const savedSourceCount = sessionStorage.getItem('currentSourceCount');
        const savedWorksheetId = sessionStorage.getItem('currentWorksheetId');

        if (savedWorksheet && savedInputParams) {
          console.log('Restoring worksheet state from sessionStorage');
          setGeneratedWorksheet(JSON.parse(savedWorksheet));
          setInputParams(JSON.parse(savedInputParams));
          setGenerationTime(savedGenerationTime ? parseInt(savedGenerationTime) : 0);
          setSourceCount(savedSourceCount ? parseInt(savedSourceCount) : 0);
          setWorksheetId(savedWorksheetId);
          
          toast({
            title: "Worksheet restored",
            description: "Your previous worksheet has been restored.",
            className: "bg-green-50 border-green-200"
          });
        }
      } catch (error) {
        console.error('Error restoring worksheet state:', error);
        clearWorksheetStorage();
      }
    };

    if (!authLoading) {
      restoreWorksheetState();
    }
  }, [authLoading, toast]);

  // Save worksheet state to sessionStorage whenever it changes
  useEffect(() => {
    if (generatedWorksheet && inputParams) {
      try {
        sessionStorage.setItem('currentWorksheet', JSON.stringify(generatedWorksheet));
        sessionStorage.setItem('currentInputParams', JSON.stringify(inputParams));
        sessionStorage.setItem('currentGenerationTime', generationTime.toString());
        sessionStorage.setItem('currentSourceCount', sourceCount.toString());
        if (worksheetId) {
          sessionStorage.setItem('currentWorksheetId', worksheetId);
        }
        console.log('Worksheet state saved to sessionStorage');
      } catch (error) {
        console.error('Error saving worksheet state:', error);
      }
    }
  }, [generatedWorksheet, inputParams, generationTime, sourceCount, worksheetId]);

  const clearWorksheetStorage = () => {
    sessionStorage.removeItem('currentWorksheet');
    sessionStorage.removeItem('currentInputParams');
    sessionStorage.removeItem('currentGenerationTime');
    sessionStorage.removeItem('currentSourceCount');
    sessionStorage.removeItem('currentWorksheetId');
  };

  const resetWorksheetState = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
    clearWorksheetStorage();
  };

  return {
    generatedWorksheet,
    setGeneratedWorksheet,
    inputParams,
    setInputParams,
    generationTime,
    setGenerationTime,
    sourceCount,
    setSourceCount,
    worksheetId,
    setWorksheetId,
    clearWorksheetStorage,
    resetWorksheetState
  };
};
