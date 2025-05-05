
import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
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
  statements?: any[];
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
 * Komponent do wyświetlania kompletnego arkusza ćwiczeń z możliwością edycji
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
  
  // Walidacja struktury worksheetu i ustawienie numeracji stron dla PDF
  useEffect(() => {
    validateWorksheetStructure();
    setupPageNumbersForPDF();
    
    return () => {
      const style = document.getElementById('pdf-page-numbers');
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  /**
   * Dodaje style CSS do numeracji stron w PDF
   */
  const setupPageNumbersForPDF = () => {
    const style = document.createElement('style');
    style.id = 'pdf-page-numbers';
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
  };
  
  /**
   * Sprawdza czy worksheet zawiera wszystkie wymagane komponenty i dane
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
    
    // Sprawdzanie ćwiczeń
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return;
    }
    
    // Sprawdzanie ćwiczeń reading i liczby słów
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
    
    // Sprawdzanie zawartości szablonowej
    checkForTemplateContent();
  };

  /**
   * Sprawdza czy worksheet zawiera szablonowe treści
   */
  const checkForTemplateContent = () => {
    const templatePattern = /This is (sentence|question) \d+ with|This is [a-z]+ \d+/i;
    let hasTemplates = false;
    let templateCount = 0;
    let exercisesWithTemplates = [];

    worksheet.exercises.forEach((exercise, index) => {
      let exerciseTemplates = 0;

      // Sprawdzanie zdań
      if (exercise.sentences && Array.isArray(exercise.sentences)) {
        exercise.sentences.forEach((s: any) => {
          if (templatePattern.test(s.text || '')) {
            exerciseTemplates++;
            templateCount++;
          }
        });
      }

      // Sprawdzanie pytań
      if (exercise.questions && Array.isArray(exercise.questions)) {
        if (typeof exercise.questions[0] === 'string') {
          exercise.questions.forEach((q: string) => {
            if (templatePattern.test(q)) {
              exerciseTemplates++;
              templateCount++;
            }
          });
        } else {
          exercise.questions.forEach((q: any) => {
            if (q.text && templatePattern.test(q.text)) {
              exerciseTemplates++;
              templateCount++;
            }
          });
        }
      }

      // Sprawdzanie dialogów
      if (exercise.dialogue && Array.isArray(exercise.dialogue)) {
        exercise.dialogue.forEach((d: any) => {
          if (templatePattern.test(d.text || '')) {
            exerciseTemplates++;
            templateCount++;
          }
        });
      }

      if (exerciseTemplates > 2) {
        hasTemplates = true;
        exercisesWithTemplates.push(`Exercise ${index + 1}: ${exercise.type}`);
      }
    });
    
    if (hasTemplates) {
      toast({
        title: "Template content detected",
        description: `Some exercises contain generic template sentences: ${exercisesWithTemplates.join(', ')}`,
        variant: "default"
      });
    }
  };
  
  /**
   * Przewija okno przeglądarki do góry
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Ustawia nasłuchiwanie na zdarzenie scrollowania, aby pokazać/ukryć przycisk przewijania do góry
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  /**
   * Włącza tryb edycji
   */  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  /**
   * Zapisuje zmiany i wyłącza tryb edycji
   */
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };
  
  /**
   * Generuje i pobiera worksheet jako PDF
   */
  const handleDownloadPDF = async () => {
    if (worksheetRef.current) {
      try {
        // Utwórz format daty YYYY-MM-DD
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
        {/* Nagłówek worksheetu */}
        <WorksheetHeader
          onBack={onBack}
          generationTime={generationTime}
          sourceCount={sourceCount}
          inputParams={inputParams}
        />
        
        {/* Karta parametrów wejściowych */}
        <InputParamsCard inputParams={inputParams} />
        
        {/* Pasek narzędzi worksheetu */}
        <WorksheetToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleDownloadPDF={handleDownloadPDF}
        />

        {/* Zawartość worksheetu */}
        <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef}>
          {/* Element numeracji stron dla PDF */}
          <div className="page-number"></div>
          
          {/* Nagłówek z tytułem i wprowadzeniem */}
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

          {/* Ćwiczenia */}
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

          {/* Słownictwo */}
          {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
            <VocabularySheet
              vocabularySheet={editableWorksheet.vocabulary_sheet}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          )}

          {/* Oceny i notatki nauczyciela */}
          <WorksheetRating 
            worksheetId={worksheetId || undefined}
            onSubmitRating={onFeedbackSubmit || onDownload} 
          />
          
          <TeacherNotes />
        </div>
      </div>
      
      {/* Przycisk przewijania do góry */}
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
