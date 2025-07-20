
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, User, GraduationCap, Zap, Users } from 'lucide-react';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PricingCalculator } from '@/components/PricingCalculator';

const Pricing = () => {
  const { userId } = useAnonymousAuth();
  const { tokenBalance } = useTokenSystem(userId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState('30');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);
  const [hasManuallyChanged, setHasManuallyChanged] = useState(false);

  const fullTimePlans = [
    { tokens: '30', price: 19 },
    { tokens: '60', price: 39 },
    { tokens: '90', price: 59 },
    { tokens: '120', price: 79 }
  ];

  const selectedPlan = fullTimePlans.find(plan => plan.tokens === selectedFullTimePlan);

  const handleRecommendation = (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => {
    setRecommendedPlan(plan);
    setRecommendedWorksheets(worksheetsNeeded);
    
    // Only auto-select if user hasn't manually changed the plan
    if (plan === 'full-time' && !hasManuallyChanged) {
      const recommendedPlanOption = fullTimePlans.find(p => parseInt(p.tokens) >= worksheetsNeeded);
      if (recommendedPlanOption) {
        setSelectedFullTimePlan(recommendedPlanOption.tokens);
      }
    }
  };

  const handleManualPlanChange = (value: string) => {
    setSelectedFullTimePlan(value);
    setHasManuallyChanged(true);
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

  const handleSubscribe = async (planType: 'side-gig' | 'full-time') => {
    // Check user authentication first
    const canSubscribe = await checkUserForSubscription();
    if (!canSubscribe) return;

    setIsLoading(planType);
    try {
      const planData = planType === 'side-gig' 
        ? { name: 'Side-Gig Plan', price: 9, tokens: 15 }
        : { name: `Full-Time Plan (${selectedFullTimePlan} worksheets)`, price: selectedPlan?.price || 19, tokens: parseInt(selectedFullTimePlan) };

      console.log('Attempting to create subscription:', { planType, planData });

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: planType,
          monthlyLimit: planData.tokens,
          price: planData.price,
          planName: planData.name
        }
      });

      if (error) {
        console.error('Subscription error details:', error);
        
        // Handle specific error types
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
        console.log('Redirecting to Stripe checkout:', data.url);
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
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/dashboard" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
          </div>
          
          {userId && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Balance: {tokenBalance} tokens
              </Badge>
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <PricingCalculator onRecommendation={handleRecommendation} />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Side-Gig Plan */}
          <Card className={`relative ${recommendedPlan === 'side-gig' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'side-gig' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                  RECOMMENDED FOR YOU
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Side-Gig Plan</CardTitle>
              </div>
              <CardDescription className="text-base">
                Perfect for part-time English teachers
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">15 worksheets / month</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">15 monthly worksheet credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All worksheet types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email support</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-10" 
                onClick={() => handleSubscribe('side-gig')}
                disabled={isLoading === 'side-gig'}
              >
                {isLoading === 'side-gig' ? 'Processing...' : 'Choose Side-Gig'}
              </Button>
            </CardContent>
          </Card>

          {/* Full-Time Plan */}
          <Card className={`relative ${recommendedPlan === 'full-time' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'full-time' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                  RECOMMENDED FOR YOU
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Full-Time Plan</CardTitle>
              </div>
              <CardDescription className="text-base">
                For professional English teachers
              </CardDescription>
              
              {/* Dropdown for token selection */}
              <div className="mt-4 space-y-3">
                <Select value={selectedFullTimePlan} onValueChange={handleManualPlanChange}>
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
                
                <div className="text-center">
                  <span className="text-4xl font-bold">${selectedPlan?.price}</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <div>
                  <Badge variant="secondary">{selectedFullTimePlan} worksheets / month</Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{selectedFullTimePlan} monthly worksheet credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All worksheet types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority email support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Advanced analytics</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-10 bg-primary hover:bg-primary/90" 
                onClick={() => handleSubscribe('full-time')}
                disabled={isLoading === 'full-time'}
              >
                {isLoading === 'full-time' ? 'Processing...' : 'Choose Full-Time'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
