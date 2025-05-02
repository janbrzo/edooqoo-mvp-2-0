
import React from "react";

// Helper functions for exercise section
export const handleExerciseChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, index: number, field: string, value: string) => {
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

export const handleQuestionChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, questionIndex: number, field: string, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedQuestions = [...updatedExercises[exerciseIndex].questions];
  updatedQuestions[questionIndex] = {
    ...updatedQuestions[questionIndex],
    [field]: value
  };
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    questions: updatedQuestions
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleItemChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, itemIndex: number, field: string, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedItems = [...updatedExercises[exerciseIndex].items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    [field]: value
  };
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    items: updatedItems
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleSentenceChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, sentenceIndex: number, field: string, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedSentences = [...updatedExercises[exerciseIndex].sentences];
  updatedSentences[sentenceIndex] = {
    ...updatedSentences[sentenceIndex],
    [field]: value
  };
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    sentences: updatedSentences
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleExpressionChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, expressionIndex: number, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedExpressions = [...updatedExercises[exerciseIndex].expressions];
  updatedExpressions[expressionIndex] = value;
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    expressions: updatedExpressions
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleTeacherTipChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    teacher_tip: value
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleDialogueChange = (editableWorksheet: any, setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, exerciseIndex: number, dialogueIndex: number, field: string, value: string) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedDialogue = [...updatedExercises[exerciseIndex].dialogue];
  updatedDialogue[dialogueIndex] = {
    ...updatedDialogue[dialogueIndex],
    [field]: value
  };
  updatedExercises[exerciseIndex] = {
    ...updatedExercises[exerciseIndex],
    dialogue: updatedDialogue
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const getMatchedItems = (items: any[], viewMode: string) => {
  if (viewMode === 'student') {
    return [...items].sort(() => Math.random() - 0.5);
  }
  return items;
};

export const renderOtherExerciseTypes = (exercise: any, isEditing: boolean, viewMode: string, handleSentenceChange: (sentenceIndex: number, field: string, value: string) => void) => {
  return (
    <div className="space-y-1">
      {exercise.sentences.map((sentence: any, sIndex: number) => (
        <div key={sIndex} className="mb-1.5 border-b pb-1.5">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.text}
                    onChange={e => handleSentenceChange(sIndex, 'text', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{sIndex + 1}. {sentence.text}</>
                )}
              </p>
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.answer || ''}
                    onChange={e => handleSentenceChange(sIndex, 'answer', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence.answer})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
