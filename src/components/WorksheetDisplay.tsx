import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Database, Download, Edit, Eye, Star, Zap, FileText, Info, Lightbulb, Pencil, User, UserCog, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import ExerciseSection from "./worksheet/ExerciseSection";
import VocabularySheet from "./worksheet/VocabularySheet";
import RatingSection from "./worksheet/RatingSection";
import TeacherNotes from "./worksheet/TeacherNotes";

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
}

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
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
  
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getMatchedItems = (items: any[]) => {
    return viewMode === 'teacher' ? items : shuffleArray([...items]);
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

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "fa-book-open":
        return <Eye className="h-5 w-5" />;
      case "fa-link":
        return <Database className="h-5 w-5" />;
      case "fa-pencil-alt":
        return <Pencil className="h-5 w-5" />;
      case "fa-check-square":
        return <Star className="h-5 w-5" />;
      case "fa-comments":
        return <User className="h-5 w-5" />;
      case "fa-question-circle":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };
  
  const handleExerciseChange = (index: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };
  
  const handleQuestionChange = (exerciseIndex: number, questionIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.questions) {
      exercise.questions[questionIndex] = {
        ...exercise.questions[questionIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleSentenceChange = (exerciseIndex: number, sentenceIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.sentences) {
      exercise.sentences[sentenceIndex] = {
        ...exercise.sentences[sentenceIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleItemChange = (exerciseIndex: number, itemIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.items) {
      exercise.items[itemIndex] = {
        ...exercise.items[itemIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleDialogueChange = (exerciseIndex: number, dialogueIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.dialogue) {
      exercise.dialogue[dialogueIndex] = {
        ...exercise.dialogue[dialogueIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleExpressionChange = (exerciseIndex: number, expressionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.expressions) {
      exercise.expressions[expressionIndex] = value;
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleTeacherTipChange = (exerciseIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[exerciseIndex].teacher_tip = value;
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };
  
  const getExercisesByTime = (exercises: Exercise[], time: string) => {
    if (time === "30 min") return exercises.slice(0, 4);
    if (time === "45 min") return exercises.slice(0, 6);
    return exercises.slice(0, 8); // 60 min gets 8 exercises
  };

  const handleSubmitRating = () => {
    console.log("Submitted rating:", rating, "with feedback:", feedback);
    setRatingDialogOpen(false);
    toast({
      title: "Thank you for your feedback!",
      description: "Your rating and comments help us improve our service."
    });
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

          <RatingSection
            rating={rating}
            setRating={setRating}
            feedback={feedback}
            setFeedback={setFeedback}
            handleSubmitRating={handleSubmitRating}
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
