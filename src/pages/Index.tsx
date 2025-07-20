
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { ArrowLeft, GraduationCap } from "lucide-react";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { userId, loading: authLoading } = useAnonymousAuth();
  const worksheetState = useWorksheetState(authLoading);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string; name: string} | null>(null);
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(userId, worksheetState, selectedStudentId);
  const { tokenBalance, hasTokens, isDemo } = useTokenSystem(userId);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isHistoricalWorksheet, setIsHistoricalWorksheet] = useState(false);
  const navigate = useNavigate();

  // Check for restored worksheet from dashboard or pre-selected student
  useEffect(() => {
    const restoredWorksheet = sessionStorage.getItem('restoredWorksheet');
    const studentName = sessionStorage.getItem('worksheetStudentName');
    const preSelected = sessionStorage.getItem('preSelectedStudent');
    
    if (restoredWorksheet) {
      try {
        const worksheet = JSON.parse(restoredWorksheet);
        console.log('🔄 Restoring worksheet from dashboard:', worksheet);
        
        // Parse ai_response from JSON string to object
        let parsedWorksheet = null;
        if (worksheet.ai_response) {
          try {
            parsedWorksheet = JSON.parse(worksheet.ai_response);
            console.log('✅ Successfully parsed ai_response:', parsedWorksheet);
            
            // Apply deepFixTextObjects to fix {text: "..."} objects
            console.log('🔧 Applying deepFixTextObjects to fix {text} objects...');
            parsedWorksheet = deepFixTextObjects(parsedWorksheet, 'restoredWorksheet');
            console.log('✅ Successfully fixed {text} objects in restored worksheet');
            
          } catch (parseError) {
            console.error('❌ Failed to parse ai_response:', parseError);
          }
        }
        
        if (parsedWorksheet) {
          // Set the parsed worksheet content
          parsedWorksheet.id = worksheet.id;
          worksheetState.setGeneratedWorksheet(parsedWorksheet);
          worksheetState.setEditableWorksheet(parsedWorksheet);
          
          // Map form_data to inputParams and add student info
          if (worksheet.form_data) {
            const inputParamsWithStudent = {
              ...worksheet.form_data,
              studentId: worksheet.student_id,
              studentName: studentName || worksheet.studentName
            };
            worksheetState.setInputParams(inputParamsWithStudent);
            console.log('✅ Successfully mapped form_data with student info:', inputParamsWithStudent);
          }
          
          worksheetState.setWorksheetId(worksheet.id);
          worksheetState.setGenerationTime(worksheet.generation_time_seconds || 5);
          worksheetState.setSourceCount(75);
          setIsHistoricalWorksheet(true);
          
          console.log('🎉 Worksheet fully restored with student information');
        }
        
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      } catch (error) {
        console.error('💥 Error restoring worksheet:', error);
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      }
    } else if (preSelected) {
      try {
        const student = JSON.parse(preSelected);
        setPreSelectedStudent(student);
        sessionStorage.removeItem('preSelectedStudent');
        console.log('🎯 Pre-selected student:', student);
      } catch (error) {
        console.error('Error parsing pre-selected student:', error);
        sessionStorage.removeItem('preSelectedStudent');
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

  const handleBackNavigation = () => {
    if (isHistoricalWorksheet) {
      navigate(-1); // Go back to previous page
    } else {
      worksheetState.resetWorksheetState();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!bothWorksheetsReady ? (
        <FormView 
          onSubmit={handleGenerateWorksheet} 
          userId={userId} 
          onStudentChange={setSelectedStudentId}
          preSelectedStudent={preSelectedStudent}
        />
      ) : (
        <div>
          {isHistoricalWorksheet && (
            <div className="bg-white border-b p-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <Button variant="outline" onClick={handleBackNavigation}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          )}
          <GenerationView 
            worksheetId={worksheetState.worksheetId}
            generatedWorksheet={worksheetState.generatedWorksheet}
            editableWorksheet={worksheetState.editableWorksheet}
            setEditableWorksheet={worksheetState.setEditableWorksheet}
            inputParams={worksheetState.inputParams}
            generationTime={worksheetState.generationTime}
            sourceCount={worksheetState.sourceCount}
            onBack={isHistoricalWorksheet ? handleBackNavigation : worksheetState.resetWorksheetState}
            userId={userId || 'anonymous'}
          />
        </div>
      )}
      
      <GeneratingModal isOpen={isGenerating} />
      
      <TokenPaywallModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        tokenBalance={tokenBalance}
        onUpgrade={() => {
          console.log('Upgrade plan clicked');
          setShowTokenModal(false);
        }}
      />
    </div>
  );
};

export default Index;
