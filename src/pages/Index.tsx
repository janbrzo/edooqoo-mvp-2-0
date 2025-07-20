
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
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(userId, worksheetState, selectedStudentId);
  const { tokenBalance, hasTokens, isDemo } = useTokenSystem(userId);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);
  const navigate = useNavigate();

  // Check for restored worksheet from dashboard
  useEffect(() => {
    const restoredWorksheet = sessionStorage.getItem('restoredWorksheet');
    const studentName = sessionStorage.getItem('worksheetStudentName');
    
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
          setShowBackButton(true);
          
          console.log('🎉 Worksheet fully restored with student information');
        }
        
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      } catch (error) {
        console.error('💥 Error restoring worksheet:', error);
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      }
    }

    // Check for pre-selected student
    const preSelectedStudentData = sessionStorage.getItem('preSelectedStudent');
    if (preSelectedStudentData) {
      try {
        const student = JSON.parse(preSelectedStudentData);
        setPreSelectedStudent(student);
        setSelectedStudentId(student.id);
        sessionStorage.removeItem('preSelectedStudent');
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

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
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
          {/* Back button for historical worksheets */}
          {showBackButton && (
            <div className="bg-white border-b px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={handleGoBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                </div>
                <Button onClick={() => {
                  sessionStorage.setItem('forceNewWorksheet', 'true');
                  navigate('/');
                }}>
                  Create New Worksheet
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
            onBack={worksheetState.resetWorksheetState}
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
