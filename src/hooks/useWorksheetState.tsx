
import { useState, useCallback, useEffect } from "react";

export const useWorksheetState = () => {
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [editableWorksheet, setEditableWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<any>(null);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [sourceCount, setSourceCount] = useState<number>(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);

  // Check for restored worksheet from sessionStorage on mount
  useEffect(() => {
    const restoredWorksheetData = sessionStorage.getItem('restoredWorksheet');
    if (restoredWorksheetData) {
      try {
        const restored = JSON.parse(restoredWorksheetData);
        console.log('🔄 Restoring worksheet from sessionStorage:', restored);
        
        // Parse the AI response to get the actual worksheet content
        let worksheetContent;
        try {
          worksheetContent = JSON.parse(restored.ai_response);
        } catch (error) {
          console.error('❌ Failed to parse ai_response:', error);
          // Fallback to creating a basic structure
          worksheetContent = {
            title: restored.title || 'Restored Worksheet',
            subtitle: '',
            introduction: '',
            exercises: [],
            vocabulary_sheet: []
          };
        }

        // Set the worksheet content
        console.log('📄 Parsed worksheet content:', worksheetContent);
        setGeneratedWorksheet(worksheetContent);
        setEditableWorksheet(worksheetContent);
        
        // Restore input parameters from form_data
        if (restored.form_data) {
          console.log('📋 Restoring input params:', restored.form_data);
          setInputParams(restored.form_data);
        }
        
        // Set other metadata
        setWorksheetId(restored.id);
        setGenerationTime(restored.generation_time_seconds || 0);
        setSourceCount(65); // Default source count
        
        // Clear the sessionStorage after restoration
        sessionStorage.removeItem('restoredWorksheet');
        
        console.log('✅ Worksheet restoration completed');
      } catch (error) {
        console.error('❌ Error restoring worksheet:', error);
        sessionStorage.removeItem('restoredWorksheet');
      }
    }
  }, []);

  const clearWorksheetStorage = useCallback(() => {
    sessionStorage.removeItem('worksheetData');
    sessionStorage.removeItem('restoredWorksheet');
  }, []);

  return {
    generatedWorksheet,
    editableWorksheet,
    inputParams,
    generationTime,
    sourceCount,
    worksheetId,
    setGeneratedWorksheet,
    setEditableWorksheet,
    setInputParams,
    setGenerationTime,
    setSourceCount,
    setWorksheetId,
    clearWorksheetStorage
  };
};
