import React from "react";
import { Clock, Database, Edit, Eye, Star, Zap, FileText, Info, Lightbulb, Pencil, User, UserCog, ArrowUp } from "lucide-react";

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
  setEditableWorksheet,
}) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "fa-book-open":
        return <Eye className="h-5 w-5" />;
      case "fa-link":
        return <Database className="h-5 w-5" />;
      case "fa-pencil-alt":
        return <Pencil className="h-5 w-5" />;
      case "fa-check-square":
        return <Star className="h-5 w-5" />;
      case "fa-comments":
        return <User className="h-5 w-5" />;
      case "fa-question-circle":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

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

  const handleDialogueChange = (dialogueIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[index];
    if (exercise.dialogue) {
      exercise.dialogue[dialogueIndex] = {
        ...exercise.dialogue[dialogueIndex],
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

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getMatchedItems = (items: any[]) => {
    return viewMode === 'teacher' ? items : shuffleArray([...items]);
  };

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-full mr-3">
            {getIconComponent(exercise.icon)}
          </div>
          <h3 className="text-lg font-semibold">
            {isEditing ? (
              <input
                type="text"
                value={exercise.title}
                onChange={e => handleExerciseChange('title', e.target.value)}
                className="bg-transparent border-b border-white/30 text-white w-full p-1"
              />
            ) : exercise.title}
          </h3>
        </div>
        <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">{exercise.time} min</span>
        </div>
      </div>

      <div className="p-5">
        <p className="font-medium mb-3 leading-snug">
          {isEditing ? (
            <input
              type="text"
              value={exercise.instructions}
              onChange={e => handleExerciseChange('instructions', e.target.value)}
              className="w-full border p-2 editable-content"
            />
          ) : exercise.instructions}
        </p>

        {exercise.content && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            {isEditing ? (
              <textarea
                value={exercise.content}
                onChange={e => handleExerciseChange('content', e.target.value)}
                className="w-full h-32 border p-2 editable-content"
              />
            ) : (
              <p className="whitespace-pre-line leading-snug">{exercise.content}</p>
            )}
          </div>
        )}

        {exercise.type === 'reading' && exercise.questions && (
          <div className="space-y-0.5">
            {exercise.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-1">
                <div className="flex flex-row items-start">
                  <div className="flex-grow">
                    <p className="font-medium leading-snug">
                      {isEditing ? (
                        <input
                          type="text"
                          value={question.text}
                          onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)}
                          className="w-full border p-1 editable-content"
                        />
                      ) : (
                        <>{qIndex + 1}. {question.text}</>
                      )}
                    </p>
                  </div>
                  {viewMode === 'teacher' && (
                    <div className="text-green-600 italic ml-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={question.answer}
                          onChange={e => handleQuestionChange(qIndex, 'answer', e.target.value)}
                          className="border p-1 editable-content w-full"
                        />
                      ) : (
                        <span>({question.answer})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {exercise.type === 'matching' && exercise.items && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
            <div className="md:col-span-5 space-y-2">
              <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Terms</h4>
              {exercise.items.map((item, iIndex) => (
                <div key={iIndex} className="p-2 border rounded-md bg-white">
                  <span className="text-worksheet-purple font-medium mr-2">{iIndex + 1}.</span>
                  {viewMode === 'teacher' ? (
                    <span className="teacher-answer">{String.fromCharCode(65 + getMatchedItems(exercise.items).findIndex(i => i.term === item.term))}</span>
                  ) : (
                    <span className="student-answer-blank"></span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.term}
                      onChange={e => handleItemChange(iIndex, 'term', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : item.term}
                </div>
              ))}
            </div>

            <div className="md:col-span-7 space-y-2">
              <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Definitions</h4>
              {getMatchedItems(exercise.items).map((item, iIndex) => (
                <div key={iIndex} className="p-2 border rounded-md bg-white">
                  <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.definition}
                      onChange={e => {
                        const originalIndex = exercise.items.findIndex(i => i.term === item.term);
                        if (originalIndex !== -1) {
                          handleItemChange(originalIndex, 'definition', e.target.value);
                        }
                      }}
                      className="border p-1 editable-content w-full"
                    />
                  ) : item.definition}
                </div>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'fill-in-blanks' && exercise.sentences && (
          <div>
            {exercise.word_bank && (
              <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
                <p className="font-medium mb-2">Word Bank:</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.word_bank.map((word, wIndex) => (
                    <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={word}
                          onChange={e => {
                            const newWordBank = [...exercise.word_bank!];
                            newWordBank[wIndex] = e.target.value;
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
                          className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0"
                        />
                      ) : word}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <div className="space-y-2">
            {exercise.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-2 multiple-choice-question">
                <p className="font-medium mb-1 leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.text}
                      onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{qIndex + 1}. {question.text}</>
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {question.options.map((option: any, oIndex: number) => (
                    <div
                      key={oIndex}
                      className={`
                                p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                                ${viewMode === 'teacher' && option.correct ? 'bg-green-50 border-green-200' : 'bg-white'}
                              `}
                    >
                      <div
                        className={`
                                  w-5 h-5 rounded-md border flex items-center justify-center option-icon
                                  ${viewMode === 'teacher' && option.correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}
                                `}
                      >
                        {viewMode === 'teacher' && option.correct && <span>✓</span>}
                      </div>
                      <span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={option.text}
                            onChange={e => {
                              const updatedExercises = [...editableWorksheet.exercises];
                              const newOptions = [...question.options];
                              newOptions[oIndex] = {
                                ...newOptions[oIndex],
                                text: e.target.value
                              };
                              if (updatedExercises[index].questions) {
                                updatedExercises[index].questions![qIndex] = {
                                  ...updatedExercises[index].questions![qIndex],
                                  options: newOptions
                                };
                                setEditableWorksheet({
                                  ...editableWorksheet,
                                  exercises: updatedExercises
                                });
                              }
                            }}
                            className="border p-1 editable-content ml-1"
                          />
                        ) : (
                          <>{option.label}. {option.text}</>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
          <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md teacher-tip">
            <p className="font-medium mb-1 text-gray-700">Teacher's Tip:</p>
            <p className="text-gray-600 text-sm">
              {isEditing ? (
                <textarea
                  value={exercise.teacher_tip}
                  onChange={e => handleTeacherTipChange(e.target.value)}
                  className="w-full border p-2 editable-content h-16"
                />
              ) : exercise.teacher_tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSection;
