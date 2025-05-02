
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

interface Exercise {
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
  id?: string;
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
  const [error, setError] = useState<string | null>(null);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Validing if worksheet has proper structure
  useEffect(() => {
    if (!worksheet?.exercises || !Array.isArray(worksheet.exercises)) {
      setError("Arkusz pracy nie został poprawnie wygenerowany. Brak ćwiczeń.");
      console.error("Invalid worksheet structure:", worksheet);
      return;
    }
    
    // Check if exercises are missing content
    const incompleteExercises = worksheet.exercises.filter(exercise => {
      if (exercise.type === "reading" && (!exercise.content || !exercise.questions)) {
        return true;
      }
      if (exercise.type === "matching" && (!exercise.items || exercise.items.length === 0)) {
        return true;
      }
      if (exercise.type === "multiple-choice" && (!exercise.questions || exercise.questions.length === 0)) {
        return true;
      }
      if (exercise.type === "fill-in-blanks" && (!exercise.sentences || !exercise.word_bank)) {
        return true;
      }
      return false;
    });
    
    if (incompleteExercises.length > 0) {
      console.warn(`${incompleteExercises.length} exercises might be incomplete:`, incompleteExercises);
    }
  }, [worksheet]);
  
  // Update editableWorksheet when the original worksheet changes
  useEffect(() => {
    setEditableWorksheet(worksheet);
  }, [worksheet]);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Zmiany zapisane",
      description: "Twój arkusz został zaktualizowany pomyślnie."
    });
  };
  
  const handleDownloadPDF = async () => {
    if (worksheetRef.current) {
      try {
        // Create current date format YYYY-MM-DD
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
        // Format the filename with title words separated by hyphens
        const formattedTitle = editableWorksheet.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 30); // Limit length
        
        const filename = `${formattedDate}-${viewModeText}-${formattedTitle}`;
        
        const result = await generatePDF('worksheet-content', filename, viewMode === 'teacher', editableWorksheet.title);
        if (result) {
          toast({
            title: "PDF pobrany",
            description: "Twój arkusz został pobrany pomyślnie."
          });
          if (onDownload) {
            onDownload();
          }
        } else {
          toast({
            title: "Generowanie PDF nie powiodło się",
            description: "Wystąpił błąd podczas generowania twojego PDF. Spróbuj ponownie.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: "Generowanie PDF nie powiodło się",
          description: "Wystąpił błąd podczas generowania twojego PDF. Spróbuj ponownie.",
          variant: "destructive"
        });
      }
    }
  };

  // Display error message if worksheet is invalid
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Błąd wyświetlania arkusza</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-worksheet-purple text-white px-4 py-2 rounded hover:bg-worksheet-purpleDark transition-colors"
                  onClick={onBack}
                >
                  <ArrowLeft className="inline-block h-4 w-4 mr-1" /> Wróć do formularza
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef} data-worksheet-id={editableWorksheet.id || ''}>
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

          {editableWorksheet.exercises && editableWorksheet.exercises.map((exercise, index) => (
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
          
          {/* Rating section above Teacher Notes */}
          <WorksheetRating onSubmitRating={onDownload} worksheetId={editableWorksheet.id} />
          
          {/* Teacher Notes Section (shown in both student and teacher view, but not in PDF) */}
          <div data-no-pdf="true">
            <TeacherNotes />
          </div>
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
      
      {/* Make the worksheet ID available globally for troubleshooting */}
      {editableWorksheet.id && (
        <script dangerouslySetInnerHTML={{ 
          __html: `window.currentWorksheetId = "${editableWorksheet.id}";` 
        }} />
      )}
    </div>
  );
}
