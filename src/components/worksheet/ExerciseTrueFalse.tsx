
import React from "react";

interface ExerciseTrueFalseProps {
  statements: { text: string; isTrue: boolean }[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onStatementChange: (sIndex: number, field: string, value: string | boolean) => void;
}

const ExerciseTrueFalse: React.FC<ExerciseTrueFalseProps> = ({
  statements, isEditing, viewMode, onStatementChange
}) => (
  <div className="space-y-2">
    {statements.map((statement, sIndex) => (
      <div key={sIndex} className="border-b pb-2">
        <div className="flex flex-row items-start">
          <div className="flex-grow">
            <p className="leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={statement.text}
                  onChange={e => onStatementChange(sIndex, 'text', e.target.value)}
                  className="w-full border p-1 editable-content"
                />
              ) : (
                <>{sIndex + 1}. {statement.text}</>
              )}
            </p>
          </div>
          <div className="ml-4 flex space-x-4">
            {viewMode === 'student' ? (
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                  <span className="ml-2">True</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                  <span className="ml-2">False</span>
                </label>
              </div>
            ) : (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <select
                    value={statement.isTrue ? "true" : "false"}
                    onChange={e => onStatementChange(sIndex, 'isTrue', e.target.value === "true")}
                    className="border p-1 editable-content"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <span>({statement.isTrue ? "True" : "False"})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ExerciseTrueFalse;
