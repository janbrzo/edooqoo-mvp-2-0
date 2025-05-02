
import React from "react";

interface ExerciseContentProps {
  instructions: string;
  isEditing: boolean;
  onInstructionsChange: (value: string) => void;
  content?: string;
  onContentChange?: (value: string) => void;
}

const ExerciseContent: React.FC<ExerciseContentProps> = ({
  instructions, isEditing, onInstructionsChange, content, onContentChange
}) => {
  // Funkcja do liczenia słów
  const countWords = (text: string) => {
    return text ? text.trim().split(/\s+/).length : 0;
  };

  // Sprawdzanie liczby słów dla tekstów typu reading
  const wordCount = content ? countWords(content) : 0;
  const isReadingExercise = content && content.length > 100;
  const isWordCountLow = isReadingExercise && wordCount < 280;
  const isWordCountHigh = isReadingExercise && wordCount > 320;

  return (
    <>
      <p className="font-medium mb-3 leading-snug">
        {isEditing ? (
          <input
            type="text"
            value={instructions}
            onChange={e => onInstructionsChange(e.target.value)}
            className="w-full border p-2 editable-content"
          />
        ) : instructions}
      </p>
      {content !== undefined && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          {isEditing && onContentChange ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={e => onContentChange(e.target.value)}
                className={`w-full h-32 border p-2 editable-content ${isWordCountLow || isWordCountHigh ? 'border-red-500' : ''}`}
              />
              {isReadingExercise && (
                <div className={`text-sm ${isWordCountLow || isWordCountHigh ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                  Liczba słów: {wordCount} {isWordCountLow && '(min. 280)'} {isWordCountHigh && '(max. 320)'}
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-line leading-snug">{content}</p>
          )}
        </div>
      )}
    </>
  );
};

export default ExerciseContent;
