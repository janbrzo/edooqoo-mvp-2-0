
import React from "react";
import { Button } from "@/components/ui/button";
import { LessonTime, LESSON_TIMES } from "@/constants/worksheetFormData";

interface LessonTimeSelectorProps {
  lessonTime: LessonTime;
  setLessonTime: (time: LessonTime) => void;
}

const LessonTimeSelector: React.FC<LessonTimeSelectorProps> = ({
  lessonTime,
  setLessonTime
}) => {
  return (
    <div className="flex gap-2">
      {LESSON_TIMES.map((time) => (
        <Button
          key={time}
          variant={lessonTime === time ? "default" : "outline"}
          onClick={() => setLessonTime(time as LessonTime)}
          className={lessonTime === time ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
        >
          {time}
        </Button>
      ))}
    </div>
  );
};

export default LessonTimeSelector;
