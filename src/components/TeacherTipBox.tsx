
import React from 'react';
import { Info } from 'lucide-react';

interface TeacherTipBoxProps {
  tip: string;
}

const TeacherTipBox = ({ tip }: TeacherTipBoxProps) => {
  return (
    <div
      className="flex items-start rounded-md px-3 py-1.5 my-2"
      style={{
        background: "linear-gradient(90deg, #FEF7CD 70%, #FAF5E3 100%)",
        border: "1.5px solid #ffeab9",
        minHeight: "38px"
      }}
      data-no-pdf="true"
    >
      <Info className="text-amber-400 flex-shrink-0 mr-2 mt-0.5" size={18} />
      <div>
        <h4 className="font-medium text-amber-800 mb-0.5 leading-tight text-base flex items-center">
          Teacher&#39;s Tip:
        </h4>
        <span className="text-amber-700 text-[13.5px] leading-tight">{tip}</span>
      </div>
    </div>
  );
};

export default TeacherTipBox;
