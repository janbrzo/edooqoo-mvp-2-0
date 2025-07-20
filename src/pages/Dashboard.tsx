import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { format } from 'date-fns';
import { 
  User, 
  FileText, 
  Calendar, 
  GraduationCap, 
  Plus, 
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  Coins
} from 'lucide-react';
import { deepFixTextObjects } from '@/utils/textObjectFixer';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userId, loading } = useAnonymousAuth();
  const { students, addStudent } = useStudents();
  const { worksheets: allWorksheets, loading: worksheetsLoading } = useWorksheetHistory();
  const { tokenBalance } = useTokenSystem(userId);
  const navigate = useNavigate();

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const handleOpenWorksheet = (worksheet: any) => {
    try {
      // Parse the AI response to get the worksheet data  
      const worksheetData = JSON.parse(worksheet.ai_response);
      
      // Apply deepFixTextObjects to fix {text: "..."} objects
      const fixedWorksheetData = deepFixTextObjects(worksheetData, 'dashboard');
      
      // Find student name if available
      const student = students.find(s => s.id === worksheet.student_id);
      const studentName = student?.name;
      
      // Store worksheet data in sessionStorage for restoration
      const restoredWorksheet = {
        ...worksheet,
        ai_response: JSON.stringify(fixedWorksheetData),
        studentName: studentName
      };
      
      sessionStorage.setItem('restoredWorksheet', JSON.stringify(restoredWorksheet));
      if (studentName) {
        sessionStorage.setItem('worksheetStudentName', studentName);
      }
      
      console.log('📱 Navigating to Index with restored worksheet');
      navigate('/');
    } catch (error) {
      console.error('Error opening worksheet:', error);
    }
  };

  const recentWorksheets = allWorksheets
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = {
    totalStudents: students.length,
    totalWorksheets: allWorksheets.length,
    thisWeekWorksheets: allWorksheets.filter(w => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(w.created_at) > weekAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the dashboard.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GraduationCap className="h-8 w-8 mr-3" />
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your students and track worksheet generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleForceNewWorksheet}>
              Generate Worksheet
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Worksheets</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorksheets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeekWorksheets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenBalance}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="recent">Recent Worksheets</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Students</h2>
              <AddStudentDialog />
            </div>

            {students.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add your first student to start creating personalized worksheets
                  </p>
                  <AddStudentDialog />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onOpenWorksheet={handleOpenWorksheet}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <h2 className="text-2xl font-bold">Recent Worksheets</h2>
            
            {worksheetsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Loading worksheets...</p>
              </div>
            ) : recentWorksheets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No worksheets yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Generate your first worksheet to see it here
                  </p>
                  <Button onClick={handleForceNewWorksheet}>
                    Generate First Worksheet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentWorksheets.map((worksheet) => {
                  const student = students.find(s => s.id === worksheet.student_id);
                  return (
                    <Card key={worksheet.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleOpenWorksheet(worksheet)}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {worksheet.title || 'Untitled Worksheet'}
                              {student && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  for {student.name}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {worksheet.form_data?.lessonTopic && `Topic: ${worksheet.form_data.lessonTopic}`}
                              {worksheet.form_data?.lessonGoal && ` • Goal: ${worksheet.form_data.lessonGoal}`}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {worksheet.form_data?.englishLevel || 'Unknown Level'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(worksheet.created_at), 'PPP')} at {format(new Date(worksheet.created_at), 'p')}
                          {worksheet.generation_time_seconds && (
                            <>
                              <Clock className="h-4 w-4 ml-4 mr-2" />
                              Generated in {worksheet.generation_time_seconds}s
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
