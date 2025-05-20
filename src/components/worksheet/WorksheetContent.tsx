
import React from 'react';
import VocabularySheet from "./VocabularySheet";
import ExerciseSection from "./ExerciseSection";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherNotes from "./TeacherNotes";
import { Worksheet } from "@/types/worksheet";

interface WorksheetContentProps {
  editableWorksheet: Worksheet;
  isEditing: boolean;
  viewMode: 'student' | 'teacher';
  setEditableWorksheet: (worksheet: Worksheet) => void;
  worksheetId: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
}

const WorksheetContent: React.FC<WorksheetContentProps> = ({
  editableWorksheet,
  isEditing,
  viewMode,
  setEditableWorksheet,
  worksheetId,
  onFeedbackSubmit
}) => {
  return (
    <div className="worksheet-content mb-8" id="worksheet-content">
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

      {/* First display rating section */}
      <WorksheetRating 
        worksheetId={worksheetId}
        onSubmitRating={onFeedbackSubmit} 
      />
      
      {/* Then display Teacher Notes Section (both for student and teacher view) */}
      <TeacherNotes />
    </div>
  );
};

export default WorksheetContent;
