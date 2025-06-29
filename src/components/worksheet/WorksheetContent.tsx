
import React from "react";
import ExerciseSection from "./ExerciseSection";
import VocabularySheet from "./VocabularySheet";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherNotes from "./TeacherNotes";
import GrammarRules from "./GrammarRules";
import DemoWatermark from "./DemoWatermark";
import WarmupSection from "./WarmupSection";
import { useWorksheetTimes } from "@/hooks/useWorksheetTimes";

interface WorksheetContentProps {
  editableWorksheet: any;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  setEditableWorksheet: (worksheet: any) => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  isDownloadUnlocked: boolean;
  inputParams?: any;
}

export default function WorksheetContent({
  editableWorksheet,
  isEditing,
  viewMode,
  setEditableWorksheet,
  worksheetId,
  onFeedbackSubmit,
  isDownloadUnlocked,
  inputParams
}: WorksheetContentProps) {
  // Check if worksheet has grammar rules
  const hasGrammar = Boolean(editableWorksheet?.grammar_rules);
  const worksheetTimes = useWorksheetTimes(inputParams?.lessonTime, hasGrammar);
  
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
  console.log('WorksheetContent: Calculated times:', worksheetTimes);
  console.log('WorksheetContent: Has grammar:', hasGrammar);

  return (
    <div className="worksheet-content mb-8" id="worksheet-content">
      <div className="page-number"></div>
      
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        {!isDownloadUnlocked && <DemoWatermark />}
        
        {/* Simple edooqoo link - positioned in top right */}
        <div className="absolute top-4 right-4 hidden sm:block">
          <a 
            href="https://edooqoo.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-worksheet-purple transition-colors duration-200"
          >
            Create your own at edooqoo.com
          </a>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
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
        
        <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
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

        {/* Total lesson time display */}
        {viewMode === 'teacher' && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-4">
            <strong>Total lesson time: {worksheetTimes.totalLesson} minutes</strong>
            <div className="mt-1 text-xs">
              Warmup: {worksheetTimes.warmup}min{hasGrammar ? ` • Grammar: ${worksheetTimes.grammar}min` : ''} • Exercises: {worksheetTimes.exercisesTotal}min
            </div>
          </div>
        )}
      </div>

      {/* Warmup Section - added before grammar rules */}
      {inputParams && (
        <WarmupSection
          inputParams={inputParams}
          isEditing={isEditing}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
          isDownloadUnlocked={isDownloadUnlocked}
        />
      )}

      {editableWorksheet.grammar_rules && (
        <div className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <GrammarRules
            grammarRules={editableWorksheet.grammar_rules}
            isEditing={isEditing}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            inputParams={inputParams}
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
