
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp } from "lucide-react";
import { generatePDF } from "@/utils/pdfUtils";
import { Worksheet } from "@/types/worksheet";
import WorksheetContent from "./WorksheetContent";
import WorksheetHeader from "./WorksheetHeader";
import InputParamsCard from "./InputParamsCard";
import WorksheetToolbar from "./WorksheetToolbar";
import RatingSection from "./RatingSection";
import TeacherNotes from "./TeacherNotes";

interface WorksheetContainerProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
}

export default function WorksheetContainer({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload
}: WorksheetContainerProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
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

  const handleDownloadPDF = async () => {
    if (worksheetRef.current) {
      toast({
        title: "Preparing PDF",
        description: "Your worksheet is being converted to PDF..."
      });
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const sanitizedTitle = editableWorksheet.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const filename = `${currentDate}-${sanitizedTitle}.pdf`;

        const result = await generatePDF(
          'worksheet-content',
          filename,
          viewMode === 'teacher',
          editableWorksheet.title
        );

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
    <div className="container mx-auto py-6">
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
          handleDownloadPDF={handleDownloadPDF}
        />
        <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef}>
          <WorksheetContent
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            isEditing={isEditing}
            viewMode={viewMode}
          />
        </div>
      </div>

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
