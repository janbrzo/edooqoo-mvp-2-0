
import React from "react";
import { Button } from "@/components/ui/button";
import { User, Lightbulb } from "lucide-react";

interface ViewToggleButtonsProps {
  viewMode: "student" | "teacher";
  onViewModeChange: (mode: "student" | "teacher") => void;
}

const ViewToggleButtons = ({
  viewMode,
  onViewModeChange,
}: ViewToggleButtonsProps) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant={viewMode === 'student' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('student')}
        className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
        size="sm"
      >
        <User className="mr-2 h-4 w-4" />
        Student View
      </Button>
      <Button
        variant={viewMode === 'teacher' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('teacher')}
        className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
        size="sm"
      >
        <Lightbulb className="mr-2 h-4 w-4" />
        Teacher View
      </Button>
    </div>
  );
};

export default ViewToggleButtons;
