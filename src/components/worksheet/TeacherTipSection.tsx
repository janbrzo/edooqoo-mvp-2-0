
import React from "react";
import { Info } from "lucide-react";

interface TeacherTipSectionProps {
  tip: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

const TeacherTipSection: React.FC<TeacherTipSectionProps> = ({
  tip,
  isEditing,
  onChange
}) => (
  <div 
    style={{
      background: "#FEF9E7", // Lighter yellow background
      borderLeft: "4px solid #ffeab9"
    }} 
    data-no-pdf="false"  // Allow teacher tips to be included in the PDF for teacher view
    className="mt-4 p-3 rounded-md teacher-tip flex items-start py-[6px] bg-amber-50"
  >
    <Info className="text-amber-400 mr-2 mt-1" size={19} />
    <div className="flex-1 min-w-0">
      <p 
        className="font-medium mb-1 text-amber-800 flex items-center leading-tight text-sm" 
        style={{
          marginBottom: 2
        }}
      >
        Teacher&#39;s Tip:
      </p>
      <p className="text-amber-800 text-[13.5px] leading-tight">
        {isEditing ? (
          <textarea 
            value={tip} 
            onChange={e => onChange(e.target.value)} 
            className="w-full border p-2 editable-content h-16" 
          />
        ) : tip}
      </p>
    </div>
  </div>
);

export default TeacherTipSection;
