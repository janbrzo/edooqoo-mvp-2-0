
import React from "react";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";

const Index = () => {
  const {
    isGenerating,
    generatedWorksheet,
    inputParams,
    generationTime,
    sourceCount,
    worksheetId,
    handleFormSubmit,
    handleBack
  } = useWorksheetGeneration();

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
          userId="anonymous"
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

export default Index;
