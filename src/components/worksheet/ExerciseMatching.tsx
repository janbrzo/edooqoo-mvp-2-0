
import React from "react";

interface ExerciseMatchingProps {
  items: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  getMatchedItems: (items: any[]) => any[];
  onItemChange: (iIndex: number, field: string, value: string) => void;
}

const ExerciseMatching: React.FC<ExerciseMatchingProps> = ({
  items, isEditing, viewMode, getMatchedItems, onItemChange
}) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
    <div className="md:col-span-5 space-y-2">
      <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Terms</h4>
      {items.map((item, iIndex) => (
        <div key={iIndex} className="p-2 border rounded-md bg-white">
          <span className="text-worksheet-purple font-medium mr-2">{iIndex + 1}.</span>
          {viewMode === 'teacher' ? (
            <span className="teacher-answer">{String.fromCharCode(65 + getMatchedItems(items).findIndex(i => i.term === item.term))}</span>
          ) : (
            <span className="student-answer-blank"></span>
          )}
          {isEditing ? (
            <input
              type="text"
              value={item.term}
              onChange={e => onItemChange(iIndex, 'term', e.target.value)}
              className="border p-1 editable-content w-full"
            />
          ) : item.term}
        </div>
      ))}
    </div>

    <div className="md:col-span-7 space-y-2">
      <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Definitions</h4>
      {getMatchedItems(items).map((item, iIndex) => (
        <div key={iIndex} className="p-2 border rounded-md bg-white">
          <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
          {isEditing ? (
            <input
              type="text"
              value={item.definition}
              onChange={e => {
                const originalIndex = items.findIndex(i => i.term === item.term);
                if (originalIndex !== -1) {
                  onItemChange(originalIndex, 'definition', e.target.value);
                }
              }}
              className="border p-1 editable-content w-full"
            />
          ) : item.definition}
        </div>
      ))}
    </div>
  </div>
);

export default ExerciseMatching;
