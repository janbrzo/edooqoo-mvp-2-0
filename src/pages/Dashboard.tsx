
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConditionalAuth } from '@/hooks/useConditionalAuth';
import { useStudents } from '@/hooks/useStudents';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { toast } from '@/hooks/use-toast';
import { User, GraduationCap, Users, Plus, Coins, FileText, TrendingUp, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { userId, loading, isAuthenticated } = useConditionalAuth();
  const { students, loading: studentsLoading, addStudent, refetch } = useStudents();
  const { tokenBalance, monthlyUsage, monthlyLimit } = useTokenSystem(userId);
  const navigate = useNavigate();
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [loading, isAuthenticated, navigate]);

  // Show loading while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAddStudent = async (name: string, englishLevel: string, mainGoal: string) => {
    try {
      const newStudent = await addStudent(name, englishLevel, mainGoal);
      setAddStudentOpen(false);
      toast({
        title: "Student added successfully",
        description: `${name} has been added to your student list.`,
      });
      return newStudent;
    } catch (error: any) {
      toast({
        title: "Error adding student",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleStudentAdded = () => {
    refetch();
  };

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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
              Manage your students and worksheet generation
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
              <CardTitle className="text-sm font-medium">Available Tokens</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenBalance}</div>
              <p className="text-xs text-muted-foreground">
                Worksheets you can generate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyUsage}</div>
              <p className="text-xs text-muted-foreground">
                Worksheets generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Limit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyLimit || 'Unlimited'}</div>
              <p className="text-xs text-muted-foreground">
                Maximum per month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                Total students managed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Students
                </CardTitle>
                <CardDescription>
                  Manage your student profiles for personalized worksheets
                </CardDescription>
              </div>
              <Button onClick={() => setAddStudentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No students yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first student to start creating personalized worksheets
                </p>
                <Button onClick={() => setAddStudentOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Student
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleForceNewWorksheet}>
                Generate New Worksheet
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setAddStudentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Manage Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Available Tokens</span>
                <Badge variant="outline">{tokenBalance}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Students</span>
                <Badge variant="outline">{students.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Month Used</span>
                <Badge variant="outline">{monthlyUsage}</Badge>
              </div>
              <Button className="w-full" variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Add Student Dialog */}
        <AddStudentDialog
          open={addStudentOpen}
          onOpenChange={setAddStudentOpen}
          onStudentAdded={handleStudentAdded}
        />
      </div>
    </div>
  );
};

export default Dashboard;
