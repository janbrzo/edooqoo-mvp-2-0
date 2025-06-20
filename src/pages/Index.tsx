
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { userId, loading: authLoading, isAuthenticated, user } = useAuth();
  const worksheetState = useWorksheetState(authLoading);
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(userId, worksheetState);

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show auth prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">English Worksheet Generator</h1>
            <p className="text-gray-600">Create personalized worksheets for your English teaching</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Sign in to start creating custom worksheets for your students
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button asChild size="lg">
                <Link to="/auth">Sign In / Create Account</Link>
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>✓ Create unlimited worksheets</p>
            <p>✓ Save your teaching preferences</p>
            <p>✓ Track your worksheet history</p>
          </div>
        </div>
      </div>
    );
  }

  // Check both generatedWorksheet AND editableWorksheet are ready
  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with user info */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">English Worksheet Generator</h1>
            <div className="flex items-center space-x-4">
              {user?.email && (
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!bothWorksheetsReady ? (
        <FormView onSubmit={generateWorksheetHandler} />
      ) : (
        <GenerationView 
          worksheetId={worksheetState.worksheetId}
          generatedWorksheet={worksheetState.generatedWorksheet}
          editableWorksheet={worksheetState.editableWorksheet}
          setEditableWorksheet={worksheetState.setEditableWorksheet}
          inputParams={worksheetState.inputParams}
          generationTime={worksheetState.generationTime}
          sourceCount={worksheetState.sourceCount}
          onBack={worksheetState.resetWorksheetState}
          userId={userId || 'anonymous'}
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

export default Index;
