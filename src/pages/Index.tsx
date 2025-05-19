
import React from "react";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";

/**
 * Główna strona aplikacji zarządzająca procesem generowania arkuszy
 */
const Index: React.FC = () => {
  // Pozyskaj ID użytkownika
  const { userId, loading: authLoading } = useAnonymousAuth();
  
  // Użyj custom hooka do obsługi generowania worksheetu
  const {
    isGenerating,
    generatedWorksheet,
    inputParams,
    generationTime,
    sourceCount,
    worksheetId,
    startGenerationTime,
    handleFormSubmit,
    handleBack
  } = useWorksheetGeneration(userId);

  // Pokaż indykator ładowania podczas inicjalizacji uwierzytelniania
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
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
      
      <GeneratingModal 
        isOpen={isGenerating} 
        startTime={startGenerationTime} 
      />
    </div>
  );
};

export default Index;
