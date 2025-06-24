
import React, { useState } from "react";
import PaymentPopup from "@/components/PaymentPopup";
import { exportAsHTML } from "@/utils/htmlExport";
import { trackWorksheetEvent } from "@/services/worksheetService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDownloadTracking } from "@/hooks/useDownloadTracking";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import ViewModeToggle from "./toolbar/ViewModeToggle";
import EditActions from "./toolbar/EditActions";
import DownloadActions from "./toolbar/DownloadActions";

interface WorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  worksheetId?: string | null;
  userIp?: string | null;
  isDownloadUnlocked?: boolean;
  onDownloadUnlock?: (token: string) => void;
  onTrackDownload?: () => void;
  showPdfButton?: boolean;
  editableWorksheet: any;
  userId?: string;
}

const WorksheetToolbar = ({
  viewMode,
  setViewMode,
  isEditing,
  handleEdit,
  handleSave,
  worksheetId,
  userIp,
  isDownloadUnlocked = false,
  onDownloadUnlock,
  onTrackDownload,
  showPdfButton = false,
  editableWorksheet,
  userId,
}: WorksheetToolbarProps) => {
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<'html-student' | 'html-teacher' | 'pdf' | null>(null);
  const isMobile = useIsMobile();
  const { trackDownloadAttempt } = useDownloadTracking(userId);

  const handleDownloadHTML = async (downloadViewMode: "student" | "teacher") => {
    const originalViewMode = viewMode;

    const performExport = async () => {
      // Get the actual worksheet title from editableWorksheet
      const title = editableWorksheet?.title || 'English Worksheet';
      
      const timestamp = new Date().toISOString().split('T')[0];
      const viewModeText = downloadViewMode === 'teacher' ? 'Teacher' : 'Student';
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const filename = `${timestamp}-${viewModeText}-${sanitizedTitle}.html`;
      
      console.log(`Preparing to download HTML for ${downloadViewMode} view.`);
      
      const success = await exportAsHTML('worksheet-content', filename, downloadViewMode, title);
      
      if (success) {
        if (onTrackDownload) {
          onTrackDownload();
        }
        
        if (worksheetId) {
          try {
            console.log(`Attempting to track download for worksheet: ${worksheetId}`);
            await trackWorksheetEvent('download', worksheetId, userIp || 'anonymous');
            console.log('Download tracked successfully in worksheets table');
          } catch (error) {
            console.error('Failed to track download in worksheets table:', error);
          }
        } else {
          console.log('No worksheetId provided, skipping worksheet table tracking');
        }
      }
      if (!success) {
        console.error('Failed to export HTML');
      }
    };

    if (originalViewMode === downloadViewMode) {
      await performExport();
    } else {
      // Switch view, wait for DOM update, export, then switch back.
      setViewMode(downloadViewMode);
      // Use a short timeout to allow React to re-render the component tree.
      await new Promise(resolve => setTimeout(resolve, 200)); 
      try {
        await performExport();
      } finally {
        // Switch back to the original view mode.
        setViewMode(originalViewMode);
      }
    }
  };

  const handleDownloadClick = async (type: 'html-student' | 'html-teacher' | 'pdf') => {
    // Track download attempt with proper locked/unlocked distinction
    trackDownloadAttempt(!isDownloadUnlocked, worksheetId || 'unknown', {
      downloadType: type
    });

    if (isDownloadUnlocked) {
      if (type === 'html-student') {
        handleDownloadHTML('student');
      } else if (type === 'html-teacher') {
        handleDownloadHTML('teacher');
      }
    } else {
      setPendingAction(type);
      setShowPaymentPopup(true);
    }
  };

  const handlePaymentSuccess = (token: string) => {
    if (onDownloadUnlock) {
      onDownloadUnlock(token);
    }
    
    if (pendingAction === 'html-student') {
      handleDownloadHTML('student');
    } else if (pendingAction === 'html-teacher') {
      handleDownloadHTML('teacher');
    }
    
    setPendingAction(null);
  };

  const handlePaymentPopupClose = () => {
    setShowPaymentPopup(false);
    setPendingAction(null);
  };

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'} max-w-[98%] mx-auto`}>
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            <EditActions
              isEditing={isEditing}
              onEdit={handleEdit}
              onSave={handleSave}
            />
            <DownloadActions
              isDownloadUnlocked={isDownloadUnlocked}
              onDownloadClick={handleDownloadClick}
            />
          </div>
        </div>
      </div>

      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={handlePaymentPopupClose}
        onPaymentSuccess={handlePaymentSuccess}
        worksheetId={worksheetId}
        userIp={userIp}
      />
    </TooltipProvider>
  );
};

export default WorksheetToolbar;
