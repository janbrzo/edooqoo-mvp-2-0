
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { AddStudentButton } from '@/components/dashboard/AddStudentButton';
import { User, Users, FileText, Plus, GraduationCap, Coins } from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { worksheets, loading: worksheetsLoading } = useWorksheetHistory();
  const { tokenLeft, loading: tokenLoading } = useTokenSystem(user?.id);
  const navigate = useNavigate();

  // Sort students by updated_at (most recent first)
  const sortedStudents = students?.sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ) || [];

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const formatWorksheetDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    };
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today\n${formatTime(date)}`;
    } else {
      return `${formatDate(date)}\n${formatTime(date)}`;
    }
  };

  const getWorksheetTitle = (worksheet: any) => {
    if (worksheet.title) {
      return worksheet.title;
    }
    
    const formData = worksheet.form_data;
    if (formData?.lessonTopic) {
      return formData.lessonTopic;
    }
    
    return 'Untitled Worksheet';
  };

  const getWorksheetDetails = (worksheet: any) => {
    const formData = worksheet.form_data;
    const topic = formData?.lessonTopic || 'General';
    const goal = formData?.lessonGoal || 'Practice';
    return `Topic: ${topic} • Goal: ${goal}`;
  };

  if (authLoading || studentsLoading || worksheetsLoading || tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isRegisteredUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Button asChild>
            <Link to="/login">Sign In</Link>
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
              Manage your students and track your worksheets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Coins className="h-4 w-4 mr-1" />
              {tokenLeft} tokens
            </Badge>
            <Button onClick={handleForceNewWorksheet}>
              <Plus className="h-4 w-4 mr-2" />
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students Section - 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students ({sortedStudents.length})
                  </CardTitle>
                  <AddStudentButton onStudentAdded={refetchStudents} />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {sortedStudents.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No students yet</p>
                    <AddStudentButton onStudentAdded={refetchStudents} />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {sortedStudents.map((student) => (
                      <StudentCard 
                        key={student.id} 
                        student={student}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Worksheets Section - 1 column */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Worksheets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {worksheets.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No worksheets yet</p>
                    <Button onClick={handleForceNewWorksheet}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Worksheet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {worksheets.slice(0, 10).map((worksheet) => (
                      <div key={worksheet.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <Link to={`/worksheet/${worksheet.id}`} className="block">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm mb-1 line-clamp-1">
                                {getWorksheetTitle(worksheet)}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-2">
                                {getWorksheetDetails(worksheet)}
                              </p>
                              <div className="text-xs text-muted-foreground whitespace-pre-line">
                                {formatWorksheetDate(worksheet.created_at)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                    {worksheets.length > 10 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/profile">View All Worksheets</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
