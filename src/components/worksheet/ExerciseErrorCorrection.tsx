
import React from "react";

interface ExerciseErrorCorrectionProps {
  sentences: { text: string; correction: string }[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseErrorCorrection: React.FC<ExerciseErrorCorrectionProps> = ({
  sentences, isEditing, viewMode, onSentenceChange
}) => (
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
                  onChange={e => onSentenceChange(sIndex, 'correction', e.target.value)}
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
);

export default ExerciseErrorCorrection;
