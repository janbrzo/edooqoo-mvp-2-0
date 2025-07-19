
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { Tables } from '@/integrations/supabase/types';
import { User, GraduationCap, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

type Student = Tables<'students'>;

interface StudentCardProps {
  student: Student;
  onViewHistory: (studentId: string) => void;
  onOpenWorksheet: (worksheet: any) => void;
}

export const StudentCard = ({ student, onViewHistory, onOpenWorksheet }: StudentCardProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const { deleteStudent } = useStudents();
  const { worksheets: allWorksheets, getStudentWorksheetCount } = useWorksheetHistory();
  
  // Get worksheets for this specific student
  const studentWorksheets = allWorksheets.filter(w => w.student_id === student.id);
  const worksheetCount = getStudentWorksheetCount(student.id);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await deleteStudent(student.id);
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <GraduationCap className="h-3 w-3" />
                Level {student.english_level}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {worksheetCount} worksheets
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Main Goal</p>
          <p className="text-sm">{student.main_goal}</p>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          Added {format(new Date(student.created_at), 'MMM dd, yyyy')}
        </div>

        <div className="flex gap-2 pt-2">
          <Link 
            to={`/?studentId=${student.id}`}
            className="flex-1"
          >
            <Button size="sm" className="w-full">
              Generate Worksheet
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={toggleHistory}
            className="flex items-center gap-1"
          >
            View History
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {showHistory && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">Worksheet History</h4>
            {studentWorksheets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No worksheets generated yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {studentWorksheets.slice(0, 5).map((worksheet) => (
                  <div
                    key={worksheet.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onOpenWorksheet(worksheet)}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px]">
                        {worksheet.title || 'Untitled Worksheet'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(worksheet.created_at), 'MMM dd')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
