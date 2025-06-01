
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, Eye, EyeOff, Edit, Save } from "lucide-react";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import PaymentPopup from "@/components/PaymentPopup";

interface WorksheetToolbarProps {
  viewMode: 'student' | 'teacher';
  setViewMode: React.Dispatch<React.SetStateAction<'student' | 'teacher'>>;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadHTML: () => void;
  handleDownloadPDF: () => void;
  worksheetId: string | null;
  userIp?: string | null;
  isDownloadUnlocked: boolean;
  onDownloadUnlock: (token: string) => void;
  showPdfButton: boolean;
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
  userIp,
  isDownloadUnlocked,
  onDownloadUnlock,
  showPdfButton
}: WorksheetToolbarProps) => {
  const { toast } = useToast();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const handleDownloadClick = () => {
    if (isDownloadUnlocked) {
      handleDownloadHTML();
    } else {
      setIsPaymentOpen(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = (sessionToken: string) => {
    onDownloadUnlock(sessionToken);
    setIsPaymentOpen(false);
    
    toast({
      title: "Downloads unlocked!",
      description: "You can now download HTML versions of your worksheet.",
      className: "bg-green-50 border-green-200"
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-md p-1">
          <Button
            onClick={() => setViewMode('student')}
            variant={viewMode === 'student' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'student' ? 'bg-worksheet-purple text-white' : ''}
          >
            <Eye className="w-4 h-4 mr-2" />
            Student View
          </Button>
          <Button
            onClick={() => setViewMode('teacher')}
            variant={viewMode === 'teacher' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'teacher' ? 'bg-worksheet-purple text-white' : ''}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Teacher View
          </Button>
        </div>

        {/* Edit/Save Toggle */}
        {isEditing ? (
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        ) : (
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Worksheet
          </Button>
        )}
        
        {/* Download Buttons */}
        <Button
          onClick={handleDownloadClick}
          className="bg-worksheet-purple hover:bg-worksheet-purpleDark text-white"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloadUnlocked ? 'Download HTML' : 'Unlock Downloads ($1)'}
        </Button>
        
        {isDownloadUnlocked && viewMode === 'teacher' && (
          <Button
            onClick={handleDownloadHTML}
            variant="outline"
            size="sm"
            className="border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purple hover:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Teacher Version
          </Button>
        )}
        
        {/* PDF Download - only show if enabled */}
        {showPdfButton && isDownloadUnlocked && (
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
        
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <PaymentPopup
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        worksheetId={worksheetId}
        userIp={userIp}
      />
    </>
  );
};

export default WorksheetToolbar;
