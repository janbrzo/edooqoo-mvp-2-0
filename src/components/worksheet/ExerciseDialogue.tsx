
import React from "react";

interface ExerciseDialogueProps {
  dialogue: any[];
  expressions?: string[];
  expression_instruction?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onDialogueChange: (index: number, field: string, value: string) => void;
  onExpressionChange: (index: number, value: string) => void;
  onExpressionInstructionChange: (value: string) => void;
}

const ExerciseDialogue: React.FC<ExerciseDialogueProps> = ({
  dialogue,
  expressions,
  expression_instruction,
  isEditing,
  viewMode,
  onDialogueChange,
  onExpressionChange,
  onExpressionInstructionChange
}) => {
  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 rounded-md dialogue-section">
        {dialogue.map((line, lIndex) => (
          <div key={lIndex} className="mb-1 dialogue-line">
            <span className="font-semibold">
              {isEditing ? (
                <input
                  type="text"
                  value={line.speaker}
                  onChange={e => onDialogueChange(lIndex, 'speaker', e.target.value)}
                  className="border p-1 editable-content w-32"
                />
              ) : (
                <>{line.speaker}:</>
              )}
            </span>
            <span className="leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={line.text}
                  onChange={e => onDialogueChange(lIndex, 'text', e.target.value)}
                  className="border p-1 editable-content ml-1 w-full"
                />
              ) : (
                <> {line.text}</>
              )}
            </span>
          </div>
        ))}
      </div>

      {expressions && (
        <div>
          <p className="font-medium mb-2">
            {isEditing ? (
              <input
                type="text"
                value={expression_instruction || ""}
                onChange={e => onExpressionInstructionChange(e.target.value)}
                className="w-full border p-1 editable-content"
              />
            ) : expression_instruction}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {expressions.map((expr, eIndex) => (
              <div key={eIndex} className="p-2 border rounded-md bg-white">
                <span className="text-worksheet-purple font-medium mr-2">{eIndex + 1}.</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={expr}
                    onChange={e => onExpressionChange(eIndex, e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : expr}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDialogue;
