
import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useWorksheetActions } from "@/hooks/useWorksheetActions";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import ExerciseSection from "./worksheet/ExerciseSection";
import VocabularySheet from "./worksheet/VocabularySheet";
import TeacherNotes from "./worksheet/TeacherNotes";
import WorksheetRating from "@/components/WorksheetRating";

export interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: any[];
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
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload,
  worksheetId,
  onFeedbackSubmit
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  
  const {
    isEditing,
    handleEdit,
    handleSave,
    handleDownloadHTML,
    handleDownloadPDF
  } = useWorksheetActions({
    editableWorksheet,
    viewMode,
    onDownload
  });
  
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
          handleDownloadHTML={handleDownloadHTML}
          handleDownloadPDF={handleDownloadPDF}
        />

        <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef}>
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

          <WorksheetRating 
            worksheetId={worksheetId}
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
