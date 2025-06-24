
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Lightbulb } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ViewModeToggleProps {
  viewMode: 'student' | 'teacher';
  setViewMode: (mode: 'student' | 'teacher') => void;
}

export default function ViewModeToggle({
  viewMode,
  setViewMode
}: ViewModeToggleProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex ${isMobile ? 'justify-center' : ''} space-x-2`}>
      <Button
        variant={viewMode === 'student' ? 'default' : 'outline'}
        onClick={() => setViewMode('student')}
        className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
        size="sm"
      >
        <User className="mr-2 h-4 w-4" />
        Student View
      </Button>
      <Button
        variant={viewMode === 'teacher' ? 'default' : 'outline'}
        onClick={() => setViewMode('teacher')}
        className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
        size="sm"
      >
        <Lightbulb className="mr-2 h-4 w-4" />
        Teacher View
      </Button>
    </div>
  );
}
