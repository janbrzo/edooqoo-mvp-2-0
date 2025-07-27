
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

  if (!isRegisteredUser) {
    navigate('/');
    return null;
  }

  const displayName = userProfile?.first_name || 'Teacher';
  const subscriptionType = profile?.subscription_type || 'Free Demo';

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyWorksheets = worksheets.filter(w => {
    const createdAt = new Date(w.created_at);
    return createdAt >= startOfMonth;
  });

  const thisMonthCount = monthlyWorksheets.length;
  const monthlyLimit = profile?.monthly_worksheet_limit || 0;
  const monthlyUsed = profile?.monthly_worksheets_used || 0;
  const monthlyRemaining = monthlyLimit > 0 ? Math.max(0, monthlyLimit - monthlyUsed) : 0;

  const handleGenerateWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const handleWorksheetOpen = (worksheet: any) => {
    sessionStorage.setItem('restoredWorksheet', JSON.stringify(worksheet));
    navigate('/');
  };

  const getWorksheetTopic = (worksheet: any) => {
    const formData = worksheet.form_data;
    if (formData && typeof formData === 'object') {
      return formData.lessonTopic || formData.lesson_topic || 'General Topic';
    }
    return 'General Topic';
  };

  const getWorksheetGoal = (worksheet: any) => {
    const formData = worksheet.form_data;
    if (formData && typeof formData === 'object') {
      return formData.lessonGoal || formData.lesson_goal || 'General Goal';
    }
    return 'General Goal';
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
              <CardTitle className="text-sm font-medium">Monthly Limit</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyLimit > 0 ? monthlyLimit : 'No limit'}</div>
              <p className="text-xs text-muted-foreground">
                {monthlyLimit > 0 ? `${monthlyRemaining} remaining` : 'Unlimited'}
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
                <div className="space-y-4">
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
                <div className="space-y-4">
                  {worksheets.slice(0, 5).map((worksheet) => (
                    <div key={worksheet.id} className="space-y-2">
                      <div 
                        className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                        onClick={() => handleWorksheetOpen(worksheet)}
                      >
                        <h3 className="font-medium text-sm leading-tight mb-1">
                          {worksheet.title || 'Untitled Worksheet'}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Topic: {getWorksheetTopic(worksheet)} • Goal: {getWorksheetGoal(worksheet)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(worksheet.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
