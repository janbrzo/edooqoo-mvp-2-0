
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
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Worksheets</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
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

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Students */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Students
                  </CardTitle>
                </div>
                <AddStudentDialog onStudentAdded={handleStudentAdded} />
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
                  <AddStudentDialog onStudentAdded={handleStudentAdded} />
                </div>
              ) : (
                <div className="space-y-4">
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

          {/* Right Column - Recent Worksheets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Worksheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample worksheet entry */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Booking a Ski Trip</h3>
                    <Badge variant="outline">A1/A2</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    for FIRST
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Topic: Booking a ski trip for a group of friends • Goal: Asking for package deals and negotiating prices
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>July 22nd, 2025 at 12:57 AM</span>
                    <span>Generated in 144s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
