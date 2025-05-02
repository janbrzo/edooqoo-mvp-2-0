
import React from "react";

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

export const handleQuestionChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  questionIndex: number,
  field: string,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedQuestions = [...updatedExercises[index].questions];
  updatedQuestions[questionIndex] = {
    ...updatedQuestions[questionIndex],
    [field]: value
  };
  updatedExercises[index] = {
    ...updatedExercises[index],
    questions: updatedQuestions
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleItemChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  itemIndex: number,
  field: string,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedItems = [...updatedExercises[index].items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    [field]: value
  };
  updatedExercises[index] = {
    ...updatedExercises[index],
    items: updatedItems
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleSentenceChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  sentenceIndex: number,
  field: string,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedSentences = [...updatedExercises[index].sentences];
  updatedSentences[sentenceIndex] = {
    ...updatedSentences[sentenceIndex],
    [field]: value
  };
  updatedExercises[index] = {
    ...updatedExercises[index],
    sentences: updatedSentences
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleExpressionChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  expressionIndex: number,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedExpressions = [...updatedExercises[index].expressions];
  updatedExpressions[expressionIndex] = value;
  updatedExercises[index] = {
    ...updatedExercises[index],
    expressions: updatedExpressions
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleTeacherTipChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  updatedExercises[index] = {
    ...updatedExercises[index],
    teacher_tip: value
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleDialogueChange = (
  editableWorksheet: any,
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
  index: number,
  dialogueIndex: number,
  field: string,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  const updatedDialogue = [...updatedExercises[index].dialogue];
  updatedDialogue[dialogueIndex] = {
    ...updatedDialogue[dialogueIndex],
    [field]: value
  };
  updatedExercises[index] = {
    ...updatedExercises[index],
    dialogue: updatedDialogue
  };
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const getMatchedItems = (items: any[], viewMode: string) => {
  if (viewMode === 'teacher') {
    return items.map(item => ({
      term: item.term,
      definition: item.definition
    }));
  }
  return [];
};

export const renderOtherExerciseTypes = (
  exercise: any, 
  isEditing: boolean, 
  viewMode: string, 
  handleSentenceChange: (sentenceIndex: number, field: string, value: string) => void
) => {
  if (exercise.type === 'error-correction' && exercise.sentences) {
    return (
      <div className="space-y-0.5">
        <h3 className="font-medium text-gray-700 mb-2">Find and correct the errors:</h3>
        {exercise.sentences.map((sentence: any, sIndex: number) => (
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
                    <>{sIndex + 1}. {sentence.text}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer}
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
  } 
  
  if (exercise.type === 'word-formation' && exercise.sentences) {
    return (
      <div className="space-y-0.5">
        <h3 className="font-medium text-gray-700 mb-2">Form the words correctly to complete the sentences:</h3>
        {exercise.sentences.map((sentence: any, sIndex: number) => (
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
                    <>{sIndex + 1}. {sentence.text}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer}
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
  }
  
  if (exercise.type === 'word-order' && exercise.sentences) {
    return (
      <div className="space-y-0.5">
        <h3 className="font-medium text-gray-700 mb-2">Put the words in the correct order:</h3>
        {exercise.sentences.map((sentence: any, sIndex: number) => (
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
                    <>{sIndex + 1}. {sentence.text}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer}
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
  }
  
  if (exercise.type === 'case-study') {
    return (
      <div className="space-y-2">
        <div className="p-4 bg-gray-50 rounded-md">
          {isEditing ? (
            <textarea
              value={exercise.content}
              onChange={e => {
                // Obsługa zmiany treści studium przypadku
                const updatedExercises = [...exercise.editableWorksheet?.exercises];
                updatedExercises[exercise.index] = {
                  ...updatedExercises[exercise.index],
                  content: e.target.value
                };
                exercise.setEditableWorksheet({
                  ...exercise.editableWorksheet,
                  exercises: updatedExercises
                });
              }}
              className="w-full border p-2 editable-content min-h-24"
            />
          ) : (
            <p className="leading-relaxed">{exercise.content}</p>
          )}
        </div>
        {exercise.questions && (
          <div className="space-y-1">
            <h3 className="font-medium text-gray-700 mb-2">Analysis Questions:</h3>
            {exercise.questions.map((question: any, qIndex: number) => (
              <div key={qIndex} className="border-b pb-1">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.text}
                      onChange={e => handleSentenceChange(qIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{qIndex + 1}. {question.text}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (exercise.type === 'role-play') {
    return (
      <div className="space-y-2">
        <div className="p-4 bg-gray-50 rounded-md">
          {isEditing ? (
            <textarea
              value={exercise.content}
              onChange={e => {
                // Obsługa zmiany treści roli
                const updatedExercises = [...exercise.editableWorksheet?.exercises];
                updatedExercises[exercise.index] = {
                  ...updatedExercises[exercise.index],
                  content: e.target.value
                };
                exercise.setEditableWorksheet({
                  ...exercise.editableWorksheet,
                  exercises: updatedExercises
                });
              }}
              className="w-full border p-2 editable-content min-h-24"
            />
          ) : (
            <p className="leading-relaxed">{exercise.content}</p>
          )}
        </div>
      </div>
    );
  }
  
  if (exercise.type === 'writing-prompt') {
    return (
      <div className="space-y-2">
        {exercise.prompts && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-2">Writing Prompts:</h3>
            {exercise.prompts.map((prompt: string, pIndex: number) => (
              <div key={pIndex} className="border p-2 rounded-md bg-white">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={prompt}
                      onChange={e => {
                        const updatedExercises = [...exercise.editableWorksheet?.exercises];
                        const newPrompts = [...exercise.prompts];
                        newPrompts[pIndex] = e.target.value;
                        updatedExercises[exercise.index] = {
                          ...updatedExercises[exercise.index],
                          prompts: newPrompts
                        };
                        exercise.setEditableWorksheet({
                          ...exercise.editableWorksheet,
                          exercises: updatedExercises
                        });
                      }}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{pIndex + 1}. {prompt}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return null;
};
