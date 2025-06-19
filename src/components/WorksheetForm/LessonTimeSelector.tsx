
import { Button } from "@/components/ui/button";
import { LessonTime } from './types';
import { useIsMobile } from "@/hooks/use-mobile";

interface LessonTimeSelectorProps {
  lessonTime: LessonTime;
  onLessonTimeChange: (time: LessonTime) => void;
}

export default function LessonTimeSelector({ lessonTime, onLessonTimeChange }: LessonTimeSelectorProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex gap-2 ${isMobile ? 'justify-center' : 'w-32'}`}>
      <Button 
        type="button"
        variant={lessonTime === "45 min" ? "default" : "outline"} 
        onClick={() => onLessonTimeChange("45 min")} 
        className={lessonTime === "45 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
        size={isMobile ? "sm" : "sm"}
      >
        45 min
      </Button>
      <Button 
        type="button"
        variant={lessonTime === "60 min" ? "default" : "outline"} 
        onClick={() => onLessonTimeChange("60 min")} 
        className={lessonTime === "60 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
        size={isMobile ? "sm" : "sm"}
      >
        60 min
      </Button>
    </div>
  );
}
