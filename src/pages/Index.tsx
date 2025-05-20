
import React from "react";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  // Hooks
  const { userId, loading: authLoading } = useAnonymousAuth();
  const { 
    isGenerating, 
    generatedWorksheet, 
    inputParams, 
    generationTime, 
    sourceCount, 
    worksheetId,
    startGenerationTime,
    handleFormSubmit, 
    resetState 
  } = useWorksheetGeneration(userId);

  // Show loading indicator while auth is initializing
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
          onBack={resetState}
          userId={userId}
        />
      )}
      
      <GeneratingModal 
        isOpen={isGenerating} 
        startGenerationTime={startGenerationTime}
      />
    </div>
  );
};

export default Index;
