
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { useProfile } from '@/hooks/useProfile';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { AddStudentButton } from '@/components/dashboard/AddStudentButton';
import { StudentEditDialog } from '@/components/StudentEditDialog';
import { WorksheetStatsCard } from '@/components/dashboard/WorksheetStatsCard';
import { 
  GraduationCap, 
  Plus, 
  User, 
  FileText, 
  Calendar,
  Settings,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const { profile, loading: profileLoading } = useProfile();
  const { students, loading: studentsLoading, addStudent, updateStudent, deleteStudent } = useStudents();
  const { worksheets, loading: worksheetsLoading } = useWorksheetHistory();
  const { tokenLeft, loading: tokenLoading } = useTokenSystem(user?.id);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const handleUpdateStudent = async (studentData: any) => {
    if (selectedStudent) {
      await updateStudent(selectedStudent.id, studentData);
      setShowEditDialog(false);
      setSelectedStudent(null);
    }
  };

  const handleDeleteStudent = async () => {
    if (selectedStudent) {
      await deleteStudent(selectedStudent.id);
      setShowEditDialog(false);
      setSelectedStudent(null);
    }
  };

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    window.location.href = '/';
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isRegisteredUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile?.first_name || 'Teacher';
  const subscriptionType = profile?.subscription_type || 'Free Demo';
  const totalWorksheetsCreated = profile?.total_worksheets_created || 0;

  // Recent worksheets (last 5)
  const recentWorksheets = worksheets.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GraduationCap className="h-8 w-8 mr-3" />
              Welcome back, <span className={profile?.first_name ? "text-primary ml-2" : "ml-2"}>{displayName}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your students and track your teaching progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleForceNewWorksheet}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Worksheet
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsLoading ? '...' : students.length}</div>
              <p className="text-xs text-muted-foreground">
                Active students
              </p>
            </CardContent>
          </Card>

          {/* UPDATED: Replace Monthly Limit card with Total Worksheets card */}
          <WorksheetStatsCard 
            totalWorksheetsCreated={totalWorksheetsCreated}
            loading={profileLoading}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Left</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenLoading ? '...' : tokenLeft}</div>
              <p className="text-xs text-muted-foreground">
                Available tokens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                <Badge variant="outline">{subscriptionType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current subscription
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="worksheets">Recent Worksheets</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Students</CardTitle>
                    <CardDescription>
                      Manage your student profiles and track their progress
                    </CardDescription>
                  </div>
                  <AddStudentButton onAddStudent={addStudent} />
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted h-32 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No students yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first student to start creating personalized worksheets
                    </p>
                    <AddStudentButton onAddStudent={addStudent} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <StudentCard 
                        key={student.id} 
                        student={student} 
                        onClick={() => handleStudentClick(student)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="worksheets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Worksheets</CardTitle>
                <CardDescription>
                  Your recently generated worksheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {worksheetsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted h-16 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentWorksheets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No worksheets yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your first worksheet to see it here
                    </p>
                    <Button onClick={handleForceNewWorksheet}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Worksheet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentWorksheets.map((worksheet) => (
                      <div key={worksheet.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="font-medium">{worksheet.title || 'Untitled Worksheet'}</h4>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(worksheet.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{worksheet.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student Edit Dialog */}
        <StudentEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          student={selectedStudent}
          onSave={handleUpdateStudent}
          onDelete={handleDeleteStudent}
        />
      </div>
    </div>
  );
};

export default Dashboard;
