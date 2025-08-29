
import React from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { submitFeedback } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";
import { useStudents } from "@/hooks/useStudents";

interface GenerationViewProps {
  worksheetId: string | null;
  generatedWorksheet: any;
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  userId: string | null;
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

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback",
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
      <WorksheetDisplay
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
        isEditing={false}
        setIsEditing={() => {}}
        isSaving={false}
        handleSave={() => {}}
        worksheetId={worksheetId}
        isDownloadUnlocked={false}
        onDownloadUnlock={() => {}}
        onTrackDownload={() => {}}
        showPdfButton={false}
        inputParams={inputParams}
        onFeedbackSubmit={handleFeedbackSubmit}
        userId={userId || undefined}
      />
    </div>
  );
}
