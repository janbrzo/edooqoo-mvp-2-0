
import { useState, useRef } from "react";
import { generatePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import WorksheetContainer from "./worksheet/display/WorksheetContainer";

export interface Exercise {
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
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  // Handle scroll events
  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
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
        const result = await generatePDF('worksheet-content', `${editableWorksheet.title.replace(/\s+/g, '_')}.pdf`, viewMode === 'teacher', editableWorksheet.title);
        
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
      <WorksheetContainer
        worksheet={worksheet}
        inputParams={inputParams}
        generationTime={generationTime}
        sourceCount={sourceCount}
        onBack={onBack}
        viewMode={viewMode}
        isEditing={isEditing}
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
        showScrollTop={showScrollTop}
        scrollToTop={scrollToTop}
        handleEdit={handleEdit}
        handleSave={handleSave}
        handleDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}
