
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { useStudents } from "@/hooks/useStudents";
import { useWorksheetHistory } from "@/hooks/useWorksheetHistory";
import { AddStudentButton } from "@/components/dashboard/AddStudentButton";
import { StudentCard } from "@/components/dashboard/StudentCard";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { 
  User, 
  GraduationCap, 
  Users, 
  FileText, 
  Calendar,
  TrendingUp,
  Plus,
  BookOpen,
  Clock,
  Target,
  Coins
} from "lucide-react";

const Dashboard = () => {
  const { user, loading, isRegisteredUser } = useAuthFlow();
  const { tokenLeft, profile } = useTokenSystem(user?.id);
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { worksheets, loading: historyLoading } = useWorksheetHistory();
  const { profile: userProfile } = useProfile();
  const navigate = useNavigate();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("month");

  // Authentication check and redirection
  useEffect(() => {
    if (!loading && !isRegisteredUser) {
      navigate('/');
    }
  }, [loading, isRegisteredUser, navigate]);

  // Show loading state
  if (loading || studentsLoading || historyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isRegisteredUser) {
    navigate('/');
    return null;
  }

  const displayName = userProfile?.first_name || 'Teacher';
  const subscriptionType = profile?.subscription_type || 'Free Demo';

  // Calculate monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyWorksheets = worksheets.filter(w => {
    const createdAt = new Date(w.created_at);
    return createdAt >= startOfMonth;
  });

  const thisMonthCount = monthlyWorksheets.length;
  const totalWorksheetsCreated = profile?.total_worksheets_created || 0;

  const handleGenerateWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const handleWorksheetOpen = (worksheet: any) => {
    sessionStorage.setItem('restoredWorksheet', JSON.stringify(worksheet));
    navigate('/');
  };

  const formatWorksheetTitle = (worksheet: any) => {
    if (worksheet.title) return worksheet.title;
    const formData = worksheet.form_data;
    if (formData?.lessonTopic) return formData.lessonTopic;
    return 'Untitled Worksheet';
  };

  const formatWorksheetDescription = (worksheet: any) => {
    const formData = worksheet.form_data;
    if (!formData) return '';
    
    const parts = [];
    if (formData.lessonTopic) parts.push(`Topic: ${formData.lessonTopic}`);
    if (formData.lessonGoal) parts.push(`Goal: ${formData.lessonGoal}`);
    
    return parts.join(' • ');
  };

  const getStudentNameForWorksheet = (worksheet: any) => {
    if (worksheet.student_id) {
      const student = students.find(s => s.id === worksheet.student_id);
      return student?.name;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GraduationCap className="h-8 w-8 mr-3" />
              <span className={userProfile?.first_name ? "text-primary" : ""}>{displayName}</span>
              <span className="ml-2">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Manage your students and worksheets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Token Left: {tokenLeft}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {subscriptionType}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Left</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenLeft}</div>
              <p className="text-xs text-muted-foreground">
                Available for worksheets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthCount}</div>
              <p className="text-xs text-muted-foreground">
                Worksheets generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Worksheets created</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorksheetsCreated}</div>
              <p className="text-xs text-muted-foreground">
                All time
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
                Active students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Students Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </CardTitle>
                <AddStudentButton 
                  size="sm" 
                  onStudentAdded={refetchStudents}
                />
              </div>
              <CardDescription>
                Manage your students and generate worksheets for them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No students yet</p>
                  <AddStudentButton onStudentAdded={refetchStudents} />
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <StudentCard 
                      key={student.id} 
                      student={student}
                      onOpenWorksheet={handleWorksheetOpen}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Worksheets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Worksheets
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={handleGenerateWorksheet}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Generate
                </Button>
              </div>
              <CardDescription>
                Your recently generated worksheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worksheets.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No worksheets yet</p>
                  <Button onClick={handleGenerateWorksheet}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First Worksheet
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {worksheets.slice(0, 5).map((worksheet) => {
                    const studentName = getStudentNameForWorksheet(worksheet);
                    return (
                      <div
                        key={worksheet.id}
                        className="p-4 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors border border-border/50"
                        onClick={() => handleWorksheetOpen(worksheet)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-base">
                              {formatWorksheetTitle(worksheet)}
                              {studentName && (
                                <span className="text-primary ml-2">
                                  for {studentName}
                                </span>
                              )}
                            </h3>
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          {formatWorksheetDescription(worksheet) && (
                            <p className="text-sm text-muted-foreground">
                              {formatWorksheetDescription(worksheet)}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{format(new Date(worksheet.created_at), 'MMM dd, yyyy')}</span>
                            <span className="mx-2">•</span>
                            <span>{format(new Date(worksheet.created_at), 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
