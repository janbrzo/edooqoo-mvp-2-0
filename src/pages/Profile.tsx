import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useProfile } from '@/hooks/useProfile';
import { EditableProfileField } from '@/components/profile/EditableProfileField';
import { toast } from '@/hooks/use-toast';
import { User, Coins, CreditCard, Calendar, Zap, GraduationCap, Users, Mail } from 'lucide-react';

const Profile = () => {
  const { user, loading, isRegisteredUser } = useAuthFlow();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState('30');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Check if user is properly authenticated (not anonymous) and redirect immediately
  useEffect(() => {
    if (!loading && !isRegisteredUser) {
      navigate('/');
    }
  }, [loading, isRegisteredUser, navigate]);

  // Auto-refresh profile when returning from payment (e.g., URL contains success params)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true' || urlParams.get('session_id')) {
      // User returned from successful payment, show success message
      toast({
        title: "Payment successful!",
        description: "Your subscription has been updated. It may take a few moments to reflect.",
      });
      
      // Auto-sync subscription after payment
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('check-subscription-status');
          await refetch();
        } catch (error) {
          console.error('Error auto-syncing subscription:', error);
        }
      }, 3000);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [refetch]);

  const fullTimePlans = [
    { tokens: '30', price: 19 },
    { tokens: '60', price: 39 },
    { tokens: '90', price: 59 },
    { tokens: '120', price: 79 }
  ];

  const selectedPlan = fullTimePlans.find(plan => plan.tokens === selectedFullTimePlan);

  // Get current subscription details
  const getCurrentSubscriptionInfo = () => {
    if (!profile || !profile.subscription_type) {
      return { type: 'free', plan: null, tokens: 0 };
    }

    const subscriptionType = profile.subscription_type;
    
    if (subscriptionType === 'Side-Gig Plan') {
      return { type: 'side-gig', plan: 'side-gig', tokens: 15 };
    }
    
    if (subscriptionType.includes('Full-Time Plan')) {
      const match = subscriptionType.match(/\((\d+) worksheets\)/);
      const tokens = match ? parseInt(match[1]) : 30;
      return { type: 'full-time', plan: 'full-time', tokens };
    }
    
    return { type: 'free', plan: null, tokens: 0 };
  };

  const currentSubscription = getCurrentSubscriptionInfo();

  // Check if a plan button should be disabled
  const isPlanDisabled = (planType: string, tokens?: number) => {
    const current = getCurrentSubscriptionInfo();
    
    if (planType === 'side-gig') {
      return current.type === 'side-gig' || current.type === 'full-time'; // Disable if has side-gig or full-time
    }
    
    if (planType === 'full-time' && tokens) {
      if (current.type === 'free') return false; // Can upgrade from free
      if (current.type === 'side-gig') return false; // Can upgrade from side-gig
      if (current.type === 'full-time') {
        return tokens <= current.tokens; // Can only upgrade to higher token count
      }
    }
    
    return false;
  };

  // Calculate upgrade pricing
  const calculateUpgradePricing = (targetPlan: string, targetTokens?: number) => {
    const current = getCurrentSubscriptionInfo();
    
    if (current.type === 'free') {
      return null;
    }

    let currentPrice = 0;
    let targetPrice = 0;

    if (current.type === 'side-gig') {
      currentPrice = 9;
    } else if (current.type === 'full-time') {
      const currentPlan = fullTimePlans.find(p => parseInt(p.tokens) === current.tokens);
      currentPrice = currentPlan?.price || 19;
    }

    if (targetPlan === 'side-gig') {
      targetPrice = 9;
    } else if (targetPlan === 'full-time' && targetTokens) {
      const targetPlanData = fullTimePlans.find(p => parseInt(p.tokens) === targetTokens);
      targetPrice = targetPlanData?.price || 19;
    }

    const priceDifference = targetPrice - currentPrice;
    const tokenDifference = (targetTokens || 15) - current.tokens;

    return priceDifference > 0 ? { priceDifference, tokenDifference } : null;
  };

  const getButtonText = (planType: string, tokens?: number) => {
    const current = getCurrentSubscriptionInfo();
    const upgradeInfo = calculateUpgradePricing(planType, tokens);

    if (isPlanDisabled(planType, tokens)) {
      return 'Current Plan';
    }

    if (upgradeInfo) {
      return `Upgrade (+$${upgradeInfo.priceDifference})`;
    }

    if (planType === 'side-gig') return 'Upgrade to Side-Gig';
    return 'Upgrade to Full-Time';
  };

  // Check if user has proper authentication for subscription
  const checkUserForSubscription = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to a plan.",
          variant: "destructive"
        });
        navigate('/auth');
        return false;
      }

      if (!user.email) {
        toast({
          title: "Email Required",
          description: "Please complete your registration with a valid email address to subscribe.",
          variant: "destructive"
        });
        navigate('/auth');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking user authentication:', error);
      toast({
        title: "Authentication Error",
        description: "Please sign in again to continue.",
        variant: "destructive"
      });
      navigate('/auth');
      return false;
    }
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

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

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

  const handleForceNewWorksheet = () => {
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const handleSubscribe = async (planType: 'side-gig' | 'full-time') => {
    const canSubscribe = await checkUserForSubscription();
    if (!canSubscribe) return;

    setIsLoading(planType);
    try {
      const targetTokens = planType === 'side-gig' ? 15 : parseInt(selectedFullTimePlan);
      const planData = planType === 'side-gig' 
        ? { name: 'Side-Gig Plan', price: 9, tokens: 15 }
        : { name: `Full-Time Plan (${selectedFullTimePlan} worksheets)`, price: selectedPlan?.price || 19, tokens: parseInt(selectedFullTimePlan) };

      const upgradeInfo = calculateUpgradePricing(planType, targetTokens);
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: planType,
          monthlyLimit: planData.tokens,
          price: upgradeInfo?.priceDifference || planData.price,
          planName: planData.name,
          isUpgrade: !!upgradeInfo,
          additionalTokens: upgradeInfo?.tokenDifference || 0
        }
      });

      if (error) {
        console.error('Subscription error details:', error);
        
        if (error.message?.includes('requiresRegistration') || error.message?.includes('Email required')) {
          toast({
            title: "Registration Required",
            description: "Please complete your registration with a valid email address to subscribe.",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }
        
        if (error.message?.includes('Authentication')) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to subscribe to a plan.",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      let errorMessage = "Failed to create subscription. Please try again.";
      let shouldRedirectToAuth = false;

      if (error.message?.includes('Authentication') || error.message?.includes('sign in')) {
        errorMessage = "Please sign in to subscribe to a plan.";
        shouldRedirectToAuth = true;
      } else if (error.message?.includes('Email required') || error.message?.includes('registration')) {
        errorMessage = "Please complete your registration with a valid email address.";
        shouldRedirectToAuth = true;
      } else if (error.message?.includes('Payment service not configured')) {
        errorMessage = "Payment service is currently unavailable. Please contact support.";
      }

      toast({
        title: "Subscription Error",
        description: errorMessage,
        variant: "destructive"
      });

      if (shouldRedirectToAuth) {
        navigate('/auth');
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    // Check user authentication first
    const canManage = await checkUserForSubscription();
    if (!canManage) return;

    try {
      console.log('Attempting to open customer portal...');
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Portal error details:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening customer portal:', data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive"
      });
    }
  };

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

  const tokenBalance = profile?.token_balance || 0;
  const monthlyUsed = profile?.monthly_worksheets_used || 0;
  const monthlyAvailable = monthlyLimit ? Math.max(0, monthlyLimit - monthlyUsed) : 0;
  const tokenLeft = tokenBalance + monthlyAvailable;

  const getMonthlyLimitDisplay = () => {
    if (subscriptionType === 'Free Demo') return 'Not applicable';
    return monthlyLimit || 'Not set';
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
              <User className="h-8 w-8 mr-3" />
              <span className={profile?.first_name ? "text-primary" : ""}>{displayName}</span>
              {<span className="ml-2">Profile</span>}
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and subscription
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleForceNewWorksheet}>
              Generate Worksheet
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <GraduationCap className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Two Column Layout - Personal Info and Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email || profile?.email || 'Not available'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your email address associated with your account.
                  </p>
                </div>
                <EditableProfileField
                  label="School/Institution"
                  value={profile?.school_institution}
                  placeholder="Not set"
                  onSave={(value) => handleUpdateProfile('school_institution', value)}
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-base flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions and Token Details Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleForceNewWorksheet}
                    size="sm"
                  >
                    Generate Worksheet
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    size="sm"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleSignOut}
                    size="sm"
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              {/* Token Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5" />
                    Token Usage Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token Left</span>
                      <span className="font-medium">{tokenLeft}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchased tokens</span>
                      <span className="font-medium">{tokenBalance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This month used</span>
                      <span className="font-medium">{monthlyUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly limit</span>
                      <span className="font-medium">{getMonthlyLimitDisplay()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plan & Billing
                </CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="outline" className="font-semibold text-base px-3 py-1">
                    {subscriptionType}
                  </Badge>
                </div>
                
                {subscriptionType !== 'Free Demo' && (
                  <div className="space-y-2">
                    {getRenewalInfo() && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Renews</span>
                        <span className="text-sm font-medium">{getRenewalInfo()}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm" 
                        onClick={handleManageSubscription}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Upgrade Buttons Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-semibold text-sm">Side-Gig Plan</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">15 worksheets/month</p>
                    <div className="mb-3">
                      <p className="text-2xl font-bold">$9</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleSubscribe('side-gig')}
                      disabled={isLoading === 'side-gig' || isPlanDisabled('side-gig')}
                    >
                      {isLoading === 'side-gig' ? 'Processing...' : getButtonText('side-gig')}
                    </Button>
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-semibold text-sm">Full-Time Plan</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Choose worksheets/month</p>
                    
                    <div className="mb-3">
                      <Select value={selectedFullTimePlan} onValueChange={setSelectedFullTimePlan}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fullTimePlans.map((plan) => (
                            <SelectItem key={plan.tokens} value={plan.tokens}>
                              {plan.tokens} worksheets/month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-2xl font-bold">${selectedPlan?.price}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleSubscribe('full-time')}
                      disabled={isLoading === 'full-time' || isPlanDisabled('full-time', parseInt(selectedFullTimePlan))}
                    >
                      {isLoading === 'full-time' ? 'Processing...' : getButtonText('full-time', parseInt(selectedFullTimePlan))}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
