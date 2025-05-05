
import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseDialogue from "./ExerciseDialogue";
import ExerciseDiscussion from "./ExerciseDiscussion";
import ExerciseErrorCorrection from "./ExerciseErrorCorrection";
import ExerciseWordFormation from "./ExerciseWordFormation";
import ExerciseWordOrder from "./ExerciseWordOrder";
import ExerciseTrueFalse from "./ExerciseTrueFalse";
import TeacherTipSection from "./TeacherTipSection";

import {
  handleExerciseChange,
  handleQuestionChange,
  handleItemChange,
  handleSentenceChange,
  handleExpressionChange,
  handleTeacherTipChange,
  handleDialogueChange,
  handleStatementChange,
  getMatchedItems
} from "./ExerciseSectionUtils";

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
  statements?: any[];
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

interface ExerciseSectionProps {
  exercise: any;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}) => {
  // Exercise update handlers using the utility functions
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

  // Handler for discussion questions (which are strings, not objects)
  const handleDiscussionQuestionChange = (questionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const newQuestions = [...exercise.questions];
    newQuestions[questionIndex] = value;
    
    updatedExercises[index] = {
      ...updatedExercises[index],
      questions: newQuestions
    };
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  // Handler for multiple choice options
  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const question = {...updatedExercises[index].questions[questionIndex]};
    const newOptions = [...question.options];
    
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      text: value
    };
    
    updatedExercises[index].questions[questionIndex] = {
      ...question,
      options: newOptions
    };
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  // Handler for word bank changes
  const handleWordBankChangeLocal = (wordIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const newWordBank = [...exercise.word_bank];
    
    newWordBank[wordIndex] = value;
    
    updatedExercises[index] = {
      ...updatedExercises[index],
      word_bank: newWordBank
    };
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  return (
    <div className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={isEditing}
        time={exercise.time}
        onTitleChange={val => handleExerciseChangeLocal('title', val)}
      />

      <div className="p-5">
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={isEditing}
          onInstructionsChange={val => handleExerciseChangeLocal('instructions', val)}
          content={exercise.content}
          onContentChange={val => handleExerciseChangeLocal('content', val)}
        />

        {exercise.type === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
          />
        )}

        {exercise.type === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            getMatchedItems={() => getMatchedItems(exercise.items, viewMode)}
            onItemChange={handleItemChangeLocal}
          />
        )}

        {exercise.type === 'fill-in-blanks' && exercise.sentences && (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordBankChange={handleWordBankChangeLocal}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChangeLocal(qIndex, 'text', value)}
            onOptionTextChange={handleOptionChange}
          />
        )}

        {exercise.type === 'dialogue' && exercise.dialogue && (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={isEditing}
            viewMode={viewMode}
            onDialogueChange={handleDialogueChangeLocal}
            onExpressionChange={handleExpressionChangeLocal}
            onExpressionInstructionChange={val => handleExerciseChangeLocal('expression_instruction', val)}
          />
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <ExerciseDiscussion
            questions={exercise.questions}
            isEditing={isEditing}
            onQuestionChange={handleDiscussionQuestionChange}
          />
        )}

        {exercise.type === 'error-correction' && exercise.sentences && (
          <ExerciseErrorCorrection
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'word-formation' && exercise.sentences && (
          <ExerciseWordFormation
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'word-order' && exercise.sentences && (
          <ExerciseWordOrder
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}
        
        {exercise.type === 'true-false' && exercise.statements && (
          <ExerciseTrueFalse
            statements={exercise.statements}
            isEditing={isEditing}
            viewMode={viewMode}
            onStatementChange={handleStatementChangeLocal}
          />
        )}

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
