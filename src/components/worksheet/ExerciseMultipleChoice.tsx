import React, { useMemo } from "react";

interface ExerciseMultipleChoiceProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionTextChange: (qIndex: number, value: string) => void;
  onOptionTextChange: (qIndex: number, oIndex: number, value: string) => void;
}

const ExerciseMultipleChoice: React.FC<ExerciseMultipleChoiceProps> = ({
  questions, isEditing, viewMode, onQuestionTextChange, onOptionTextChange
}) => {
  // Shuffle correct answers randomly for display, but keep original for editing
  const questionsWithShuffledAnswers = useMemo(() => {
    if (isEditing) return questions;
    
    return questions.map(question => {
      if (!question.options || question.options.length !== 4) return question;
      
      // Find the correct answer
      const correctOption = question.options.find((opt: any) => opt.correct);
      if (!correctOption) return question;
      
      // Create new shuffled options
      const shuffledOptions = [...question.options];
      
      // Remove correct flag from all options first
      shuffledOptions.forEach(opt => opt.correct = false);
      
      // Randomly assign correct flag to one of the options
      const randomIndex = Math.floor(Math.random() * 4);
      shuffledOptions[randomIndex].correct = true;
      shuffledOptions[randomIndex].text = correctOption.text;
      
      // Fill other options with incorrect answers, making sure we don't duplicate the correct answer
      const incorrectOptions = question.options.filter((opt: any) => !opt.correct);
      let incorrectIndex = 0;
      
      for (let i = 0; i < 4; i++) {
        if (i !== randomIndex && incorrectIndex < incorrectOptions.length) {
          shuffledOptions[i].text = incorrectOptions[incorrectIndex].text;
          shuffledOptions[i].correct = false;
          incorrectIndex++;
        }
      }
      
      return {
        ...question,
        options: shuffledOptions
      };
    });
  }, [questions, isEditing]);

  return (
    <div className="space-y-2">
      {questionsWithShuffledAnswers.map((question, qIndex) => (
        <div key={qIndex} className="border-b pb-2 multiple-choice-question">
          <p className="font-medium mb-1 leading-snug">
            {isEditing ? (
              <input
                type="text"
                value={question.text}
                onChange={e => onQuestionTextChange(qIndex, e.target.value)}
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
                      onChange={e => onOptionTextChange(qIndex, oIndex, e.target.value)}
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
  );
};

export default ExerciseMultipleChoice;
