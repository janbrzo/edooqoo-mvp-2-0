
// This file contains handlers for updating exercise data

import React from "react";

/**
 * Updates a specific field of an exercise in the worksheet
 */
export const handleExerciseChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  index: number, 
  field: string, 
  value: string
) => {
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

/**
 * Updates a specific field of a question within an exercise
 */
export const handleQuestionChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  questionIndex: number, 
  field: string, 
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.questions) {
    const updatedQuestions = [...exerciseCopy.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    
    exerciseCopy.questions = updatedQuestions;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates a specific field of an item within an exercise
 */
export const handleItemChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  itemIndex: number, 
  field: string, 
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.items) {
    const updatedItems = [...exerciseCopy.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      [field]: value
    };
    
    exerciseCopy.items = updatedItems;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates a specific field of a sentence within an exercise
 */
export const handleSentenceChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  sentenceIndex: number, 
  field: string, 
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.sentences) {
    const updatedSentences = [...exerciseCopy.sentences];
    updatedSentences[sentenceIndex] = {
      ...updatedSentences[sentenceIndex],
      [field]: value
    };
    
    exerciseCopy.sentences = updatedSentences;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates an expression within an exercise
 */
export const handleExpressionChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  expressionIndex: number, 
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.expressions) {
    const updatedExpressions = [...exerciseCopy.expressions];
    updatedExpressions[expressionIndex] = value;
    
    exerciseCopy.expressions = updatedExpressions;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates the teacher tip for an exercise
 */
export const handleTeacherTipChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  value: string
) => {
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

/**
 * Updates a specific field of a dialogue line within an exercise
 */
export const handleDialogueChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  dialogueIndex: number, 
  field: string, 
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.dialogue) {
    const updatedDialogue = [...exerciseCopy.dialogue];
    updatedDialogue[dialogueIndex] = {
      ...updatedDialogue[dialogueIndex],
      [field]: value
    };
    
    exerciseCopy.dialogue = updatedDialogue;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates a specific field of a statement within an exercise
 */
export const handleStatementChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  statementIndex: number, 
  field: string, 
  value: string | boolean
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.statements) {
    const updatedStatements = [...exerciseCopy.statements];
    updatedStatements[statementIndex] = {
      ...updatedStatements[statementIndex],
      [field]: value
    };
    
    exerciseCopy.statements = updatedStatements;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};

/**
 * Updates a word bank item within an exercise
 */
export const handleWordBankChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  wordIndex: number,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exerciseCopy = {...updatedExercises[exerciseIndex]};
  
  if (exerciseCopy.word_bank) {
    const updatedWordBank = [...exerciseCopy.word_bank];
    updatedWordBank[wordIndex] = value;
    
    exerciseCopy.word_bank = updatedWordBank;
    updatedExercises[exerciseIndex] = exerciseCopy;
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};
