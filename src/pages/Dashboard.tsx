
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useProfile } from '@/hooks/useProfile';
import { useStudents } from '@/hooks/useStudents';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  Coins, 
  UserPlus, 
  GraduationCap, 
  Calendar,
  TrendingUp,
  Settings,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading, isRegisteredUser } = useAuthFlow();
  const { profile, loading: profileLoading } = useProfile();
  const { students, loading: studentsLoading } = useStudents();
  const { tokenBalance, loading: tokenLoading, hasTokens } = useTokenSystem(user?.id);
  const { toast } = useToast();

  // Show loading spinner while checking auth
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

  // Don't render anything if not authenticated - user will be redirected
  if (!isRegisteredUser) {
    return null;
  }

  const displayName = profile?.first_name || 'Teacher';
  const subscriptionType = profile?.subscription_type || 'Free Demo';
  const monthlyLimit = profile?.monthly_worksheet_limit;
  const monthlyUsed = profile?.monthly_worksheets_used || 0;

  const getUsageProgress = () => {
    if (subscriptionType === 'Free Demo' || !monthlyLimit) return 0;
    return (monthlyUsed / monthlyLimit) * 100;
  };

  const getRenewalInfo = () => {
    if (subscriptionType === 'Free Demo') return null;
    if (profile?.subscription_expires_at) {
      const renewalDate = new Date(profile.subscription_expires_at);
      return renewalDate.toLocaleDateString();
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GraduationCap className="h-8 w-8 mr-3" />
              Welcome back, <span className="text-primary ml-2">{displayName}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your students and track your worksheet usage
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/">
                <FileText className="h-4 w-4 mr-2" />
                Generate Worksheet
              </Link>
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
          {/* Current Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {subscriptionType}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary">Current Plan</div>
              {getRenewalInfo() && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews {getRenewalInfo()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Token Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary">
                {tokenLoading ? '...' : tokenBalance}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasTokens ? 'Available for use' : 'No tokens remaining'}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Usage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary">
                {monthlyUsed}
              </div>
              <p className="text-sm text-muted-foreground">
                {monthlyLimit ? `of ${monthlyLimit} worksheets` : 'worksheets generated'}
              </p>
              {monthlyLimit && (
                <Progress value={getUsageProgress()} className="mt-2" />
              )}
            </CardContent>
          </Card>

          {/* Students Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-primary">
                {studentsLoading ? '...' : students.length}
              </div>
              <p className="text-sm text-muted-foreground">
                {students.length === 1 ? 'student' : 'students'} managed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Students
                  </CardTitle>
                  <CardDescription>
                    Manage your students and create personalized worksheets
                  </CardDescription>
                </div>
                <AddStudentDialog>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </AddStudentDialog>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No students added yet</p>
                  <AddStudentDialog>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Student
                    </Button>
                  </AddStudentDialog>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <StudentCard key={student.id} student={student} />
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
