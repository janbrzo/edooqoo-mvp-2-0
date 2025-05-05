
// Plik zawierający oddzielne funkcje narzędziowe dla komponentów ćwiczeń
import { Worksheet, Exercise } from "../WorksheetDisplay";
import React from "react";

// Funkcje obsługujące aktualizacje worksheetu

/**
 * Aktualizuje pole ćwiczenia w worksheecie
 */
export const handleExerciseChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje pytanie w ćwiczeniu
 */
export const handleQuestionChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje element w ćwiczeniu typu matching
 */
export const handleItemChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje zdanie w ćwiczeniu
 */
export const handleSentenceChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje wyrażenie w ćwiczeniu typu dialogue
 */
export const handleExpressionChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje wskazówkę nauczyciela
 */
export const handleTeacherTipChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje linię dialogu
 */
export const handleDialogueChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Aktualizuje statement w ćwiczeniu typu true-false
 */
export const handleStatementChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>, 
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
 * Funkcja pomocnicza do losowania kolejności elementów w ćwiczeniu typu matching
 */
export const getMatchedItems = (items: any[], viewMode: 'student' | 'teacher') => {
  return viewMode === 'teacher' ? items : [...items].sort(() => Math.random() - 0.5);
};

// Komponenty renderujące różne typy zadań

/**
 * Renderuje zadania typu error-correction, word-formation i word-order
 */
export const renderSentenceExercise = (
  exercise: Exercise, 
  isEditing: boolean, 
  viewMode: 'student' | 'teacher',
  handleSentenceChange: (sentenceIndex: number, field: string, value: string) => void
) => (
  <div>
    <div className="space-y-0.5">
      {exercise.sentences && exercise.sentences.map((sentence: any, sIndex: number) => (
        <div key={sIndex} className="border-b pb-1">
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
                  <>{sIndex + 1}. {
                    exercise.type === 'word-formation' 
                      ? sentence.text.replace(/_+/g, "_______________") 
                      : sentence.text
                  }</>
                )}
              </p>
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.answer || sentence.correction}
                    onChange={e => handleSentenceChange(
                      sIndex, 
                      exercise.type === 'error-correction' ? 'correction' : 'answer', 
                      e.target.value
                    )}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence.answer || sentence.correction})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Renderuje zadanie typu true-false
 */
export const renderTrueFalseExercise = (
  exercise: Exercise, 
  isEditing: boolean, 
  viewMode: 'student' | 'teacher',
  handleStatementChange: (statementIndex: number, field: string, value: string | boolean) => void
) => (
  <div>
    <div className="space-y-2">
      {exercise.statements && exercise.statements.map((statement: any, sIndex: number) => (
        <div key={sIndex} className="border-b pb-2">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={statement.text}
                    onChange={e => handleStatementChange(sIndex, 'text', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{sIndex + 1}. {statement.text}</>
                )}
              </p>
            </div>
            <div className="ml-4 flex space-x-4">
              {viewMode === 'student' ? (
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                    <span className="ml-2">True</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                    <span className="ml-2">False</span>
                  </label>
                </div>
              ) : (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <select
                      value={statement.isTrue ? "true" : "false"}
                      onChange={e => handleStatementChange(sIndex, 'isTrue', e.target.value === "true")}
                      className="border p-1 editable-content"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <span>({statement.isTrue ? "True" : "False"})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Renderuje zadanie typu discussion
 */
export const renderDiscussionExercise = (
  exercise: Exercise,
  isEditing: boolean,
  editableWorksheet: Worksheet,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>,
  index: number
) => (
  <div className="space-y-0.5">
    <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
    {exercise.questions && exercise.questions.map((question: string, qIndex: number) => (
      <div key={qIndex} className="p-1 border-b">
        <p className="leading-snug">
          {isEditing ? (
            <input
              type="text"
              value={question}
              onChange={e => {
                const updatedExercises = [...editableWorksheet.exercises];
                if (updatedExercises[index].questions) {
                  const newQuestions = [...updatedExercises[index].questions!];
                  newQuestions[qIndex] = e.target.value;
                  updatedExercises[index] = {
                    ...updatedExercises[index],
                    questions: newQuestions
                  };
                  setEditableWorksheet({
                    ...editableWorksheet,
                    exercises: updatedExercises
                  });
                }
              }}
              className="w-full border p-1 editable-content"
            />
          ) : (
            <>{qIndex + 1}. {question}</>
          )}
        </p>
      </div>
    ))}
  </div>
);

/**
 * Funkcja do sprawdzania czy zdanie zawiera szablon
 */
export const isTemplateContent = (text: string): boolean => {
  const templatePattern = /This is (sentence|question|statement|example) \d+|This is [a-z]+ \d+/i;
  return templatePattern.test(text);
};

/**
 * Funkcja pomocnicza do aktualizacji opcji w zadaniu multiple choice
 */
export const handleOptionChange = (
  editableWorksheet: Worksheet, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>,
  exerciseIndex: number,
  questionIndex: number,
  optionIndex: number,
  field: string,
  value: string | boolean
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exercise = updatedExercises[exerciseIndex];
  
  if (exercise.questions) {
    const question = exercise.questions[questionIndex];
    
    if (question.options) {
      const updatedOptions = [...question.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        [field]: value
      };
      
      const updatedQuestions = [...exercise.questions];
      updatedQuestions[questionIndex] = {
        ...question,
        options: updatedOptions
      };
      
      updatedExercises[exerciseIndex] = {
        ...exercise,
        questions: updatedQuestions
      };
      
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  }
};

/**
 * Funkcja pomocnicza do aktualizacji banku słów
 */
export const handleWordBankChange = (
  editableWorksheet: Worksheet,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>,
  exerciseIndex: number,
  wordIndex: number,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const exercise = updatedExercises[exerciseIndex];
  
  if (exercise.word_bank) {
    const updatedWordBank = [...exercise.word_bank];
    updatedWordBank[wordIndex] = value;
    
    updatedExercises[exerciseIndex] = {
      ...exercise,
      word_bank: updatedWordBank
    };
    
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  }
};
