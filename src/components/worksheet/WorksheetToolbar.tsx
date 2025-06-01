
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import PaymentPopup from "@/components/PaymentPopup";

interface WorksheetToolbarProps {
  worksheetId: string | null;
  userIp?: string | null;
}

const WorksheetToolbar = ({ worksheetId, userIp }: WorksheetToolbarProps) => {
  const { toast } = useToast();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);

  // Check for existing valid token on component mount
  React.useEffect(() => {
    const downloadToken = sessionStorage.getItem('downloadToken');
    const tokenExpiry = sessionStorage.getItem('downloadTokenExpiry');
    
    if (downloadToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      if (Date.now() < expiryTime) {
        setIsDownloadUnlocked(true);
      } else {
        // Token expired, clean up
        sessionStorage.removeItem('downloadToken');
        sessionStorage.removeItem('downloadTokenExpiry');
      }
    }
  }, []);

  const handleDownloadClick = () => {
    if (isDownloadUnlocked) {
      handleDownload();
    } else {
      setIsPaymentOpen(true);
    }
  };

  const handleDownload = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}-worksheet.html`;
    
    const success = await exportAsHTML('worksheet-display', filename, 'student');
    
    if (success) {
      toast({
        title: "Download successful!",
        description: "Your worksheet has been downloaded as an HTML file.",
        className: "bg-green-50 border-green-200"
      });
    } else {
      toast({
        title: "Download failed",
        description: "There was an error downloading your worksheet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTeacherDownload = async () => {
    if (!isDownloadUnlocked) {
      setIsPaymentOpen(true);
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}-Teacher-worksheet.html`;
    
    const success = await exportAsHTML('worksheet-display', filename, 'teacher');
    
    if (success) {
      toast({
        title: "Teacher version downloaded!",
        description: "Your worksheet with teacher notes has been downloaded.",
        className: "bg-green-50 border-green-200"
      });
    } else {
      toast({
        title: "Download failed",
        description: "There was an error downloading the teacher version. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = (sessionToken: string) => {
    setIsDownloadUnlocked(true);
    setIsPaymentOpen(false);
    
    toast({
      title: "Downloads unlocked!",
      description: "You can now download HTML versions of your worksheet.",
      className: "bg-green-50 border-green-200"
    });
  };

  return (
    <>
      <div className="flex gap-2 mb-6 print:hidden">
        <Button
          onClick={handleDownloadClick}
          className="bg-worksheet-purple hover:bg-worksheet-purpleDark text-white"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloadUnlocked ? 'Download HTML' : 'Unlock Downloads ($1)'}
        </Button>
        
        {isDownloadUnlocked && (
          <Button
            onClick={handleTeacherDownload}
            variant="outline"
            size="sm"
            className="border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purple hover:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Teacher Version
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
