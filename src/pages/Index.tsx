import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { PricingCalculator } from "@/components/PricingCalculator";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { User, GraduationCap, Zap, Users, CheckCircle } from "lucide-react";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { user, loading: authLoading, isRegisteredUser, isAnonymous } = useAuthFlow();
  const worksheetState = useWorksheetState(authLoading);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const { isGenerating, generateWorksheetHandler } = useWorksheetGeneration(user?.id || null, worksheetState, selectedStudentId);
  const { tokenBalance, hasTokens, isDemo } = useTokenSystem(user?.id || null);
  const [showTokenModal, setShowTokenModal] = useState(false);

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
      </div>
    );
  }

  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  const handleGenerateWorksheet = (data: any) => {
    if (!isDemo && !hasTokens) {
      setShowTokenModal(true);
      return;
    }
    generateWorksheetHandler(data);
  };

  // For Teachers section with integrated pricing calculator
  const ForTeachersSection = () => (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Pricing Calculator with solid white background */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
          <PricingCalculator onRecommendation={() => {}} />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Demo */}
          <Card className="relative border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Free Demo
              </CardTitle>
              <CardDescription>Try it out with limited features</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">Free</span>
              </div>
              <Badge variant="secondary">2 worksheets to try</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link to="/auth?plan=demo">Start Free Demo</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Side-Gig Plan */}
          <Card className="relative border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                Side-Gig Plan
              </CardTitle>
              <CardDescription>Perfect for part-time teachers</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$9</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <Badge variant="secondary">15 worksheets/month</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link to="/auth?plan=side-gig">Choose Side-Gig</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Full-Time Plan with dropdown */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                Full-Time Plan
              </CardTitle>
              <CardDescription>For professional teachers</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">From $19</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              
              {/* Dropdown selection */}
              <div className="mt-4">
                <select 
                  className="w-full p-2 border rounded-lg bg-background"
                  defaultValue="30"
                  onChange={(e) => {
                    const value = e.target.value;
                    const plans = {
                      '30': 'full-time-30',
                      '60': 'full-time-60', 
                      '90': 'full-time-90',
                      '120': 'full-time-120'
                    };
                    window.location.href = `/auth?plan=${plans[value as keyof typeof plans]}`;
                  }}
                >
                  <option value="30">30 worksheets/month - $19</option>
                  <option value="60">60 worksheets/month - $39</option>
                  <option value="90">90 worksheets/month - $59</option>
                  <option value="120">120 worksheets/month - $79</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link to="/auth?plan=full-time">Choose Full-Time</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Navigation component for authenticated users
  const AuthenticatedNav = () => (
    <div className="fixed top-4 right-4 z-10 flex items-center gap-4">
      <Badge variant="outline" className="text-sm">
        Balance: {tokenBalance} tokens
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
    <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">Sign In</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/auth">Register</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation based on auth status */}
      {isRegisteredUser ? <AuthenticatedNav /> : <AnonymousNav />}
      
      {!bothWorksheetsReady ? (
        <div className="space-y-0">
          <FormView 
            onSubmit={handleGenerateWorksheet} 
            userId={user?.id || null} 
            onStudentChange={setSelectedStudentId}
            preSelectedStudent={preSelectedStudent}
            isRegisteredUser={!!isRegisteredUser}
          />
          
          {/* Show For Teachers section for anonymous users */}
          {!isRegisteredUser && <ForTeachersSection />}
        </div>
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
          userId={user?.id || 'anonymous'}
        />
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
