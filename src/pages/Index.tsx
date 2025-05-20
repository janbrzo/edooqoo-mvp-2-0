
import React, { useEffect } from "react";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { FormData } from "@/components/WorksheetForm";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index: React.FC = () => {
  // Hooks
  const { userId, loading: authLoading } = useAnonymousAuth();
  const { 
    isGenerating,
    generatedWorksheet,
    inputParams,
    generationTime,
    sourceCount,
    worksheetId,
    generateWorksheet,
    resetWorksheet
  } = useWorksheetGeneration(userId);

  /**
   * Handles form submission and worksheet generation
   */
  const handleFormSubmit = async (data: FormData) => {
    try {
      console.log("Form submitted with data:", data);
      await generateWorksheet(data);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  /**
   * Resets the view to the form
   */
  const handleBack = () => {
    try {
      console.log("Resetting worksheet view");
      resetWorksheet();
    } catch (error) {
      console.error("Error resetting worksheet:", error);
    }
  };

  // Add debug logging to track component rendering and state changes
  useEffect(() => {
    console.log("Index component rendered:", {
      authLoading,
      userId,
      isGenerating,
      hasWorksheet: !!generatedWorksheet,
      worksheetId
    });
  }, [authLoading, userId, isGenerating, generatedWorksheet, worksheetId]);

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Error handling for missing data
  if (userId === null && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
          <p className="mt-2">There was a problem with your session. Please refresh the page and try again.</p>
        </div>
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
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

export default Index;
