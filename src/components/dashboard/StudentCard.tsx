import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { User, BookOpen } from 'lucide-react';

type Student = Tables<'students'>;

interface StudentCardProps {
  student: Student;
  worksheetCount?: number;
  onViewHistory?: (studentId: string) => void;
}

export const StudentCard = ({ student, worksheetCount = 0, onViewHistory }: StudentCardProps) => {
  const formatGoal = (goal: string) => {
    const goalMap: Record<string, string> = {
      'work': 'Work/Business',
      'exam': 'Exam Preparation',
      'general': 'General English',
      'travel': 'Travel',
      'academic': 'Academic'
    };
    return goalMap[goal] || goal;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{student.name}</CardTitle>
          </div>
          <Badge variant="secondary">{student.english_level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <strong>Goal:</strong> {formatGoal(student.main_goal)}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{worksheetCount} worksheets</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewHistory?.(student.id)}
          >
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};