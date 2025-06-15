
import React, { useMemo } from "react";

interface ExerciseFillInBlanksProps {
  word_bank?: string[];
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordBankChange: (wIndex: number, value: string) => void;
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseFillInBlanks: React.FC<ExerciseFillInBlanksProps> = ({
  word_bank, sentences, isEditing, viewMode, onWordBankChange, onSentenceChange
}) => {
  // Shuffle word bank randomly for student view, but keep original order for editing
  const shuffledWordBank = useMemo(() => {
    if (!word_bank || isEditing) return word_bank;
    
    const shuffled = [...word_bank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [word_bank, isEditing]);

  const displayWordBank = isEditing ? word_bank : shuffledWordBank;

  return (
    <div>
      {displayWordBank && (
        <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
          <p className="font-medium mb-2">Word Bank:</p>
          <div className="flex flex-wrap gap-2">
            {displayWordBank.map((word, wIndex) => (
              <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={word}
                    onChange={e => onWordBankChange(wIndex, e.target.value)}
                    className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0"
                  />
                ) : word}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-0.5">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-1">
            <div className="flex flex-row items-start">
              <div className="flex-grow">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.text}
                      onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                  )}
                </p>
              </div>
              {/* Always render answers but control visibility with CSS */}
              <div className={`teacher-answer text-green-600 italic ml-3 text-sm ${viewMode === 'student' ? 'hidden' : ''}`}>
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.answer}
                    onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence.answer})</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseFillInBlanks;
