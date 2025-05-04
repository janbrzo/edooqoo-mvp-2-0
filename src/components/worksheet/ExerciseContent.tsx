
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
  // Count words in reading content if available
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const showWordCount = content && content.length > 0;
  
  // Sprawdzenie czy instrukcje zawierają element audio - którym nie obsługujemy
  const hasAudioReference = instructions && instructions.toLowerCase().includes("audio") && 
                           (instructions.toLowerCase().includes("listen") || 
                            instructions.toLowerCase().includes("listening"));

  return (
    <>
      {hasAudioReference && (
        <div className="mb-3 p-2 bg-amber-100 text-amber-800 rounded-md text-sm">
          Note: Audio content is not available in this worksheet format.
        </div>
      )}
      
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
          {showWordCount && (
            <div className="text-xs text-gray-500 mb-2">
              Word count: {wordCount} {wordCount < 280 && <span className="text-red-500">(should be 280-320 words)</span>}
            </div>
          )}
          {isEditing && onContentChange ? (
            <textarea
              value={content}
              onChange={e => onContentChange(e.target.value)}
              className="w-full h-32 border p-2 editable-content"
            />
          ) : (
            <p className="whitespace-pre-line leading-snug">{content}</p>
          )}
        </div>
      )}
    </>
  );
};

export default ExerciseContent;
