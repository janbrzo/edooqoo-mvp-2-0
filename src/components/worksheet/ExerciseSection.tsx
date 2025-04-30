
import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContentDisplay from "./DisplayComponents/ExerciseContentDisplay";

export interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: Array<{
    text: string;
    answer: string;
    options?: string[];
  }>;
  items?: Array<{
    term: string;
    definition: string;
  }>;
  sentences?: Array<{
    text: string;
    answer: string;
  }>;
  dialogue?: Array<{
    speaker: string;
    text: string;
  }>;
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
  originalItems?: Array<{
    term: string;
    definition: string;
  }>;
  shuffledTerms?: Array<{
    term: string;
    definition: string;
  }>;
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
  exercise: Exercise;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: Worksheet;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}) => {
  // Handle changes to exercise fields
  const handleExerciseChange = (exerciseIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      [field]: value
    };
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  // Handle changes to question fields
  const handleQuestionChange = (exerciseIndex: number, questionIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exerciseCopy = updatedExercises[exerciseIndex];
    if (exerciseCopy.questions) {
      exerciseCopy.questions[questionIndex] = {
        ...exerciseCopy.questions[questionIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  // Handle changes to matching item fields
  const handleItemChange = (exerciseIndex: number, itemIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exerciseCopy = updatedExercises[exerciseIndex];
    if (exerciseCopy.items) {
      exerciseCopy.items[itemIndex] = {
        ...exerciseCopy.items[itemIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  // Handle changes to fill-in-blanks sentence fields
  const handleSentenceChange = (exerciseIndex: number, sentenceIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exerciseCopy = updatedExercises[exerciseIndex];
    if (exerciseCopy.sentences) {
      exerciseCopy.sentences[sentenceIndex] = {
        ...exerciseCopy.sentences[sentenceIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  // Handle changes to expression fields
  const handleExpressionChange = (exerciseIndex: number, expressionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exerciseCopy = updatedExercises[exerciseIndex];
    if (exerciseCopy.expressions) {
      exerciseCopy.expressions[expressionIndex] = value;
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  // Handle changes to teacher tip fields
  const handleTeacherTipChange = (exerciseIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[exerciseIndex].teacher_tip = value;
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  // Handle changes to dialogue fields
  const handleDialogueChange = (exerciseIndex: number, dialogueIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exerciseCopy = updatedExercises[exerciseIndex];
    if (exerciseCopy.dialogue) {
      exerciseCopy.dialogue[dialogueIndex] = {
        ...exerciseCopy.dialogue[dialogueIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={isEditing}
        time={exercise.time}
        onTitleChange={val => handleExerciseChange(index, 'title', val)}
      />

      <ExerciseContentDisplay
        exercise={exercise}
        index={index}
        isEditing={isEditing}
        viewMode={viewMode}
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
        handleExerciseChange={handleExerciseChange}
        handleQuestionChange={handleQuestionChange}
        handleSentenceChange={handleSentenceChange}
        handleItemChange={handleItemChange}
        handleDialogueChange={handleDialogueChange}
        handleExpressionChange={handleExpressionChange}
        handleTeacherTipChange={handleTeacherTipChange}
      />
    </div>
  );
};

export default ExerciseSection;
