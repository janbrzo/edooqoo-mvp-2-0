
// This file contains utility functions for the ExerciseSection component

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
  exerciseIndex: number,
  questionIndex: number, 
  field: string, 
  value: string
) => {
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

export const handleItemChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  itemIndex: number, 
  field: string, 
  value: string
) => {
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

export const handleSentenceChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  sentenceIndex: number, 
  field: string, 
  value: string
) => {
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

export const handleExpressionChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  expressionIndex: number, 
  value: string
) => {
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

export const handleTeacherTipChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  value: string
) => {
  const updatedExercises = [...editableWorksheet.exercises];
  updatedExercises[exerciseIndex].teacher_tip = value;
  setEditableWorksheet({
    ...editableWorksheet,
    exercises: updatedExercises
  });
};

export const handleDialogueChange = (
  editableWorksheet: any, 
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>, 
  exerciseIndex: number,
  dialogueIndex: number, 
  field: string, 
  value: string
) => {
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

export const getMatchedItems = (items: any[], viewMode: 'student' | 'teacher') => {
  return viewMode === 'teacher' ? items : [...items].sort(() => Math.random() - 0.5);
};

export const renderOtherExerciseTypes = (
  exercise: any, 
  isEditing: boolean, 
  viewMode: 'student' | 'teacher',
  handleSentenceChange: (sentenceIndex: number, field: string, value: string) => void
) => (
  <div>
    <div className="space-y-0.5">
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
