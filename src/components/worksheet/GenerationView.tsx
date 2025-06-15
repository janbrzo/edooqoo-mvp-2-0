import React from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { submitFeedback } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";

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
      // The service layer now handles showing an error toast,
      // so we don't need to show another one here.
    }
  };

  return (
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
    />
  );
}
