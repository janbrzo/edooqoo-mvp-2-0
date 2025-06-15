
import React from "react";
import ExerciseSection from "./ExerciseSection";
import VocabularySheet from "./VocabularySheet";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherNotes from "./TeacherNotes";
import GrammarRules from "./GrammarRules";
import DemoWatermark from "./DemoWatermark";

interface WorksheetContentProps {
  editableWorksheet: any;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  setEditableWorksheet: (worksheet: any) => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  isDownloadUnlocked: boolean;
}

export default function WorksheetContent({
  editableWorksheet,
  isEditing,
  viewMode,
  setEditableWorksheet,
  worksheetId,
  onFeedbackSubmit,
  isDownloadUnlocked
}: WorksheetContentProps) {
  // CRITICAL FIX: Add safety check to prevent rendering with null worksheet
  if (!editableWorksheet) {
    console.log('WorksheetContent: editableWorksheet is null, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  console.log('WorksheetContent: Rendering with editableWorksheet:', editableWorksheet);

  return (
    <div className="worksheet-content mb-8" id="worksheet-content">
      <div className="page-number"></div>
      
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        {!isDownloadUnlocked && <DemoWatermark />}
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight">
          {isEditing ? (
            <input 
              type="text" 
              value={editableWorksheet.title || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                title: e.target.value
              })} 
              className="w-full border p-2 editable-content" 
            />
          ) : (editableWorksheet.title || 'Untitled Worksheet')}
        </h1>
        
        <h2 className="text-xl text-worksheet-purple mb-3 leading-tight">
          {isEditing ? (
            <input 
              type="text" 
              value={editableWorksheet.subtitle || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                subtitle: e.target.value
              })} 
              className="w-full border p-2 editable-content" 
            />
          ) : (editableWorksheet.subtitle || '')}
        </h2>

        {!isDownloadUnlocked && (
          <div className="my-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-md text-red-700" data-demo-notice="true">
            <p className="font-bold">This is a DEMO version.</p>
            <p>Payment is required to download the full, watermark-free worksheet.</p>
          </div>
        )}
        
        <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
          {isEditing ? (
            <textarea 
              value={editableWorksheet.introduction || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                introduction: e.target.value
              })} 
              className="w-full h-20 border p-2 editable-content" 
            />
          ) : (
            <p className="leading-snug">{editableWorksheet.introduction || ''}</p>
          )}
        </div>
      </div>

      {editableWorksheet.grammar_rules && (
        <div className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <GrammarRules
            grammarRules={editableWorksheet.grammar_rules}
            isEditing={isEditing}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
          />
        </div>
      )}

      {editableWorksheet.exercises && editableWorksheet.exercises.map((exercise: any, index: number) => (
        <div key={index} className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <ExerciseSection
            exercise={exercise}
            index={index}
            isEditing={isEditing}
            viewMode={viewMode}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
          />
        </div>
      ))}

      {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
        <div className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <VocabularySheet
            vocabularySheet={editableWorksheet.vocabulary_sheet}
            isEditing={isEditing}
            viewMode={viewMode}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
          />
        </div>
      )}

      <WorksheetRating 
        worksheetId={worksheetId}
        onSubmitRating={onFeedbackSubmit} 
      />
      
      <TeacherNotes />
    </div>
  );
}
