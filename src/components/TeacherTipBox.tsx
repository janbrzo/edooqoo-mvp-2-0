
import React from 'react';
import { Info } from 'lucide-react';

interface TeacherTipBoxProps {
  tip: string;
}

const TeacherTipBox = ({ tip }: TeacherTipBoxProps) => {
  return (
    <div className="teacher-notes bg-yellow-50 border border-yellow-200 rounded-md p-3 my-4 flex items-start space-x-3">
      <Info className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
      <div>
        <h4 className="font-medium text-amber-800 mb-1">Teacher's Tip:</h4>
        <p className="text-amber-700 text-sm">{tip}</p>
      </div>
    </div>
  );
};

export default TeacherTipBox;
