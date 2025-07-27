
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, GraduationCap, Target, Plus, Calendar } from 'lucide-react';
import { AddStudentButton } from './AddStudentButton';

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    english_level: string;
    main_goal: string;
    created_at: string;
    last_worksheet_generated?: string;
  };
  onOpenWorksheet: (worksheet: any) => void;
  onStudentClick?: (studentId: string) => void;
}

export const StudentCard = ({ student, onOpenWorksheet, onStudentClick }: StudentCardProps) => {
  const handleGenerateWorksheet = () => {
    const worksheetData = {
      student_id: student.id,
      student_name: student.name,
      english_level: student.english_level,
      learning_goal: student.main_goal,
      topic: '',
      worksheet_type: 'mixed'
    };
    onOpenWorksheet(worksheetData);
  };

  const handleStudentClick = () => {
    if (onStudentClick) {
      onStudentClick(student.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <button
                onClick={handleStudentClick}
                className="font-medium text-primary hover:underline truncate"
              >
                {student.name}
              </button>
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {student.english_level}
                </Badge>
              </div>
              
              <div className="flex items-start gap-2">
                <Target className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {student.main_goal}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {student.last_worksheet_generated 
                    ? `Last worksheet: ${new Date(student.last_worksheet_generated).toLocaleDateString()}`
                    : `Added: ${new Date(student.created_at).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleGenerateWorksheet}
            className="flex-shrink-0 ml-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Worksheet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
