
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, GraduationCap } from "lucide-react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { submitFeedback } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";
import { useStudents } from "@/hooks/useStudents";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";

interface GenerationViewProps {
  worksheetId: string | null;
  generatedWorksheet: any;
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  userId: string;
}

export default function GenerationView({
  worksheetId,
  generatedWorksheet,
  editableWorksheet,
  setEditableWorksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  userId
}: GenerationViewProps) {
  const { toast } = useToast();
  const { students } = useStudents();
  const { userId: authUserId } = useAnonymousAuth();
  const isLoggedIn = !!authUserId;

  // Find student name if studentId is provided in inputParams
  const studentName = inputParams?.studentId 
    ? students.find(s => s.id === inputParams.studentId)?.name 
    : undefined;

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (!worksheetId) {
      toast({
        title: "Error",
        description: "Cannot submit feedback - worksheet ID missing",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitFeedback(worksheetId, rating, feedback, userId);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {!isLoggedIn ? (
          <Button asChild variant="outline">
            <Link to="/auth">Sign In for Free</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">
                <GraduationCap className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </>
        )}
      </div>

      <WorksheetDisplay
        worksheet={generatedWorksheet}
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
        inputParams={inputParams}
        generationTime={generationTime}
        sourceCount={sourceCount}
        onBack={onBack}
        worksheetId={worksheetId}
        onFeedbackSubmit={handleFeedbackSubmit}
        userId={userId}
        studentName={studentName}
      />
    </div>
  );
}
