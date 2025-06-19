
import { useIsMobile } from "@/hooks/use-mobile";
import LessonTimeSelector from './LessonTimeSelector';
import EnglishLevelSelector from './EnglishLevelSelector';
import { LessonTime, EnglishLevel } from './types';

interface WorksheetHeaderProps {
  lessonTime: LessonTime;
  englishLevel: EnglishLevel;
  onLessonTimeChange: (time: LessonTime) => void;
  onEnglishLevelChange: (level: EnglishLevel) => void;
}

export default function WorksheetHeader({ 
  lessonTime, 
  englishLevel, 
  onLessonTimeChange, 
  onEnglishLevelChange 
}: WorksheetHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-start'} mb-6`}>
        <div className={`${isMobile ? 'text-center' : ''}`}>
          <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            Create A Worksheet
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
            Tailored to your students. In seconds.
          </p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-14'}`}>
          <LessonTimeSelector 
            lessonTime={lessonTime}
            onLessonTimeChange={onLessonTimeChange}
          />
          
          <EnglishLevelSelector 
            englishLevel={englishLevel}
            setEnglishLevel={onEnglishLevelChange}
          />
        </div>
      </div>
    </div>
  );
}
