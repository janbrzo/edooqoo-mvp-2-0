
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lightbulb, User, Download, Lock } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

interface WorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadHTML: () => void;
  handleDownloadPDF: () => void;
  worksheetId: string;
}

const WorksheetToolbar = ({
  viewMode,
  setViewMode,
  isEditing,
  handleEdit,
  handleSave,
  handleDownloadHTML,
  handleDownloadPDF,
  worksheetId,
}: WorksheetToolbarProps) => {
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; type: 'pdf' | 'html' | null }>({
    isOpen: false,
    type: null
  });
  
  const { paymentStatus } = usePaymentStatus(worksheetId);

  const handleDownloadClick = (type: 'pdf' | 'html') => {
    if (paymentStatus.isPaid) {
      // User has paid, allow direct download
      if (type === 'pdf') {
        handleDownloadPDF();
      } else {
        handleDownloadHTML();
      }
    } else {
      // User hasn't paid, show payment modal
      setPaymentModal({ isOpen: true, type });
    }
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, type: null });
  };

  const handlePaymentSuccess = () => {
    closePaymentModal();
    // Payment status will be updated by the hook
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
              onClick={() => handleDownloadClick('html')}
              className={paymentStatus.isPaid 
                ? "bg-worksheet-purple hover:bg-worksheet-purpleDark mr-2" 
                : "bg-orange-500 hover:bg-orange-600 mr-2"
              }
              size="sm"
            >
              {paymentStatus.isPaid ? (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download HTML
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> HTML - $1.00
                </>
              )}
            </Button>
            <Button
              onClick={() => handleDownloadClick('pdf')}
              className={paymentStatus.isPaid 
                ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" 
                : "bg-orange-500 hover:bg-orange-600"
              }
              size="sm"
            >
              {paymentStatus.isPaid ? (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> PDF - $1.00
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        worksheetId={worksheetId}
        exportType={paymentModal.type || 'pdf'}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default WorksheetToolbar;
