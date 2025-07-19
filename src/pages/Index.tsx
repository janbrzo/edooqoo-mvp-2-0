
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
        console.log('🔄 Restoring worksheet from dashboard:', worksheet);
        
        // FIXED: Map database format to frontend format
        // Database has: form_data, ai_response (JSON string)
        // Frontend expects: inputParams, generatedWorksheet/editableWorksheet (objects)
        
        // Parse ai_response from JSON string to object
        let parsedWorksheet = null;
        if (worksheet.ai_response) {
          try {
            parsedWorksheet = JSON.parse(worksheet.ai_response);
            console.log('✅ Successfully parsed ai_response:', parsedWorksheet);
          } catch (parseError) {
            console.error('❌ Failed to parse ai_response:', parseError);
            console.log('Raw ai_response:', worksheet.ai_response);
          }
        }
        
        if (parsedWorksheet) {
          // Set the parsed worksheet content
          parsedWorksheet.id = worksheet.id;
          worksheetState.setGeneratedWorksheet(parsedWorksheet);
          worksheetState.setEditableWorksheet(parsedWorksheet);
          
          // Map form_data to inputParams (database format -> frontend format)
          if (worksheet.form_data) {
            worksheetState.setInputParams(worksheet.form_data);
            console.log('✅ Successfully mapped form_data to inputParams:', worksheet.form_data);
          }
          
          worksheetState.setWorksheetId(worksheet.id);
          worksheetState.setGenerationTime(worksheet.generation_time_seconds || 5);
          worksheetState.setSourceCount(75); // Default value
          
          console.log('🎉 Worksheet fully restored with content');
        } else {
          console.warn('⚠️ Could not parse worksheet content, removing from storage');
        }
        
        sessionStorage.removeItem('restoredWorksheet');
      } catch (error) {
        console.error('💥 Error restoring worksheet:', error);
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
