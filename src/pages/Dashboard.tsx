import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useStudents } from '@/hooks/useStudents';
import { useProfile } from '@/hooks/useProfile';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { userId, loading } = useAnonymousAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { profile, loading: profileLoading } = useProfile();
  const { worksheets, loading: worksheetsLoading } = useWorksheetHistory(userId);
  const navigate = useNavigate();

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

  if (loading || profileLoading) {
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
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.first_name || 'Teacher'}! Manage your students and worksheets
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">Generator</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile">Profile</Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card data-section="students">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Students ({students.length})</CardTitle>
                    <CardDescription>Manage your student list</CardDescription>
                  </div>
                  <AddStudentDialog />
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg mb-2">No students added yet</p>
                    <p className="text-sm">Add your first student to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        onViewHistory={(studentId) => {
                          // Navigate to student-specific worksheet history
                          navigate(`/student-history/${studentId}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-section="worksheets">
              <CardHeader>
                <CardTitle>Recent Worksheets</CardTitle>
                <CardDescription>Your latest generated worksheets</CardDescription>
              </CardHeader>
              <CardContent>
                {worksheetsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : worksheets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg mb-2">No worksheets generated yet</p>
                    <p className="text-sm">Create your first worksheet from the generator!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {worksheets.slice(0, 5).map((worksheet) => (
                      <div key={worksheet.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{worksheet.title || 'Untitled Worksheet'}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(worksheet.created_at).toLocaleDateString()}</span>
                            {worksheet.student_id && (
                              <span>• For student</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            sessionStorage.setItem('openWorksheetId', worksheet.id);
                            navigate('/');
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                    {worksheets.length > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/worksheet-history')}
                      >
                        View All ({worksheets.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Tokens</span>
                  <span className="font-semibold">{profile?.token_balance || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-semibold">{profile?.subscription_type || 'Free Demo'}</span>
                </div>
                <Button className="w-full" variant="outline">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/')}
                >
                  Generate Worksheet
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Scroll to students section
                    document.querySelector('[data-section="students"]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View All Students
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/worksheet-history')}
                >
                  Worksheet History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;