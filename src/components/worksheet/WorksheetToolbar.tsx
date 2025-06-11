
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lightbulb, User, Download, Lock } from "lucide-react";
import PaymentPopup from "@/components/PaymentPopup";
import { exportAsHTML } from "@/utils/htmlExport";

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

  const handleDownloadHTML = async (downloadViewMode: "student" | "teacher") => {
    // Get the actual worksheet title from the page
    const titleElement = document.querySelector('.worksheet-content h1');
    const title = titleElement?.textContent || 'English Worksheet';
    
    const timestamp = new Date().toISOString().split('T')[0];
    const viewModeText = downloadViewMode === 'teacher' ? 'Teacher' : 'Student';
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const filename = `${timestamp}-${viewModeText}-${sanitizedTitle}.html`;
    
    const success = await exportAsHTML('worksheet-content', filename, downloadViewMode, title);
    if (success && onTrackDownload) {
      onTrackDownload(); // Track the download in database
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
        <div className="flex justify-between items-center max-w-[98%] mx-auto">
          <div className="flex space-x-2">
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
          <div className="flex items-center">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-worksheet-purple text-worksheet-purple mr-2"
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
              </Button>
            )}
            {isEditing && (
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 mr-2"
                size="sm"
              >
                Save Changes
              </Button>
            )}
            <Button
              onClick={() => handleDownloadClick('html-student')}
              className={`mr-2 ${isDownloadUnlocked 
                ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                : 'bg-gray-400 hover:bg-gray-500'}`}
              size="sm"
            >
              {isDownloadUnlocked ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Download HTML v.Student
            </Button>
            <Button
              onClick={() => handleDownloadClick('html-teacher')}
              className={`mr-2 ${isDownloadUnlocked 
                ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                : 'bg-gray-400 hover:bg-gray-500'}`}
              size="sm"
            >
              {isDownloadUnlocked ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Download HTML v.Teacher
            </Button>
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
