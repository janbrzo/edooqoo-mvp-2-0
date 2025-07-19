
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useProfile } from '@/hooks/useProfile';
import { EditableProfileField } from '@/components/profile/EditableProfileField';
import { toast } from '@/hooks/use-toast';
import { User, Coins, CreditCard, School, Calendar, Zap, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { userId, loading } = useAnonymousAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
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

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      await refetch();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teacher Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and subscription
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/">Generate Worksheet</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <GraduationCap className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableProfileField
                    label="First Name"
                    value={profile?.first_name}
                    placeholder="Not set"
                    onSave={(value) => handleUpdateProfile('first_name', value)}
                  />
                  <EditableProfileField
                    label="Last Name"
                    value={profile?.last_name}
                    placeholder="Not set"
                    onSave={(value) => handleUpdateProfile('last_name', value)}
                  />
                </div>
                <EditableProfileField
                  label="School/Institution"
                  value={profile?.school_institution}
                  placeholder="Not set"
                  onSave={(value) => handleUpdateProfile('school_institution', value)}
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary">
                    {profile?.subscription_type || 'Free Demo'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold">Side-Gig Plan</h4>
                    <p className="text-2xl font-bold">$9.99</p>
                    <p className="text-sm text-muted-foreground">50 worksheets/month</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold">Full-Time Plan</h4>
                    <p className="text-2xl font-bold">$19.99</p>
                    <p className="text-sm text-muted-foreground">200 worksheets/month</p>
                  </div>
                </div>

                <Button className="w-full">
                  Upgrade Plan
                </Button>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">Or buy individual tokens:</p>
                  <Button variant="outline" className="w-full">
                    Buy 10 Tokens - $4.99
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {profile?.token_balance || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Available tokens</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This month used</span>
                    <span>{profile?.monthly_worksheets_used || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly limit</span>
                    <span>{profile?.monthly_worksheet_limit || 'Unlimited'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
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
                  onClick={() => navigate('/dashboard')}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
