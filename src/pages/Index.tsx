
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { userId, loading: authLoading } = useAnonymousAuth();
  const worksheetState = useWorksheetState(authLoading);
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(userId, worksheetState);
  const { tokenBalance, hasTokens, isDemo } = useTokenSystem(userId);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Check for restored worksheet from dashboard
  useEffect(() => {
    const restoredWorksheet = sessionStorage.getItem('restoredWorksheet');
    if (restoredWorksheet) {
      try {
        const worksheet = JSON.parse(restoredWorksheet);
        worksheetState.setGeneratedWorksheet(worksheet);
        worksheetState.setEditableWorksheet(worksheet);
        worksheetState.setInputParams(worksheet.inputParams || {});
        worksheetState.setWorksheetId(worksheet.id);
        worksheetState.setGenerationTime(5); // Default value
        worksheetState.setSourceCount(75); // Default value
        sessionStorage.removeItem('restoredWorksheet');
      } catch (error) {
        console.error('Error restoring worksheet:', error);
        sessionStorage.removeItem('restoredWorksheet');
      }
    }
  }, []);

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // CRITICAL FIX: Check both generatedWorksheet AND editableWorksheet are ready
  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  // Enhanced generation handler that checks for tokens
  const handleGenerateWorksheet = (data: any) => {
    if (!isDemo && !hasTokens) {
      setShowTokenModal(true);
      return;
    }
    generateWorksheetHandler(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!bothWorksheetsReady ? (
        <FormView onSubmit={handleGenerateWorksheet} userId={userId} />
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
      
      <TokenPaywallModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        tokenBalance={tokenBalance}
        onUpgrade={() => {
          // TODO: Implement subscription upgrade
          console.log('Upgrade plan clicked');
          setShowTokenModal(false);
        }}
      />
    </div>
  );
};

export default Index;
