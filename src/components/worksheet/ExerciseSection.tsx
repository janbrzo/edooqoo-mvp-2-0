
import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import TeacherTipSection from "./TeacherTipSection";
import ExerciseDialogue from "./ExerciseDialogue";
import {
  handleExerciseChange,
  handleQuestionChange,
  handleItemChange,
  handleSentenceChange,
  handleExpressionChange,
  handleTeacherTipChange,
  handleDialogueChange,
  handleStatementChange,
  getMatchedItems,
  renderSentenceExercise,
  renderTrueFalseExercise,
  renderDiscussionExercise,
  handleOptionChange,
  handleWordBankChange
} from "./ExerciseSectionUtils";
import { Exercise, Worksheet } from "../WorksheetDisplay";

interface ExerciseSectionProps {
  exercise: Exercise;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: Worksheet;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>;
}

/**
 * Komponent odpowiedzialny za wyświetlenie sekcji ćwiczenia
 */
const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}) => {
  // Lokalne funkcje obsługujące zmiany w ćwiczeniu
  const handleExerciseChangeLocal = (field: string, value: string) => {
    handleExerciseChange(editableWorksheet, setEditableWorksheet, index, field, value);
  };

  const handleQuestionChangeLocal = (questionIndex: number, field: string, value: string) => {
    handleQuestionChange(editableWorksheet, setEditableWorksheet, index, questionIndex, field, value);
  };

  const handleItemChangeLocal = (itemIndex: number, field: string, value: string) => {
    handleItemChange(editableWorksheet, setEditableWorksheet, index, itemIndex, field, value);
  };

  const handleSentenceChangeLocal = (sentenceIndex: number, field: string, value: string) => {
    handleSentenceChange(editableWorksheet, setEditableWorksheet, index, sentenceIndex, field, value);
  };

  const handleExpressionChangeLocal = (expressionIndex: number, value: string) => {
    handleExpressionChange(editableWorksheet, setEditableWorksheet, index, expressionIndex, value);
  };

  const handleTeacherTipChangeLocal = (value: string) => {
    handleTeacherTipChange(editableWorksheet, setEditableWorksheet, index, value);
  };

  const handleDialogueChangeLocal = (dialogueIndex: number, field: string, value: string) => {
    handleDialogueChange(editableWorksheet, setEditableWorksheet, index, dialogueIndex, field, value);
  };
  
  const handleStatementChangeLocal = (statementIndex: number, field: string, value: string | boolean) => {
    handleStatementChange(editableWorksheet, setEditableWorksheet, index, statementIndex, field, value);
  };

  const handleOptionChangeLocal = (questionIndex: number, optionIndex: number, field: string, value: string | boolean) => {
    handleOptionChange(editableWorksheet, setEditableWorksheet, index, questionIndex, optionIndex, field, value);
  };

  const handleWordBankChangeLocal = (wordIndex: number, value: string) => {
    handleWordBankChange(editableWorksheet, setEditableWorksheet, index, wordIndex, value);
  };

  // Renderowanie odpowiedniego typu ćwiczenia
  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'reading':
        return exercise.questions ? (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
          />
        ) : null;
        
      case 'matching':
        return exercise.items ? (
          <ExerciseMatching
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            getMatchedItems={() => getMatchedItems(exercise.items, viewMode)}
            onItemChange={handleItemChangeLocal}
          />
        ) : null;
        
      case 'fill-in-blanks':
        return exercise.sentences && exercise.word_bank ? (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordBankChange={handleWordBankChangeLocal}
            onSentenceChange={handleSentenceChangeLocal}
          />
        ) : null;
        
      case 'multiple-choice':
        return exercise.questions ? (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChangeLocal(qIndex, 'text', value)}
            onOptionTextChange={(qIndex, oIndex, value) => 
              handleOptionChangeLocal(qIndex, oIndex, 'text', value)
            }
          />
        ) : null;
        
      case 'dialogue':
        return exercise.dialogue && exercise.expressions ? (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={isEditing}
            viewMode={viewMode}
            onDialogueChange={handleDialogueChangeLocal}
            onExpressionChange={handleExpressionChangeLocal}
            onExpressionInstructionChange={(val) => handleExerciseChangeLocal('expression_instruction', val)}
          />
        ) : null;
        
      case 'discussion':
        return exercise.questions ? 
          renderDiscussionExercise(exercise, isEditing, editableWorksheet, setEditableWorksheet, index) : null;
        
      case 'error-correction':
      case 'word-formation':
      case 'word-order':
        return exercise.sentences ? 
          renderSentenceExercise(exercise, isEditing, viewMode, handleSentenceChangeLocal) : null;
        
      case 'true-false':
        return exercise.statements ? 
          renderTrueFalseExercise(exercise, isEditing, viewMode, handleStatementChangeLocal) : null;
        
      default:
        return <p>Unsupported exercise type: {exercise.type}</p>;
    }
  };

  return (
    <div className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={isEditing}
        time={exercise.time}
        onTitleChange={(val) => handleExerciseChangeLocal('title', val)}
      />

      <div className="p-5">
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={isEditing}
          onInstructionsChange={(val) => handleExerciseChangeLocal('instructions', val)}
          content={exercise.content}
          onContentChange={(val) => handleExerciseChangeLocal('content', val)}
        />

        {renderExerciseContent()}

        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={isEditing}
          onChange={handleTeacherTipChangeLocal}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default ExerciseSection;
