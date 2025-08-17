
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { PricingSection } from "@/components/PricingSection";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { User, GraduationCap, DollarSign } from "lucide-react";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { user, loading: authLoading, isRegisteredUser, isAnonymous } = useAuthFlow();
  const worksheetState = useWorksheetState(authLoading);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(user?.id || null, worksheetState, selectedStudentId);
  const { tokenLeft, hasTokens, isDemo, profile } = useTokenSystem(user?.id || null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Function to scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Check for pre-selected student from student page
  useEffect(() => {
    const preSelected = sessionStorage.getItem('preSelectedStudent');
    if (preSelected) {
      try {
        const studentData = JSON.parse(preSelected);
        setPreSelectedStudent(studentData);
        setSelectedStudentId(studentData.id);
        sessionStorage.removeItem('preSelectedStudent');
      } catch (error) {
        console.error('Error parsing pre-selected student:', error);
      }
    }
  }, []);

  // Check for restored worksheet from dashboard
  useEffect(() => {
    const restoredWorksheet = sessionStorage.getItem('restoredWorksheet');
    const studentName = sessionStorage.getItem('worksheetStudentName');
    
    if (restoredWorksheet) {
      try {
        const worksheet = JSON.parse(restoredWorksheet);
        console.log('🔄 Restoring worksheet from dashboard:', worksheet);
        
        let parsedWorksheet = null;
        if (worksheet.ai_response) {
          try {
            parsedWorksheet = JSON.parse(worksheet.ai_response);
            console.log('✅ Successfully parsed ai_response:', parsedWorksheet);
            
            parsedWorksheet = deepFixTextObjects(parsedWorksheet, 'restoredWorksheet');
            console.log('✅ Successfully fixed {text} objects in restored worksheet');
            
          } catch (parseError) {
            console.error('❌ Failed to parse ai_response:', parseError);
          }
        }
        
        if (parsedWorksheet) {
          parsedWorksheet.id = worksheet.id;
          worksheetState.setGeneratedWorksheet(parsedWorksheet);
          worksheetState.setEditableWorksheet(parsedWorksheet);
          
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
  }, []);

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
    );
  }

  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  const handleGenerateWorksheet = (data: any) => {
    console.log('🔧 [handleGenerateWorksheet] Debug values:', {
      userId: user?.id || 'null',
      isDemo,
      hasTokens,
      tokenLeft
    });
    
    // CRITICAL FIX: Check token requirements for authenticated users only
    if (!isDemo && !hasTokens) {
      console.log('🔧 [handleGenerateWorksheet] Showing token modal for authenticated user without tokens');
      setShowTokenModal(true);
      return;
    }
    
    console.log('🔧 [handleGenerateWorksheet] Proceeding with generation');
    generateWorksheetHandler(data);
  };

  // Navigation component for authenticated users
  const AuthenticatedNav = () => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
      <Badge variant="outline" className="text-sm">
        Token Left: {tokenLeft}
      </Badge>
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard">
          <GraduationCap className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/profile">
          <User className="h-4 w-4 mr-2" />
          Profile
        </Link>
      </Button>
    </div>
  );

  // Navigation component for anonymous users
  const AnonymousNav = () => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      <Button onClick={scrollToPricing} variant="outline" size="sm">
        <DollarSign className="h-4 w-4 mr-2" />
        Pricing
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Login</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/signup">Get Started Free</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Navigation based on auth status */}
      {isRegisteredUser ? <AuthenticatedNav /> : <AnonymousNav />}
      
      {!bothWorksheetsReady ? (
        <>
          <FormView 
            onSubmit={handleGenerateWorksheet} 
            userId={user?.id || null} 
            onStudentChange={setSelectedStudentId}
            preSelectedStudent={preSelectedStudent}
            isRegisteredUser={!!isRegisteredUser}
          />
          
          {/* Add pricing section below the form for anonymous users */}
          {!isRegisteredUser && (
            <div id="pricing-section">
              <PricingSection />
            </div>
          )}
        </>
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
          userId={isRegisteredUser ? user?.id || null : null}
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
      
      <TokenPaywallModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        availableTokens={tokenLeft}
        profile={profile}
        onUpgrade={() => {
          console.log('Upgrade plan clicked');
          setShowTokenModal(false);
        }}
      />
    </div>
  );
};

export default Index;
