import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, User, GraduationCap, Zap, Users, CheckCircle } from 'lucide-react';
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
  const [recommendedPlan, setRecommendedPlan] = useState<'demo' | 'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);
  const [hasManuallyChanged, setHasManuallyChanged] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const fullTimePlans = [
    { tokens: '30', price: 19 },
    { tokens: '60', price: 39 },
    { tokens: '90', price: 59 },
    { tokens: '120', price: 79 }
  ];

  const selectedPlan = fullTimePlans.find(plan => plan.tokens === selectedFullTimePlan);

  const handleRecommendation = (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => {
    const finalPlan = worksheetsNeeded <= 2 ? 'demo' : plan;
    setRecommendedPlan(finalPlan);
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

  // Navigate to auth with selected plan
  const handlePlanSelection = (planType: 'demo' | 'side-gig' | 'full-time') => {
    navigate(`/auth?plan=${planType}`);
  };

  const handleManageSubscription = async () => {
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
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Generator
              </Link>
            </Button>
            {isAuthenticated && (
              <>
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
              </>
            )}
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Balance: {tokenBalance} tokens
              </Badge>
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <PricingCalculator onRecommendation={handleRecommendation} />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Free Demo Plan */}
          <Card className={`relative ${recommendedPlan === 'demo' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'demo' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                  RECOMMENDED FOR YOU
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle className="text-xl">Free Demo</CardTitle>
              </div>
              <CardDescription className="text-base">
                Try it out with limited features
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">2 worksheets to try</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">2 worksheet credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All worksheet types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Basic features</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-10" 
                onClick={() => handlePlanSelection('demo')}
                disabled={isLoading === 'demo'}
              >
                {isLoading === 'demo' ? 'Processing...' : 'Start Free Demo'}
              </Button>
            </CardContent>
          </Card>
          
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
                onClick={() => handlePlanSelection('side-gig')}
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
                onClick={() => handlePlanSelection('full-time')}
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
