
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { StudentEditDialog } from '@/components/StudentEditDialog';
import { DeleteWorksheetButton } from '@/components/DeleteWorksheetButton';
import { StudentSelector } from '@/components/StudentSelector';
import { ArrowLeft, FileText, Calendar, User, BookOpen, Target, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { deepFixTextObjects } from '@/utils/textObjectFixer';

const StudentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, updateStudent } = useStudents();
  const { worksheets, loading, deleteWorksheet, refetch: refetchWorksheets } = useWorksheetHistory(id || '');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const student = students.find(s => s.id === id);

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Student not found</h1>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleWorksheetClick = (worksheet: any) => {
    try {
      // Parse the AI response to get the worksheet data
      const worksheetData = JSON.parse(worksheet.ai_response);
      
      // Apply deepFixTextObjects to fix {text: "..."} objects
      const fixedWorksheetData = deepFixTextObjects(worksheetData, 'studentPage');
      
      // Store worksheet data in sessionStorage for restoration
      const restoredWorksheet = {
        ...worksheet,
        ai_response: JSON.stringify(fixedWorksheetData)
      };
      
      sessionStorage.setItem('restoredWorksheet', JSON.stringify(restoredWorksheet));
      sessionStorage.setItem('worksheetStudentName', student.name);
      
      console.log('📱 Navigating to Index with restored worksheet for student:', student.name);
      navigate('/');
    } catch (error) {
      console.error('Error opening worksheet:', error);
    }
  };

  const handleGenerateWorksheet = () => {
    // Store the student data for pre-selection in the form
    sessionStorage.setItem('preSelectedStudent', JSON.stringify({
      id: student.id,
      name: student.name
    }));
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <User className="h-8 w-8 mr-3" />
                {student.name}
              </h1>
              <p className="text-muted-foreground">Student Profile & Worksheets</p>
            </div>
          </div>
          <Button onClick={handleGenerateWorksheet}>
            Generate New Worksheet
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Student Details
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">English Level</label>
                  <Badge variant="secondary" className="ml-2">{student.english_level}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Main Goal</label>
                  <div className="flex items-center mt-1">
                    <Target className="h-4 w-4 mr-2 text-primary" />
                    <span>{formatGoal(student.main_goal)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Worksheets</label>
                  <div className="flex items-center mt-1">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold">{worksheets.length}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student Since</label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span>{format(new Date(student.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Worksheets List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    All Worksheets ({worksheets.length})
                  </CardTitle>
                  {worksheets.length > 0 && (
                    <Button onClick={handleGenerateWorksheet} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate another Worksheet
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading worksheets...</p>
                  </div>
                ) : worksheets.length > 0 ? (
                  <div className="space-y-3">
                    {worksheets.map((worksheet) => (
                      <div
                        key={worksheet.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div 
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                          onClick={() => handleWorksheetClick(worksheet)}
                        >
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-medium">
                              {worksheet.title || 'Untitled Worksheet'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {worksheet.form_data?.lessonTopic && `Topic: ${worksheet.form_data.lessonTopic}`}
                              {worksheet.form_data?.grammar && ` • Grammar: ${worksheet.form_data.grammar}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(worksheet.created_at), 'HH:mm')}
                            </div>
                          </div>
                          <StudentSelector
                            worksheetId={worksheet.id}
                            currentStudentId={worksheet.student_id}
                            worksheetTitle={worksheet.title || 'Untitled Worksheet'}
                            onTransferSuccess={refetchWorksheets}
                          />
                          <DeleteWorksheetButton
                            worksheetId={worksheet.id}
                            worksheetTitle={worksheet.title || 'Untitled Worksheet'}
                            onDelete={deleteWorksheet}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No worksheets generated yet</p>
                    <Button onClick={handleGenerateWorksheet} className="mt-4">
                      Generate First Worksheet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <StudentEditDialog
          student={student}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={updateStudent}
        />
      </div>
    </div>
  );
};

export default StudentPage;
