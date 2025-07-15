
import React from "react";
import { Link } from "react-router-dom";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { Button } from "@/components/ui/button";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywall } from "@/components/TokenPaywall";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { userId, loading: authLoading } = useAnonymousAuth();
  const worksheetState = useWorksheetState(authLoading);
  const { isGenerating, generateWorksheetHandler, tokenBalance, hasTokens, isDemo } = useWorksheetGeneration(userId, worksheetState);

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
  
  // Show paywall if authenticated user has no tokens
  const shouldShowPaywall = !isDemo && !hasTokens && !bothWorksheetsReady;

  return (
    <div className="min-h-screen bg-gray-100">
      {shouldShowPaywall ? (
        <div className="container mx-auto px-4 py-8">
          <TokenPaywall 
            isDemo={isDemo}
            tokenBalance={tokenBalance}
            onUpgrade={() => {
              // TODO: Implement subscription upgrade
              console.log('Upgrade plan clicked');
            }}
          />
        </div>
      ) : !bothWorksheetsReady ? (
        <FormView onSubmit={generateWorksheetHandler} userId={userId} />
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
