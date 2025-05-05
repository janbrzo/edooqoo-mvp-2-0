
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { generatePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import ExerciseSection from "./worksheet/ExerciseSection";
import VocabularySheet from "./worksheet/VocabularySheet";
import TeacherNotes from "./worksheet/TeacherNotes";
import WorksheetRating from "@/components/WorksheetRating";
import { FormData } from "@/components/WorksheetForm";

// Types
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
  [key: string]: any;
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
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  userId?: string;
}

/**
 * Component for displaying a complete worksheet with editing capabilities
 */
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
  userId
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Validate the worksheet structure and set up page number CSS for PDF
  useEffect(() => {
    validateWorksheetStructure();
    
    // Add page numbers CSS for PDF
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  /**
   * Validates that the worksheet has all required components and data
   */
  const validateWorksheetStructure = () => {
    if (!worksheet) {
      toast({
        title: "Invalid worksheet data",
        description: "The worksheet data is missing or invalid.",
        variant: "destructive"
      });
      return;
    }
    
    // Check for exercises
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return;
    }
    
    // Check for reading exercises and word count
    const readingExercise = worksheet.exercises.find(ex => ex.type === 'reading');
    if (readingExercise && readingExercise.content) {
      const wordCount = readingExercise.content.split(/\s+/).filter(Boolean).length;
      if (wordCount < 280 || wordCount > 320) {
        toast({
          title: "Reading exercise issue",
          description: `Reading content has ${wordCount} words (target: 280-320).`,
          variant: "destructive"
        });
      }
    }
    
    // Check for template content in fill-in-blanks
    const templatePattern = /This is (sentence|question) \d+ with/i;
    worksheet.exercises.forEach((exercise) => {
      if (exercise.sentences && Array.isArray(exercise.sentences)) {
        const hasTemplates = exercise.sentences.some((s: any) => 
          templatePattern.test(s.text || '')
        );
        
        if (hasTemplates) {
          toast({
            title: "Template content detected",
            description: "Some exercises contain generic template sentences.",
            variant: "default" // Zmiana z "warning" na "default"
          });
        }
      }
    });
  };
  
  /**
   * Scrolls the window to the top
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Set up scroll event listener to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  /**
   * Toggles editing mode on
   */  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  /**
   * Saves edits and toggles editing mode off
   */
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };
  
  /**
   * Generates and downloads the worksheet as PDF
   */
  const handleDownloadPDF = async () => {
    if (worksheetRef.current) {
      try {
        // Create current date format YYYY-MM-DD
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
          {/* Add page number element for PDF */}
          <div className="page-number"></div>
          
          <div className="bg-white p-6 border rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableWorksheet.title} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    title: e.target.value
                  })} 
                  className="w-full border p-2 editable-content" 
                />
              ) : editableWorksheet.title}
            </h1>
            
            <h2 className="text-xl text-worksheet-purple mb-3 leading-tight">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableWorksheet.subtitle} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    subtitle: e.target.value
                  })} 
                  className="w-full border p-2 editable-content" 
                />
              ) : editableWorksheet.subtitle}
            </h2>
            
            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
              {isEditing ? (
                <textarea 
                  value={editableWorksheet.introduction} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    introduction: e.target.value
                  })} 
                  className="w-full h-20 border p-2 editable-content" 
                />
              ) : (
                <p className="leading-snug">{editableWorksheet.introduction}</p>
              )}
            </div>
          </div>

          {editableWorksheet.exercises.map((exercise, index) => (
            <ExerciseSection
              key={index}
              exercise={exercise}
              index={index}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          ))}

          {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
            <VocabularySheet
              vocabularySheet={editableWorksheet.vocabulary_sheet}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          )}

          {/* Rating and teacher notes sections */}
          <WorksheetRating 
            worksheetId={worksheetId || undefined}
            onSubmitRating={onFeedbackSubmit || onDownload} 
          />
          
          <TeacherNotes />
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
