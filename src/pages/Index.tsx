
import { useState, useEffect } from "react";
import WorksheetForm from "@/components/WorksheetForm";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import GeneratingModal from "@/components/GeneratingModal";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetRating } from "@/hooks/useWorksheetRating";

const Index = () => {
  const { userId } = useAnonymousAuth();
  const worksheetState = useWorksheetState();
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(userId, worksheetState);
  const { handleSubmit: submitRating } = useWorksheetRating();

  // Show worksheet if we have generated content OR restored content
  const showWorksheet = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  console.log('🔍 Index page state:', {
    showWorksheet,
    hasGeneratedWorksheet: !!worksheetState.generatedWorksheet,
    hasEditableWorksheet: !!worksheetState.editableWorksheet,
    worksheetId: worksheetState.worksheetId
  });

  const handleBack = () => {
    worksheetState.setGeneratedWorksheet(null);
    worksheetState.setEditableWorksheet(null);
    worksheetState.setInputParams(null);
    worksheetState.setWorksheetId(null);
    worksheetState.clearWorksheetStorage();
  };

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (worksheetState.worksheetId) {
      await submitRating(worksheetState.worksheetId, rating, feedback);
    }
  };

  if (showWorksheet) {
    return (
      <WorksheetDisplay
        worksheet={worksheetState.generatedWorksheet}
        inputParams={worksheetState.inputParams}
        generationTime={worksheetState.generationTime}
        sourceCount={worksheetState.sourceCount}
        onBack={handleBack}
        worksheetId={worksheetState.worksheetId}
        onFeedbackSubmit={handleFeedbackSubmit}
        editableWorksheet={worksheetState.editableWorksheet}
        setEditableWorksheet={worksheetState.setEditableWorksheet}
        userId={userId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-worksheet-purple to-worksheet-purpleDark bg-clip-text text-transparent">
              English Worksheet Generator
            </h1>
            <p className="text-xl text-muted-foreground">
              Create customized English worksheets for your students in minutes
            </p>
          </div>
          
          <WorksheetForm 
            onSubmit={generateWorksheetHandler}
            userId={userId}
          />
        </div>
      </div>
      
      <GeneratingModal 
        isOpen={isGenerating} 
      />
    </div>
  );
};

export default Index;
