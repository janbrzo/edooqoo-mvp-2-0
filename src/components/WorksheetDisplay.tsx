
import React from "react";
import { WorksheetContainer } from "./worksheet/WorksheetContainer";
import WorksheetHeaderSection from "./worksheet/WorksheetHeaderSection";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContent from "./worksheet/WorksheetContent";
import { useDownloadStatus } from "@/hooks/useDownloadStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorksheetValidation } from "@/hooks/useWorksheetValidation";
import { useWorksheetStyles } from "@/hooks/useWorksheetStyles";
import { useWorksheetState } from "@/hooks/useWorksheetState";

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: any[];
  items?: any[];
  sentences?: any[];
  dialogue?: any[];
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
}

export interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: Exercise[];
  vocabulary_sheet: {
    term: string;
    meaning: string;
  }[];
}

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  onDownload,
  worksheetId,
  onFeedbackSubmit
}: WorksheetDisplayProps) {
  const {
    viewMode,
    setViewMode,
    isEditing,
    editableWorksheet,
    setEditableWorksheet,
    handleEdit,
    handleSave
  } = useWorksheetState(worksheet);
  
  const { isDownloadUnlocked, userIp, handleDownloadUnlock, trackDownload } = useDownloadStatus();
  const isMobile = useIsMobile();
  
  useWorksheetValidation(worksheet);
  useWorksheetStyles();

  const handleDownloadWithTracking = () => {
    trackDownload();
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <WorksheetContainer
      worksheetData={editableWorksheet}
      worksheetId={worksheetId}
      onSubmitRating={onFeedbackSubmit}
    >
      <WorksheetHeaderSection
        onBack={onBack}
        generationTime={generationTime}
        sourceCount={sourceCount}
        inputParams={inputParams}
        isMobile={isMobile}
      />
      
      <WorksheetToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        isEditing={isEditing}
        handleEdit={handleEdit}
        handleSave={handleSave}
        worksheetId={worksheetId}
        userIp={userIp}
        isDownloadUnlocked={isDownloadUnlocked}
        onDownloadUnlock={handleDownloadUnlock}
        onTrackDownload={trackDownload}
        showPdfButton={false}
      />

      <WorksheetContent
        editableWorksheet={editableWorksheet}
        isEditing={isEditing}
        viewMode={viewMode}
        setEditableWorksheet={setEditableWorksheet}
        worksheetId={worksheetId}
        onFeedbackSubmit={onFeedbackSubmit}
      />
    </WorksheetContainer>
  );
}
