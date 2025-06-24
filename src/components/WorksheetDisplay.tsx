
import { useState, useEffect } from "react";
import { useDownloadTracking } from "@/hooks/useDownloadTracking";
import { usePaymentTracking } from "@/hooks/usePaymentTracking";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContainer from "./worksheet/WorksheetContainer";
import WorksheetContent from "./worksheet/WorksheetContent";
import WorksheetViewTracking from "./worksheet/WorksheetViewTracking";
import { useDownloadStatus } from "@/hooks/useDownloadStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorksheetValidation } from "./worksheet/WorksheetDisplayValidation";
import { useWorksheetStyles } from "./worksheet/WorksheetDisplayStyles";
import WorksheetDisplayActions from "./worksheet/WorksheetDisplayActions";

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
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
  userId?: string;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload,
  worksheetId,
  onFeedbackSubmit,
  editableWorksheet,
  setEditableWorksheet,
  userId
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const { isDownloadUnlocked, userIp, handleDownloadUnlock, trackDownload } = useDownloadStatus();
  const isMobile = useIsMobile();
  const { trackDownloadAttempt } = useDownloadTracking(userId);
  const { trackPaymentButtonClick } = usePaymentTracking(userId);
  const { validateWorksheetStructure } = useWorksheetValidation();
  const { handleEdit, handleSave } = WorksheetDisplayActions({
    onEdit: () => setIsEditing(true),
    onSave: () => setIsEditing(false),
    isEditing
  });
  
  useWorksheetStyles();
  
  useEffect(() => {
    validateWorksheetStructure(worksheet);
  }, [worksheet, validateWorksheetStructure]);

  // Enhanced download handler with tracking
  const handleDownloadWithTracking = () => {
    // Track download attempt with proper locked/unlocked distinction
    trackDownloadAttempt(!isDownloadUnlocked, worksheetId || 'unknown');

    trackDownload();
    if (onDownload) {
      onDownload();
    }
  };

  // Enhanced payment unlock handler with tracking
  const handleDownloadUnlockWithTracking = (token: string) => {
    trackPaymentButtonClick(worksheetId || 'unknown', 1);

    handleDownloadUnlock(token);
  };

  return (
    <WorksheetViewTracking worksheetId={worksheetId} userId={userId}>
      <WorksheetContainer
        worksheetId={worksheetId}
        onDownload={handleDownloadWithTracking}
        isDownloadUnlocked={isDownloadUnlocked}
        viewMode={viewMode}
        editableWorksheet={editableWorksheet}
      >
        <div className={`mb-6 ${isMobile ? 'px-2' : ''}`}>
          <WorksheetHeader
            onBack={onBack}
            generationTime={generationTime}
            sourceCount={sourceCount}
            inputParams={inputParams}
          />
          <InputParamsCard inputParams={inputParams} />
          <WorksheetToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            isEditing={isEditing}
            handleEdit={handleEdit}
            handleSave={handleSave}
            worksheetId={worksheetId}
            userIp={userIp}
            isDownloadUnlocked={isDownloadUnlocked}
            onDownloadUnlock={handleDownloadUnlockWithTracking}
            onTrackDownload={trackDownload}
            showPdfButton={false}
            editableWorksheet={editableWorksheet}
            userId={userId}
          />

          <WorksheetContent
            editableWorksheet={editableWorksheet}
            isEditing={isEditing}
            viewMode={viewMode}
            setEditableWorksheet={setEditableWorksheet}
            worksheetId={worksheetId}
            onFeedbackSubmit={onFeedbackSubmit}
            isDownloadUnlocked={isDownloadUnlocked}
            inputParams={inputParams}
          />
        </div>
      </WorksheetContainer>
    </WorksheetViewTracking>
  );
}
