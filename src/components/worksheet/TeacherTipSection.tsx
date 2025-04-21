
import React from "react";

interface TeacherTipSectionProps {
  tip: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

const TeacherTipSection: React.FC<TeacherTipSectionProps> = ({
  tip, isEditing, onChange
}) => (
  <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md teacher-tip">
    <p className="font-medium mb-1 text-gray-700">Teacher's Tip:</p>
    <p className="text-gray-600 text-sm">
      {isEditing ? (
        <textarea
          value={tip}
          onChange={e => onChange(e.target.value)}
          className="w-full border p-2 editable-content h-16"
        />
      ) : tip}
    </p>
  </div>
);

export default TeacherTipSection;
