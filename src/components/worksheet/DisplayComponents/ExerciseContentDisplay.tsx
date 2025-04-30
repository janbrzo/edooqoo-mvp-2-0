
import React from 'react';
import ExerciseContent from '../ExerciseContent';
import ExerciseReading from '../ExerciseReading';
import ExerciseMatching from '../ExerciseMatching';
import ExerciseFillInBlanks from '../ExerciseFillInBlanks';
import ExerciseMultipleChoice from '../ExerciseMultipleChoice';
import TeacherTipSection from '../TeacherTipSection';
import ExerciseDialogue from '../ExerciseDialogue';

interface ExerciseContentDisplayProps {
  exercise: any;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
  handleExerciseChange: (index: number, field: string, value: string) => void;
  handleQuestionChange: (exerciseIndex: number, questionIndex: number, field: string, value: string) => void;
  handleSentenceChange: (exerciseIndex: number, sentenceIndex: number, field: string, value: string) => void;
  handleItemChange: (exerciseIndex: number, itemIndex: number, field: string, value: string) => void;
  handleDialogueChange: (exerciseIndex: number, dialogueIndex: number, field: string, value: string) => void;
  handleExpressionChange: (exerciseIndex: number, expressionIndex: number, value: string) => void;
  handleTeacherTipChange: (exerciseIndex: number, value: string) => void;
}

const ExerciseContentDisplay: React.FC<ExerciseContentDisplayProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet,
  handleExerciseChange,
  handleQuestionChange,
  handleSentenceChange,
  handleItemChange,
  handleDialogueChange,
  handleExpressionChange,
  handleTeacherTipChange
}) => {
  return (
    <div className="p-5">
      <ExerciseContent
        instructions={exercise.instructions}
        isEditing={isEditing}
        onInstructionsChange={val => handleExerciseChange(index, 'instructions', val)}
        content={exercise.content}
        onContentChange={val => handleExerciseChange(index, 'content', val)}
      />

      {exercise.type === 'reading' && exercise.questions && (
        <ExerciseReading
          questions={exercise.questions}
          isEditing={isEditing}
          viewMode={viewMode}
          onQuestionChange={(qIndex, field, value) => handleQuestionChange(index, qIndex, field, value)}
        />
      )}

      {exercise.type === 'matching' && exercise.items && (
        <ExerciseMatching
          items={exercise.items}
          isEditing={isEditing}
          viewMode={viewMode}
          getMatchedItems={() => viewMode === 'teacher' ? exercise.items : [...exercise.items].sort(() => Math.random() - 0.5)}
          onItemChange={(itemIndex, field, value) => handleItemChange(index, itemIndex, field, value)}
        />
      )}

      {exercise.type === 'fill-in-blanks' && exercise.sentences && (
        <ExerciseFillInBlanks
          word_bank={exercise.word_bank}
          sentences={exercise.sentences}
          isEditing={isEditing}
          viewMode={viewMode}
          onWordBankChange={(wIndex, value) => {
            const newWordBank = [...exercise.word_bank!];
            newWordBank[wIndex] = value;
            const updatedExercises = [...editableWorksheet.exercises];
            updatedExercises[index] = {
              ...updatedExercises[index],
              word_bank: newWordBank
            };
            setEditableWorksheet({
              ...editableWorksheet,
              exercises: updatedExercises
            });
          }}
          onSentenceChange={(sIndex, field, value) => handleSentenceChange(index, sIndex, field, value)}
        />
      )}

      {exercise.type === 'multiple-choice' && exercise.questions && (
        <ExerciseMultipleChoice
          questions={exercise.questions}
          isEditing={isEditing}
          viewMode={viewMode}
          onQuestionTextChange={(qIndex, value) => handleQuestionChange(index, qIndex, 'text', value)}
          onOptionTextChange={(qIndex, oIndex, value) => {
            const updatedExercises = [...editableWorksheet.exercises];
            const question = updatedExercises[index].questions[qIndex];
            const newOptions = [...question.options];
            newOptions[oIndex] = {
              ...newOptions[oIndex],
              text: value
            };
            updatedExercises[index].questions[qIndex] = {
              ...question,
              options: newOptions
            };
            setEditableWorksheet({
              ...editableWorksheet,
              exercises: updatedExercises
            });
          }}
        />
      )}

      {exercise.type === 'dialogue' && exercise.dialogue && (
        <ExerciseDialogue
          dialogue={exercise.dialogue}
          expressions={exercise.expressions}
          expression_instruction={exercise.expression_instruction}
          isEditing={isEditing}
          viewMode={viewMode}
          onDialogueChange={(dialogueIndex, field, value) => handleDialogueChange(index, dialogueIndex, field, value)}
          onExpressionChange={(expressionIndex, value) => handleExpressionChange(index, expressionIndex, value)}
          onExpressionInstructionChange={val => handleExerciseChange(index, 'expression_instruction', val)}
        />
      )}

      {exercise.type === 'discussion' && exercise.questions && (
        <div className="space-y-0.5">
          {exercise.questions.map((question: string, qIndex: number) => (
            <div key={qIndex} className="p-1 border-b">
              <p className="leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={question}
                    onChange={e => {
                      const updatedExercises = [...editableWorksheet.exercises];
                      const newQuestions = [...exercise.questions!];
                      newQuestions[qIndex] = e.target.value;
                      updatedExercises[index] = {
                        ...updatedExercises[index],
                        questions: newQuestions
                      };
                      setEditableWorksheet({
                        ...editableWorksheet,
                        exercises: updatedExercises
                      });
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
      )}

      {exercise.type === 'error-correction' && exercise.sentences && (
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
                          onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)}
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
                          value={sentence.correction}
                          onChange={e => handleSentenceChange(index, sIndex, 'correction', e.target.value)}
                          className="border p-1 editable-content w-full"
                        />
                      ) : (
                        <span>({sentence.correction})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exercise.type === 'word-formation' && exercise.sentences && (
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
                          onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)}
                          className="w-full border p-1 editable-content"
                        />
                      ) : (
                        <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                      )}
                    </p>
                  </div>
                  {viewMode === 'teacher' && (
                    <div className="text-green-600 italic ml-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={sentence.answer}
                          onChange={e => handleSentenceChange(index, sIndex, 'answer', e.target.value)}
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
        </div>
      )}

      {exercise.type === 'word-order' && exercise.sentences && (
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
                          onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)}
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
                          onChange={e => handleSentenceChange(index, sIndex, 'answer', e.target.value)}
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
        </div>
      )}

      {viewMode === 'teacher' && (
        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={isEditing}
          onChange={value => handleTeacherTipChange(index, value)}
        />
      )}
    </div>
  );
};

export default ExerciseContentDisplay;
