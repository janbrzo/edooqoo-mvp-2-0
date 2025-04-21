import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import TeacherTipSection from "./TeacherTipSection";

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
  const handleExerciseChange = (field: string, value: string) => {
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

  const handleQuestionChange = (questionIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[index];
    if (exercise.questions) {
      exercise.questions[questionIndex] = {
        ...exercise.questions[questionIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  const handleItemChange = (itemIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[index];
    if (exercise.items) {
      exercise.items[itemIndex] = {
        ...exercise.items[itemIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  const handleSentenceChange = (sentenceIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[index];
    if (exercise.sentences) {
      exercise.sentences[sentenceIndex] = {
        ...exercise.sentences[sentenceIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  const handleExpressionChange = (expressionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[index];
    if (exercise.expressions) {
      exercise.expressions[expressionIndex] = value;
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };

  const handleTeacherTipChange = (value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[index].teacher_tip = value;
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };

  const getMatchedItems = (items: any[]) => {
    return viewMode === 'teacher' ? items : [...items].sort(() => Math.random() - 0.5);
  };

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={isEditing}
        time={exercise.time}
        onTitleChange={val => handleExerciseChange('title', val)}
      />

      <div className="p-5">
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={isEditing}
          onInstructionsChange={val => handleExerciseChange('instructions', val)}
          content={exercise.content}
          onContentChange={val => handleExerciseChange('content', val)}
        />

        {exercise.type === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChange}
          />
        )}

        {exercise.type === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            getMatchedItems={getMatchedItems}
            onItemChange={handleItemChange}
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
            onSentenceChange={(sIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const ex = updatedExercises[index];
              ex.sentences[sIndex] = {
                ...ex.sentences[sIndex],
                [field]: value
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChange(qIndex, 'text', value)}
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
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-md dialogue-section">
              {exercise.dialogue.map((line, lIndex) => (
                <div key={lIndex} className="mb-1 dialogue-line">
                  <span className="font-semibold">
                    {isEditing ? (
                      <input
                        type="text"
                        value={line.speaker}
                        onChange={e => handleDialogueChange(lIndex, 'speaker', e.target.value)}
                        className="border p-1 editable-content w-32"
                      />
                    ) : (
                      <>{line.speaker}:</>
                    )}
                  </span>
                  <span className="leading-snug">
                    {isEditing ? (
                      <input
                        type="text"
                        value={line.text}
                        onChange={e => handleDialogueChange(lIndex, 'text', e.target.value)}
                        className="border p-1 editable-content ml-1 w-full"
                      />
                    ) : (
                      <> {line.text}</>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {exercise.expressions && (
              <div>
                <p className="font-medium mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={exercise.expression_instruction || ""}
                      onChange={e => {
                        const updatedExercises = [...editableWorksheet.exercises];
                        updatedExercises[index] = {
                          ...updatedExercises[index],
                          expression_instruction: e.target.value
                        };
                        setEditableWorksheet({
                          ...editableWorksheet,
                          exercises: updatedExercises
                        });
                      }}
                      className="w-full border p-1 editable-content"
                    />
                  ) : exercise.expression_instruction}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {exercise.expressions.map((expr, eIndex) => (
                    <div key={eIndex} className="p-2 border rounded-md bg-white">
                      <span className="text-worksheet-purple font-medium mr-2">{eIndex + 1}.</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={expr}
                          onChange={e => handleExpressionChange(eIndex, e.target.value)}
                          className="border p-1 editable-content w-full"
                        />
                      ) : expr}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <div className="space-y-0.5">
            {exercise.questions.map((question, qIndex) => (
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
              {exercise.sentences.map((sentence, sIndex) => (
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
                            value={sentence.correction}
                            onChange={e => handleSentenceChange(sIndex, 'correction', e.target.value)}
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
              {exercise.sentences.map((sentence, sIndex) => (
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
          </div>
        )}

        {exercise.type === 'word-order' && exercise.sentences && (
          <div>
            <div className="space-y-0.5">
              {exercise.sentences.map((sentence, sIndex) => (
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
          </div>
        )}

        {viewMode === 'teacher' && (
          <TeacherTipSection
            tip={exercise.teacher_tip}
            isEditing={isEditing}
            onChange={val => {
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[index].teacher_tip = val;
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExerciseSection;
