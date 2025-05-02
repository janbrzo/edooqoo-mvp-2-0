
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
  // Calculate word count for reading passages
  const getWordCount = (text?: string): number => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.trim() !== '').length;
  };

  const wordCount = getWordCount(content);
  const isReadingText = content && wordCount > 10; // Assume it's a reading text if it's long
  const isWordCountOptimal = wordCount >= 280 && wordCount <= 320;
  const isWordCountLow = wordCount > 0 && wordCount < 280;

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
        <div className="mb-4 relative">
          <div className="p-4 bg-gray-50 rounded-md">
            {isEditing && onContentChange ? (
              <textarea
                value={content}
                onChange={e => onContentChange(e.target.value)}
                className="w-full h-64 border p-2 editable-content"
              />
            ) : (
              <p className="whitespace-pre-line leading-snug">{content}</p>
            )}
          </div>
          
          {/* Word count badge for reading passages */}
          {isReadingText && (
            <div 
              className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                isWordCountOptimal 
                  ? 'bg-green-100 text-green-800' 
                  : isWordCountLow
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
              title={isWordCountOptimal ? "Optymalna liczba słów" : "Liczba słów poza optymalnym zakresem 280-320"}
            >
              {wordCount} słów {!isWordCountOptimal && "(zalecane: 280-320)"}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ExerciseContent;
