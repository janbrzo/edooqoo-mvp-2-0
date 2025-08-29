
import React, { useState } from 'react';
import WorksheetToolbar from './worksheet/WorksheetToolbar';
import WorksheetContent from './worksheet/WorksheetContent';

interface WorksheetDisplayProps {
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  isSaving: boolean;
  handleSave: () => void;
  worksheetId?: string | null;
  userIp?: string;
  isDownloadUnlocked: boolean;
  onDownloadUnlock: (token: string) => void;
  onTrackDownload: () => void;
  showPdfButton: boolean;
  inputParams?: any;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  userId?: string;
}

const WorksheetDisplay = ({
  editableWorksheet,
  setEditableWorksheet,
  isEditing,
  setIsEditing,
  isSaving,
  handleSave,
  worksheetId,
  userIp,
  isDownloadUnlocked,
  onDownloadUnlock,
  onTrackDownload,
  showPdfButton,
  inputParams,
  onFeedbackSubmit,
  userId
}: WorksheetDisplayProps) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="w-full">
      <WorksheetToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        isEditing={isEditing}
        isSaving={isSaving}
        handleEdit={handleEdit}
        handleSave={handleSave}
        worksheetId={worksheetId}
        userIp={userIp}
        isDownloadUnlocked={isDownloadUnlocked}
        onDownloadUnlock={onDownloadUnlock}
        onTrackDownload={onTrackDownload}
        showPdfButton={showPdfButton}
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
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
  );
};

export default WorksheetDisplay;
