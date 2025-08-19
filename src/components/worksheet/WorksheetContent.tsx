
import { Card } from "@/components/ui/card";
import WorksheetViewTracking from "./WorksheetViewTracking";
import GrammarRules from "./GrammarRules";
import ExerciseSection from "./ExerciseSection";
import VocabularySheet from "./VocabularySheet";
import TeacherNotes from "./TeacherNotes";
import RatingSection from "./RatingSection";
import { useState } from "react";

interface WorksheetContentProps {
  editableWorksheet: any;
  isEditing: boolean;
  viewMode: 'student' | 'teacher';
  setEditableWorksheet: (worksheet: any) => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  isDownloadUnlocked: boolean;
  inputParams?: any;
  isSharedView?: boolean;
}

export default function WorksheetContent({
  editableWorksheet,
  isEditing,
  viewMode,
  setEditableWorksheet,
  worksheetId,
  onFeedbackSubmit,
  isDownloadUnlocked,
  inputParams,
  isSharedView = false
}: WorksheetContentProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmitRating = () => {
    if (onFeedbackSubmit) {
      onFeedbackSubmit(rating, feedback);
    }
    console.log('Rating submitted:', { rating, feedback });
  };

  if (!editableWorksheet) {
    return null;
  }

  return (
    <>
      {!isSharedView && worksheetId && (
        <WorksheetViewTracking worksheetId={worksheetId} userId={undefined}>
          <div>
            {/* Empty children to satisfy the component requirements */}
          </div>
        </WorksheetViewTracking>
      )}
      
      <Card className="worksheet-content bg-white print:shadow-none print:border-none" data-worksheet-id={worksheetId}>
        <div className="p-6 print:p-0">
          {/* Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold mb-2 print:text-2xl">
              {editableWorksheet.title}
            </h1>
            {editableWorksheet.subtitle && (
              <p className="text-xl text-muted-foreground mb-4 print:text-lg">
                {editableWorksheet.subtitle}
              </p>
            )}
            {editableWorksheet.introduction && (
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 print:bg-gray-50">
                <p className="text-blue-900 print:text-black">
                  {editableWorksheet.introduction}
                </p>
              </div>
            )}
          </div>

          {/* Grammar Rules */}
          {editableWorksheet.grammar_rules && (
            <GrammarRules 
              grammarRules={editableWorksheet.grammar_rules}
              isEditing={isEditing}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
              inputParams={inputParams}
            />
          )}

          {/* Exercises */}
          {editableWorksheet.exercises?.map((exercise: any, index: number) => (
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

          {/* Vocabulary Sheet */}
          {editableWorksheet.vocabulary_sheet?.length > 0 && (
            <VocabularySheet 
              vocabularySheet={editableWorksheet.vocabulary_sheet}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          )}

          {/* Teacher Notes - only show in teacher mode and not in shared view */}
          {viewMode === 'teacher' && !isSharedView && (
            <TeacherNotes />
          )}

          {/* Rating Section - only show if not in shared view */}
          {!isSharedView && (
            <RatingSection 
              rating={rating}
              setRating={setRating}
              feedback={feedback}
              setFeedback={setFeedback}
              handleSubmitRating={handleSubmitRating}
            />
          )}
        </div>
      </Card>
    </>
  );
}
