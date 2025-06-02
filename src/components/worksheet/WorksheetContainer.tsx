
import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfUtils";
import { FormData } from "@/components/WorksheetForm";

interface WorksheetContainerProps {
  children: React.ReactNode;
  worksheetId?: string | null;
  onDownload?: () => void;
  isDownloadUnlocked: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
}

export default function WorksheetContainer({
  children,
  worksheetId,
  onDownload,
  isDownloadUnlocked,
  viewMode,
  editableWorksheet
}: WorksheetContainerProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDownloadPDF = async () => {
    if (!isDownloadUnlocked) {
      toast({
        title: "Payment Required",
        description: "Please complete payment to download files.",
        variant: "destructive"
      });
      return;
    }

    if (worksheetRef.current) {
      try {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
        const filename = `${formattedDate}-${viewModeText}-${editableWorksheet.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        
        const result = await generatePDF('worksheet-content', filename, viewMode === 'teacher', editableWorksheet.title);
        if (result) {
          toast({
            title: "PDF Downloaded",
            description: "Your worksheet has been downloaded successfully."
          });
          if (onDownload) {
            onDownload();
          }
        } else {
          toast({
            title: "PDF Generation Failed",
            description: "There was an error generating your PDF. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6" data-worksheet-id={worksheetId || undefined}>
      <style>{`
        @media print {
          @page {
            margin: 2mm 4.5mm 10mm 4.5mm !important;
          }
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .worksheet-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      {children}
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
