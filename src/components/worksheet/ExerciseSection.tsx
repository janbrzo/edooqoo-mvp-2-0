
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
  getMatchedItems,
  renderOtherExerciseTypes
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
  word_bank?: string[];
  expressions?: string[];
  prompts?: string[];
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
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChangeLocal(qIndex, 'text', value)}
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
            onDialogueChange={handleDialogueChangeLocal}
            onExpressionChange={handleExpressionChangeLocal}
            onExpressionInstructionChange={val => handleExerciseChangeLocal('expression_instruction', val)}
          />
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <div className="space-y-0.5">
            <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
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

        {/* Obsługa zadania typu "writing-prompt" */}
        {exercise.type === 'writing-prompt' && exercise.prompts && (
          <div className="space-y-0.5">
            <h3 className="font-medium text-gray-700 mb-2">Writing Prompts:</h3>
            {exercise.prompts.map((prompt: string, pIndex: number) => (
              <div key={pIndex} className="p-2 border rounded-md mb-2">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={prompt}
                      onChange={e => {
                        const updatedExercises = [...editableWorksheet.exercises];
                        const newPrompts = [...exercise.prompts!];
                        newPrompts[pIndex] = e.target.value;
                        updatedExercises[index] = {
                          ...updatedExercises[index],
                          prompts: newPrompts
                        };
                        setEditableWorksheet({
                          ...editableWorksheet,
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

        {/* Obsługa zadania typu "case-study" */}
        {exercise.type === 'case-study' && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-md mb-3">
              {isEditing ? (
                <textarea
                  value={exercise.content || ""}
                  onChange={e => handleExerciseChangeLocal('content', e.target.value)}
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
                          onChange={e => handleQuestionChangeLocal(qIndex, 'text', e.target.value)}
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
        )}

        {/* Obsługa zadania typu "role-play" */}
        {exercise.type === 'role-play' && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-md">
              {isEditing ? (
                <textarea
                  value={exercise.content || ""}
                  onChange={e => handleExerciseChangeLocal('content', e.target.value)}
                  className="w-full border p-2 editable-content min-h-24"
                />
              ) : (
                <p className="leading-relaxed">{exercise.content}</p>
              )}
            </div>
            {exercise.scenarios && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-gray-700 mb-2">Role-Play Scenarios:</h3>
                {exercise.scenarios.map((scenario: any, sIndex: number) => (
                  <div key={sIndex} className="border p-3 rounded-md mb-2">
                    <p className="font-medium mb-1">Scenario {sIndex + 1}:</p>
                    <p className="leading-snug">
                      {isEditing ? (
                        <textarea
                          value={scenario.description}
                          onChange={e => {
                            const updatedExercises = [...editableWorksheet.exercises];
                            const newScenarios = [...exercise.scenarios];
                            newScenarios[sIndex] = {
                              ...newScenarios[sIndex],
                              description: e.target.value
                            };
                            updatedExercises[index] = {
                              ...updatedExercises[index],
                              scenarios: newScenarios
                            };
                            setEditableWorksheet({
                              ...editableWorksheet,
                              exercises: updatedExercises
                            });
                          }}
                          className="w-full border p-1 editable-content"
                        />
                      ) : (
                        scenario.description
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(exercise.type === 'error-correction' || exercise.type === 'word-formation' || exercise.type === 'word-order') && 
          exercise.sentences && renderOtherExerciseTypes(exercise, isEditing, viewMode, handleSentenceChangeLocal)}

        {/* Always show teacher tip regardless of viewMode */}
        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={isEditing}
          onChange={handleTeacherTipChangeLocal}
        />
      </div>
    </div>
  );
};

export default ExerciseSection;
