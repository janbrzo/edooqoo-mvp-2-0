import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDownloadTracking } from "@/hooks/useDownloadTracking";
import { usePaymentTracking } from "@/hooks/usePaymentTracking";
import { updateWorksheet } from "@/services/worksheetService";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContainer from "./worksheet/WorksheetContainer";
import WorksheetContent from "./worksheet/WorksheetContent";
import WorksheetViewTracking from "./worksheet/WorksheetViewTracking";
import { useDownloadStatus } from "@/hooks/useDownloadStatus";
import { useIsMobile } from "@/hooks/use-mobile";

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
  studentName?: string;
  onStudentChange?: () => void;
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
  userId,
  studentName,
  onStudentChange
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isDownloadUnlocked, userIp, handleDownloadUnlock, trackDownload, checkTokenGeneratedWorksheet } = useDownloadStatus();
  const isMobile = useIsMobile();
  const { trackDownloadAttempt } = useDownloadTracking(userId);
  const { trackPaymentButtonClick } = usePaymentTracking(userId);
  
  useEffect(() => {
    validateWorksheetStructure();
    
    // AUTO-UNLOCK: Check if this is a token-generated worksheet
    if (userId && worksheetId) {
      console.log('🔍 Checking if worksheet should be auto-unlocked for user:', userId);
      checkTokenGeneratedWorksheet(worksheetId, userId);
    }
    
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
      
      /* Mobile responsive styles */
      @media (max-width: 767px) {
        .container {
          padding: 10px !important;
        }
        
        .worksheet-content {
          padding: 15px !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-4 {
          grid-template-columns: 1fr !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-3 {
          grid-template-columns: 1fr !important;
        }
        
        .text-3xl {
          font-size: 1.5rem !important;
          line-height: 2rem !important;
        }
        
        .text-xl {
          font-size: 1.125rem !important;
          line-height: 1.5rem !important;
        }
        
        .p-6 {
          padding: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [userId, worksheetId, checkTokenGeneratedWorksheet]);
  
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
  
  const handleSave = async () => {
    if (!worksheetId) {
      toast({
        title: "Cannot save changes",
        description: "Missing worksheet ID",
        variant: "destructive"
      });
      return;
    }

    // Handle anonymous users - save locally only
    if (!userId) {
      setIsEditing(false);
      toast({
        title: "Changes saved locally",
        description: "Your changes have been saved in this browser. Log in to save them to your account.",
        className: "bg-green-50 border-green-200"
      });
      console.log('📝 Anonymous user changes saved locally');
      return;
    }

    // Handle logged-in users - save to database
    setIsSaving(true);
    
    try {
      console.log('💾 Saving worksheet changes to database...');
      await updateWorksheet(worksheetId, editableWorksheet, userId);
      
      setIsEditing(false);
      toast({
        title: "Changes saved successfully",
        description: "Your worksheet has been updated and saved to the database.",
        className: "bg-green-50 border-green-200"
      });
      
      console.log('✅ Worksheet changes saved successfully');
    } catch (error) {
      console.error('❌ Error saving worksheet changes:', error);
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "An unexpected error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced download handler with tracking
  const handleDownloadWithTracking = () => {
    // Track download attempt with proper locked/unlocked distinction
    trackDownloadAttempt(isDownloadUnlocked, worksheetId || 'unknown');

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
            studentName={studentName}
            worksheetId={worksheetId}
            onStudentChange={onStudentChange}
          />
          <InputParamsCard inputParams={inputParams} />
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
