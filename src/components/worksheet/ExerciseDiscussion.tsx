
import React from "react";

interface ExerciseDiscussionProps {
  questions: string[];
  isEditing: boolean;
  onQuestionChange: (qIndex: number, value: string) => void;
}

const ExerciseDiscussion: React.FC<ExerciseDiscussionProps> = ({
  questions, isEditing, onQuestionChange
}) => (
  <div className="space-y-0.5">
    <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
    {questions.map((question, qIndex) => (
      <div key={qIndex} className="p-1 border-b">
        <p className="leading-snug">
          {isEditing ? (
            <input
              type="text"
              value={question}
              onChange={e => onQuestionChange(qIndex, e.target.value)}
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

export default ExerciseDiscussion;
