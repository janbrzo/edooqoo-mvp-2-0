
import { useState } from "react";
import { Worksheet } from "@/components/WorksheetDisplay";

interface WorksheetState {
  generatedWorksheet: Worksheet | null;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  worksheetId: string | null;
}

export const useWorksheetState = (authLoading: boolean) => {
  const [worksheetState, setWorksheetState] = useState<WorksheetState>({
    generatedWorksheet: null,
    inputParams: null,
    generationTime: 0,
    sourceCount: 0,
    worksheetId: null
  });

  const resetWorksheetState = () => {
    setWorksheetState({
      generatedWorksheet: null,
      inputParams: null,
      generationTime: 0,
      sourceCount: 0,
      worksheetId: null
    });
  };

  const updateWorksheetState = (newState: Partial<WorksheetState>) => {
    setWorksheetState(prev => ({ ...prev, ...newState }));
  };

  return {
    ...worksheetState,
    resetWorksheetState,
    updateWorksheetState
  };
};
