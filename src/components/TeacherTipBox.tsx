
import React from "react";
import { Info } from "lucide-react";

interface TeacherTipBoxProps {
  children: React.ReactNode;
}

export default function TeacherTipBox({ children }: TeacherTipBoxProps) {
  return (
    <div className="flex items-start gap-2 bg-[#FEF7CD] rounded-lg min-h-[44px] px-4 py-3 mb-3 mt-4" style={{ boxShadow: "0 1px 6px rgba(223,222,176,0.1)" }}>
      <Info className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
      <div>
        <span className="font-semibold text-yellow-700 mr-2">Teacher's Tip:</span>
        <span className="text-sm text-gray-900">{children}</span>
      </div>
    </div>
  );
}
