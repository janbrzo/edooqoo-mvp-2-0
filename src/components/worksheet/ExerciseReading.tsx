
import React from "react";

interface ExerciseReadingProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
}

const ExerciseReading: React.FC<ExerciseReadingProps> = ({
  questions, isEditing, viewMode, onQuestionChange
}) => (
  <div className="space-y-0.5">
    {questions.map((question, qIndex) => (
      <div key={qIndex} className="border-b pb-1">
        <div className="flex flex-row items-start">
          <div className="flex-grow">
            <p className="font-medium leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={question.text}
                  onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                  className="w-full border p-1 editable-content"
                />
              ) : (
                <>{qIndex + 1}. {question.text}</>
              )}
            </p>
          </div>
          <div className={`text-green-600 italic ml-3 text-sm exercise-answer ${viewMode === 'student' ? 'hidden' : ''}`}>
            {isEditing ? (
              <input
                type="text"
                value={question.answer}
                onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                className="border p-1 editable-content w-full"
              />
            ) : (
              <span>({question.answer})</span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ExerciseReading;
