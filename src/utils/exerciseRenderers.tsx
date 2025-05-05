
import React from "react";

/**
 * Renders miscellaneous exercise types (error-correction, word-formation, word-order)
 */
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

/**
 * Renders true/false exercise type
 */
export const renderTrueFalseExercise = (
  exercise: any, 
  isEditing: boolean, 
  viewMode: 'student' | 'teacher',
  handleStatementChange: (statementIndex: number, field: string, value: string | boolean) => void
) => (
  <div>
    <div className="space-y-2">
      {exercise.statements.map((statement: any, sIndex: number) => (
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
 * Shuffles an array randomly (Fisher-Yates algorithm)
 */
export const shuffleArray = (array: any[]): any[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Gets matched items for matching exercises
 */
export const getMatchedItems = (items: any[], viewMode: 'student' | 'teacher'): any[] => {
  return viewMode === 'teacher' ? items : shuffleArray([...items]);
};
