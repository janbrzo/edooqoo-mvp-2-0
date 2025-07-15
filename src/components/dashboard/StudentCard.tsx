import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { User, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Student = Tables<'students'>;

interface StudentCardProps {
  student: Student;
  worksheetCount?: number;
  onViewHistory?: (studentId: string) => void;
}

export const StudentCard = ({ student, worksheetCount = 0, onViewHistory }: StudentCardProps) => {
  const { userId } = useAnonymousAuth();
  const { getStudentWorksheets } = useWorksheetHistory(userId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentWorksheets, setRecentWorksheets] = useState<Tables<'worksheets'>[]>([]);
  const [actualWorksheetCount, setActualWorksheetCount] = useState(worksheetCount);

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

  const fetchRecentWorksheets = async () => {
    const worksheets = await getStudentWorksheets(student.id, 3);
    setRecentWorksheets(worksheets);
    setActualWorksheetCount(worksheets.length);
  };

  const handleViewHistory = async () => {
    if (!isExpanded) {
      await fetchRecentWorksheets();
    }
    setIsExpanded(!isExpanded);
  };

  const handleViewAllHistory = () => {
    onViewHistory?.(student.id);
  };

  const openWorksheet = (worksheetId: string) => {
    // Store worksheet ID in sessionStorage and navigate to main page
    sessionStorage.setItem('openWorksheetId', worksheetId);
    window.location.href = '/';
  };

  useEffect(() => {
    fetchRecentWorksheets();
  }, [student.id]);

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
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{actualWorksheetCount} worksheets</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewHistory}
              >
                View History
                {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="mt-3">
            <div className="space-y-2">
              {recentWorksheets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No worksheets yet</p>
              ) : (
                <>
                  {recentWorksheets.map((worksheet) => (
                    <div key={worksheet.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{worksheet.title || 'Untitled Worksheet'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(worksheet.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openWorksheet(worksheet.id)}
                        className="ml-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {recentWorksheets.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={handleViewAllHistory}
                    >
                      View All History
                    </Button>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};