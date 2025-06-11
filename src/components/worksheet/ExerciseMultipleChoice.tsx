
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
  // Create stable shuffled version only once when component mounts
  const processedQuestions = useMemo(() => {
    if (isEditing) return questions;
    
    return questions.map((question, qIndex) => {
      if (!question.options || question.options.length !== 4) return question;
      
      // Create stable seed based on question index and text
      const seed = qIndex + (question.text ? question.text.length : 0);
      
      // Find the correct answer
      const correctOption = question.options.find((opt: any) => opt.correct);
      if (!correctOption) return question;
      
      // Create unique options set to avoid duplicates
      const uniqueOptions = new Set();
      const newOptions = [];
      
      // Add correct answer first
      uniqueOptions.add(correctOption.text.toLowerCase().trim());
      newOptions.push({
        text: correctOption.text,
        correct: false, // Will be set later
        label: 'A'
      });
      
      // Add unique incorrect options
      const incorrectOptions = question.options.filter((opt: any) => 
        !opt.correct && 
        opt.text && 
        !uniqueOptions.has(opt.text.toLowerCase().trim())
      );
      
      for (const opt of incorrectOptions) {
        if (newOptions.length >= 4) break;
        uniqueOptions.add(opt.text.toLowerCase().trim());
        newOptions.push({
          text: opt.text,
          correct: false,
          label: String.fromCharCode(65 + newOptions.length)
        });
      }
      
      // Fill remaining slots if needed
      const fallbackOptions = ['None of the above', 'Other option', 'Not applicable'];
      for (const fallback of fallbackOptions) {
        if (newOptions.length >= 4) break;
        if (!uniqueOptions.has(fallback.toLowerCase())) {
          newOptions.push({
            text: fallback,
            correct: false,
            label: String.fromCharCode(65 + newOptions.length)
          });
        }
      }
      
      // Ensure we have exactly 4 options
      while (newOptions.length < 4) {
        const generic = `Option ${newOptions.length + 1}`;
        newOptions.push({
          text: generic,
          correct: false,
          label: String.fromCharCode(65 + newOptions.length)
        });
      }
      
      // Shuffle using deterministic approach based on seed
      const shuffled = [...newOptions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (seed * (i + 1)) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Set one random option as correct
      const correctIndex = seed % 4;
      shuffled.forEach((opt, idx) => {
        opt.correct = idx === correctIndex;
        opt.label = String.fromCharCode(65 + idx);
        if (idx === correctIndex) {
          opt.text = correctOption.text;
        }
      });
      
      return {
        ...question,
        options: shuffled
      };
    });
  }, [questions, isEditing]);

  return (
    <div className="space-y-2">
      {processedQuestions.map((question, qIndex) => (
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
