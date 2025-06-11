import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContainer from "./worksheet/WorksheetContainer";
import WorksheetContent from "./worksheet/WorksheetContent";
import { useDownloadStatus } from "@/hooks/useDownloadStatus";

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
  wordBankOrder,
  onDownload,
  worksheetId,
  onFeedbackSubmit
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const { toast } = useToast();
  const { isDownloadUnlocked, userIp, handleDownloadUnlock, trackDownload } = useDownloadStatus();
  
  useEffect(() => {
    validateWorksheetStructure();
    
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 10mm;
        }
        
        .page-number {
          position: fixed;
          bottom: 10mm;
          right: 10mm;
          font-size: 10pt;
          color: #666;
        }
        
        .page-number::before {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const validateWorksheetStructure = () => {
    if (!worksheet) {
      toast({
        title: "Invalid worksheet data",
        description: "The worksheet data is missing or invalid.",
        variant: "destructive"
      });
      return;
    }
    
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return;
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };

  const handleDownloadWithTracking = () => {
    trackDownload();
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <WorksheetContainer
      worksheetId={worksheetId}
      onDownload={handleDownloadWithTracking}
      isDownloadUnlocked={isDownloadUnlocked}
      viewMode={viewMode}
      editableWorksheet={editableWorksheet}
    >
      <div className="mb-6">
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
          onDownloadUnlock={handleDownloadUnlock}
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
      </div>
    </WorksheetContainer>
  );
}
