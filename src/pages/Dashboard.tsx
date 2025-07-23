
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useProfile } from '@/hooks/useProfile';
import { useStudents } from '@/hooks/useStudents';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { StudentCard } from '@/components/dashboard/StudentCard';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Coins, 
  TrendingUp, 
  Calendar,
  Users,
  Plus,
  FileText,
  Settings,
  Crown
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const { profile, loading: profileLoading } = useProfile();
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { tokenBalance, loading: tokenLoading, hasTokens, isDemo } = useTokenSystem(user?.id);

  // Check if user is properly authenticated and redirect if not
  useEffect(() => {
    if (!authLoading && !isRegisteredUser) {
      navigate('/');
    }
  }, [authLoading, isRegisteredUser, navigate]);

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  // Show loading state
  if (authLoading || profileLoading || tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!isRegisteredUser || !user) {
    return null;
  }

  const displayName = profile?.first_name || 'Teacher';
  const subscriptionType = profile?.subscription_type || 'Free Demo';
  const monthlyLimit = profile?.monthly_worksheet_limit;
  const monthlyUsed = profile?.monthly_worksheets_used || 0;

  const getSubscriptionBadgeVariant = () => {
    switch (subscriptionType) {
      case 'Side-Gig Plan':
        return 'default';
      case 'Full-Time Plan':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getUsagePercentage = () => {
    if (!monthlyLimit || monthlyLimit === 0) return 0;
    return Math.min((monthlyUsed / monthlyLimit) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GraduationCap className="h-8 w-8 mr-3 text-primary" />
              <span>Welcome back, </span>
              <span className={profile?.first_name ? "text-primary ml-2" : "ml-2"}>{displayName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your teaching dashboard overview
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Plan Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge variant={getSubscriptionBadgeVariant()} className="text-sm px-3 py-1">
                {subscriptionType}
              </Badge>
              {subscriptionType !== 'Free Demo' && profile?.subscription_expires_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Renews: {new Date(profile.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Available Tokens Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Available Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{tokenBalance}</div>
              <p className="text-xs text-muted-foreground">
                Tokens for worksheet generation
              </p>
            </CardContent>
          </Card>

          {/* Monthly Usage Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{monthlyUsed}</div>
              {monthlyLimit && (
                <>
                  <p className="text-xs text-muted-foreground">
                    of {monthlyLimit} worksheets
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${getUsagePercentage()}%` }}
                    ></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Students Count Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Students
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{students?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Students managed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="worksheets">Recent Worksheets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Generate worksheets and manage your teaching materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={handleForceNewWorksheet}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New Worksheet
                  </Button>
                  <AddStudentDialog />
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/profile">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Profile & Subscription
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                  <CardDescription>
                    Your current subscription and usage details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge variant={getSubscriptionBadgeVariant()}>
                      {subscriptionType}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Tokens</span>
                    <span className="font-medium">{tokenBalance}</span>
                  </div>

                  {monthlyLimit && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Limit</span>
                      <span className="font-medium">{monthlyLimit}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Used This Month</span>
                    <span className="font-medium">{monthlyUsed}</span>
                  </div>

                  {subscriptionType === 'Free Demo' && (
                    <div className="pt-2">
                      <Button asChild size="sm" className="w-full">
                        <Link to="/profile">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">My Students</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your students and track their progress
                </p>
              </div>
              <AddStudentDialog />
            </div>

            {studentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading students...</p>
              </div>
            ) : students && students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onUpdate={refetchStudents}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first student to start organizing your teaching materials.
                  </p>
                  <AddStudentDialog />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="worksheets" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Worksheets</h3>
              <p className="text-sm text-muted-foreground">
                Your recently generated worksheets and activities
              </p>
            </div>

            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Worksheet history coming soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We're working on adding a feature to track and manage your worksheet history.
                </p>
                <Button onClick={handleForceNewWorksheet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Worksheet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
