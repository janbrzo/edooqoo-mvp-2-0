import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useWorksheetHistory } from "@/hooks/useWorksheetHistory";
import { useStudents } from "@/hooks/useStudents";
import { Button } from "@/components/ui/button";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { supabase } from "@/integrations/supabase/client";
import { FormData } from "@/components/WorksheetForm/types";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { userId, loading: authLoading } = useAnonymousAuth();
  const worksheetState = useWorksheetState(authLoading);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const { students } = useStudents();
  const { refreshWorksheets } = useWorksheetHistory(userId);
  
  const { isGenerating, generateWorksheetHandler, tokenBalance, hasTokens, isDemo } = useWorksheetGeneration(
    userId, 
    worksheetState, 
    selectedStudentId
  );

  const handleStudentSelect = (studentId: string | null) => {
    setSelectedStudentId(studentId);
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      setSelectedStudentName(student?.name || null);
    } else {
      setSelectedStudentName(null);
    }
  };

  // Check if returning from payment and restore worksheet or check for specific worksheet to open
  useEffect(() => {
    const openWorksheetId = sessionStorage.getItem('openWorksheetId');
    if (openWorksheetId) {
      sessionStorage.removeItem('openWorksheetId');
      loadWorksheetFromHistory(openWorksheetId);
    }
  }, []);

  const loadWorksheetFromHistory = async (worksheetId: string) => {
    try {
      const { data: worksheet, error } = await supabase
        .from('worksheets')
        .select('*')
        .eq('id', worksheetId)
        .single();

      if (error || !worksheet) {
        console.error('Failed to load worksheet:', error);
        return;
      }

      // Parse the stored data and restore worksheet state
      const aiResponse = JSON.parse(worksheet.ai_response);
      const inputParams = worksheet.form_data as unknown as FormData;
      
      worksheetState.setWorksheetId(worksheet.id);
      worksheetState.setInputParams(inputParams);
      worksheetState.setGenerationTime(worksheet.generation_time_seconds || 0);
      worksheetState.setSourceCount(Math.floor(Math.random() * (90 - 65) + 65));
      worksheetState.setGeneratedWorksheet(aiResponse);
      worksheetState.setEditableWorksheet(aiResponse);

      // Set student info if worksheet was for a student
      if (worksheet.student_id) {
        const student = students.find(s => s.id === worksheet.student_id);
        setSelectedStudentId(worksheet.student_id);
        setSelectedStudentName(student?.name || null);
      }
    } catch (error) {
      console.error('Error loading worksheet from history:', error);
    }
  };

  const handleFormSubmit = (data: FormData) => {
    generateWorksheetHandler(data).then(() => {
      // Refresh worksheet history after successful generation
      refreshWorksheets();
    });
  };

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
  
  // Don't show token paywall here - show it when trying to generate

  return (
    <div className="min-h-screen bg-gray-100">
      {!bothWorksheetsReady ? (
        <FormView 
          onSubmit={handleFormSubmit} 
          userId={userId} 
          onStudentSelect={handleStudentSelect}
          selectedStudentId={selectedStudentId}
        />
      ) : (
        <GenerationView 
          worksheetId={worksheetState.worksheetId}
          generatedWorksheet={worksheetState.generatedWorksheet}
          editableWorksheet={worksheetState.editableWorksheet}
          setEditableWorksheet={worksheetState.setEditableWorksheet}
          inputParams={worksheetState.inputParams}
          generationTime={worksheetState.generationTime}
          sourceCount={worksheetState.sourceCount}
          studentName={selectedStudentName}
          onBack={worksheetState.resetWorksheetState}
          userId={userId || 'anonymous'}
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

export default Index;