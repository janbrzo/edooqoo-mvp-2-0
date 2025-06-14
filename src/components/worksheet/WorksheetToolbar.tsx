
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lightbulb, User, Download, Lock } from "lucide-react";
import PaymentPopup from "@/components/PaymentPopup";
import { exportAsHTML } from "@/utils/htmlExport";
import { trackWorksheetEvent } from "@/services/worksheetService";
import { useIsMobile } from "@/hooks/use-mobile";

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
}: WorksheetToolbarProps) => {
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<'html-student' | 'html-teacher' | 'pdf' | null>(null);
  const isMobile = useIsMobile();

  const handleDownloadHTML = async (downloadViewMode: "student" | "teacher") => {
    // Get the actual worksheet title from the page
    const titleElement = document.querySelector('.worksheet-content h1');
    const title = titleElement?.textContent || 'English Worksheet';
    
    const timestamp = new Date().toISOString().split('T')[0];
    const viewModeText = downloadViewMode === 'teacher' ? 'Teacher' : 'Student';
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const filename = `${timestamp}-${viewModeText}-${sanitizedTitle}.html`;
    
    const success = await exportAsHTML('worksheet-content', filename, downloadViewMode, title);
    if (success) {
      // Track download in download_sessions table
      if (onTrackDownload) {
        onTrackDownload();
      }
      
      // Track download in worksheets table - with better error handling
      if (worksheetId) {
        try {
          console.log(`Attempting to track download for worksheet: ${worksheetId}`);
          await trackWorksheetEvent('download', worksheetId, userIp || 'anonymous');
          console.log('Download tracked successfully in worksheets table');
        } catch (error) {
          console.error('Failed to track download in worksheets table:', error);
          // Don't throw error - continue with download even if tracking fails
        }
      } else {
        console.log('No worksheetId provided, skipping worksheet table tracking');
      }
    }
    if (!success) {
      console.error('Failed to export HTML');
    }
  };

  const handleDownloadClick = (type: 'html-student' | 'html-teacher' | 'pdf') => {
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
    <>
      <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'} max-w-[98%] mx-auto`}>
          <div className={`flex ${isMobile ? 'justify-center' : ''} space-x-2`}>
            <Button
              variant={viewMode === 'student' ? 'default' : 'outline'}
              onClick={() => setViewMode('student')}
              className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
              size="sm"
            >
              <User className="mr-2 h-4 w-4" />
              Student View
            </Button>
            <Button
              variant={viewMode === 'teacher' ? 'default' : 'outline'}
              onClick={() => setViewMode('teacher')}
              className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
              size="sm"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Teacher View
            </Button>
          </div>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className={`border-worksheet-purple text-worksheet-purple ${isMobile ? '' : 'mr-2'}`}
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
              </Button>
            )}
            {isEditing && (
              <Button
                onClick={handleSave}
                className={`bg-green-600 hover:bg-green-700 ${isMobile ? '' : 'mr-2'}`}
                size="sm"
              >
                Save Changes
              </Button>
            )}
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
              <Button
                onClick={() => handleDownloadClick('html-student')}
                className={`${isDownloadUnlocked 
                  ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                  : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
                size="sm"
              >
                {isDownloadUnlocked ? (
                  <Download className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isMobile ? 'HTML Student' : 'Download HTML v.Student'}
              </Button>
              <Button
                onClick={() => handleDownloadClick('html-teacher')}
                className={`${isDownloadUnlocked 
                  ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                  : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
                size="sm"
              >
                {isDownloadUnlocked ? (
                  <Download className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isMobile ? 'HTML Teacher' : 'Download HTML v.Teacher'}
              </Button>
            </div>
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
    </>
  );
};

export default WorksheetToolbar;
