
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, User, Briefcase, Zap, Users } from 'lucide-react';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PricingCalculator } from '@/components/PricingCalculator';

const Pricing = () => {
  const { userId } = useAnonymousAuth();
  const { tokenBalance } = useTokenSystem(userId);
  const { toast } = useToast();
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState('60');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('full-time');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(60);

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
    
    // Auto-select the recommended Full-Time plan
    if (plan === 'full-time') {
      const recommendedPlanOption = fullTimePlans.find(p => parseInt(p.tokens) >= worksheetsNeeded);
      if (recommendedPlanOption) {
        setSelectedFullTimePlan(recommendedPlanOption.tokens);
      }
    }
  };

  const handleSubscribe = async (planType: 'side-gig' | 'full-time') => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(planType);
    try {
      const planData = planType === 'side-gig' 
        ? { name: 'Side-Gig Plan', price: 9, tokens: 15 }
        : { name: `Full-Time Plan (${selectedFullTimePlan} worksheets)`, price: selectedPlan?.price || 19, tokens: parseInt(selectedFullTimePlan) };

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: planType,
          monthlyLimit: planData.tokens,
          price: planData.price,
          planName: planData.name
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!userId) return;

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/dashboard" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
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
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Side-Gig Plan */}
          <Card className={`relative ${recommendedPlan === 'side-gig' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'side-gig' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                  RECOMMENDED FOR YOU
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Side-Gig Plan</CardTitle>
              </div>
              <CardDescription className="text-lg">
                Perfect for part-time English teachers
              </CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold">$9</span>
                <span className="text-xl text-muted-foreground">/month</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">15 worksheets / month</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>15 monthly worksheet credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>All worksheet types</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Student management</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Export to HTML & PDF</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Email support</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 text-lg" 
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
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                  RECOMMENDED FOR YOU
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Full-Time Plan</CardTitle>
              </div>
              <CardDescription className="text-lg">
                For professional English teachers
              </CardDescription>
              
              {/* Dropdown for token selection */}
              <div className="mt-6 space-y-4">
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
                
                <div className="text-center">
                  <span className="text-5xl font-bold">${selectedPlan?.price}</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <div>
                  <Badge variant="secondary">{selectedFullTimePlan} worksheets / month</Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{selectedFullTimePlan} monthly worksheet credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>All worksheet types</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Unlimited student management</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Export to HTML & PDF</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Priority email support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Advanced analytics</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90" 
                onClick={() => handleSubscribe('full-time')}
                disabled={isLoading === 'full-time'}
              >
                {isLoading === 'full-time' ? 'Processing...' : 'Choose Full-Time'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-left">
            <div>
              <h4 className="font-semibold mb-2">What happens when I reach my monthly limit?</h4>
              <p className="text-muted-foreground">
                You'll see a notification when you're close to your limit. Once reached, you can upgrade your plan or wait for the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time through the subscription management portal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Do unused worksheets roll over?</h4>
              <p className="text-muted-foreground">
                Worksheet credits reset each month and don't roll over to the next billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
