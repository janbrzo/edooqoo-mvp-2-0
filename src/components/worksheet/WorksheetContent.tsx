
import React from 'react';
import { Worksheet } from "@/types/worksheet";
import ExerciseSection from "./ExerciseSection";
import VocabularySheet from "./VocabularySheet";
import WorksheetRating from '@/components/WorksheetRating';
import TeacherNotes from "./TeacherNotes";

interface WorksheetContentProps {
  editableWorksheet: Worksheet;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>;
  isEditing: boolean;
  viewMode: 'student' | 'teacher';
}

const WorksheetContent: React.FC<WorksheetContentProps> = ({
  editableWorksheet,
  setEditableWorksheet,
  isEditing,
  viewMode
}) => {
  return (
    <>
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
      
      {/* Only show WorksheetRating and TeacherNotes in appropriate contexts */}
      <WorksheetRating />
      
      {viewMode === 'teacher' && (
        <div data-no-pdf="true">
          <TeacherNotes />
        </div>
      )}
    </>
  );
};

export default WorksheetContent;
