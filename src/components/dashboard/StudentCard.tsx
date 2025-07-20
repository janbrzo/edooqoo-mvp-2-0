import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tables } from '@/integrations/supabase/types';
import { User, BookOpen, ChevronDown, ChevronRight, FileText, Calendar, ExternalLink } from 'lucide-react';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

type Student = Tables<'students'>;

interface StudentCardProps {
  student: Student;
  onViewHistory?: (studentId: string) => void;
  onOpenWorksheet?: (worksheet: any) => void;
}

export const StudentCard = ({ student, onViewHistory, onOpenWorksheet }: StudentCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { worksheets, loading, getRecentWorksheets } = useWorksheetHistory(student.id);
  const recentWorksheets = getRecentWorksheets(3);

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

  const handleWorksheetClick = (worksheet: any) => {
    if (onOpenWorksheet) {
      // Parse the AI response to get the worksheet data
      const worksheetData = JSON.parse(worksheet.ai_response);
      onOpenWorksheet({
        ...worksheetData,
        id: worksheet.id,
        inputParams: worksheet.form_data
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Link to={`/student/${student.id}`} className="hover:underline">
              <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                {student.name}
              </CardTitle>
            </Link>
          </div>
          <Badge variant="secondary">{student.english_level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <strong>Goal:</strong> {formatGoal(student.main_goal)}
        </div>
        
        {/* Fixed layout: keep elements aligned even when expanded */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{worksheets.length} worksheets</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/student/${student.id}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View Profile
              </Link>
            </Button>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  Recent
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        
        {/* Collapsible content placed outside the flex container */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="mt-3">
            {loading ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : recentWorksheets.length > 0 ? (
              <div className="space-y-2">
                {recentWorksheets.map((worksheet) => (
                  <div
                    key={worksheet.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
                    onClick={() => handleWorksheetClick(worksheet)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {worksheet.title || 'Untitled Worksheet'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(worksheet.created_at), 'MMM dd')}</span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  className="w-full text-xs"
                  asChild
                >
                  <Link to={`/student/${student.id}`}>
                    View All ({worksheets.length} total)
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No worksheets generated yet
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
