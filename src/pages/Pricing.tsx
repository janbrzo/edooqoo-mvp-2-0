
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, User, GraduationCap, Zap, Users, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PricingCalculator } from '@/components/PricingCalculator';

const Pricing = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const { tokenLeft, profile } = useTokenSystem(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState('30');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);
  const [hasManuallyChanged, setHasManuallyChanged] = useState(false);
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);

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
    if (!isRegisteredUser) return false;
    
    const current = getCurrentSubscriptionInfo();
    
    if (planType === 'free') {
      return current.type !== 'free'; // Disable if already has paid plan
    }
    
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
      // No prorating for free users
      return null;
    }

    let currentPrice = 0;
    let targetPrice = 0;

    // Get current price
    if (current.type === 'side-gig') {
      currentPrice = 9;
    } else if (current.type === 'full-time') {
      const currentPlan = fullTimePlans.find(p => parseInt(p.tokens) === current.tokens);
      currentPrice = currentPlan?.price || 19;
    }

    // Get target price
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

  const faqItems = [
    {
      question: "What's the difference between tokens and monthly worksheets?",
      answer: "Monthly worksheets are included in your subscription plan and reset each month. Tokens are purchased separately and never expire. The system uses purchased tokens first, then monthly worksheets. Your 'Token Left' shows both combined. Unused monthly worksheets carry forward to the next month."
    },
    {
      question: "What happens to unused monthly worksheets?",
      answer: "Unused monthly worksheets automatically roll over to the next month and are added to your token balance. This means you never lose worksheets you've paid for - they carry forward as permanent tokens you can use anytime."
    },
    {
      question: "Can I use the app without a subscription?",
      answer: "Yes! You get 2 free tokens when you sign up. You can also purchase additional tokens anytime without a subscription. Demo users (not logged in) have limited access to try the worksheet generator."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime through your profile page using the 'Manage Subscription' button, which opens the Stripe Customer Portal. Your subscription remains active until the end of your current billing period."
    },
    {
      question: "What worksheet types are available?",
      answer: "All plans include access to all worksheet types: vocabulary sheets, grammar exercises, reading comprehension, fill-in-the-blanks, multiple choice, matching exercises, and dialogue practice."
    },
    {
      question: "Can I export worksheets to PDF?",
      answer: "Yes, all users can export worksheets to HTML and PDF formats. This feature is available for all plans including the free tokens."
    },
    {
      question: "Is there a limit on students I can manage?",
      answer: "No, there's no limit on the number of students you can add to your account. The student management feature is available for all registered users."
    },
    {
      question: "How long does it take to generate a worksheet?",
      answer: "Worksheet generation typically takes 30-60 seconds. The system uses AI to create custom content based on your specifications like English level, lesson topic, and learning goals."
    },
    {
      question: "Can I upgrade my plan during the month?",
      answer: "Yes! When you upgrade during your billing period, you'll only pay the difference between your current plan and the new plan. The additional worksheets are added to your account immediately."
    },
    {
      question: "What happens when I upgrade my subscription?",
      answer: "When upgrading, you pay only the price difference between plans, and the additional worksheets are added to your monthly limit immediately. Your billing date remains the same."
    }
  ];

  const handleRecommendation = (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => {
    setRecommendedPlan(plan);
    setRecommendedWorksheets(worksheetsNeeded);
    
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

  const handleSubscribe = async (planType: 'side-gig' | 'full-time' | 'free') => {
    if (!isRegisteredUser) {
      navigate('/login');
      return;
    }

    if (planType === 'free') {
      toast({
        title: "Already registered",
        description: "You already have a free demo account with 2 tokens.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(planType);
    try {
      const targetTokens = planType === 'side-gig' ? 15 : parseInt(selectedFullTimePlan);
      const planData = planType === 'side-gig' 
        ? { name: 'Side-Gig Plan', price: 9, tokens: 15 }
        : { name: `Full-Time Plan (${selectedFullTimePlan} worksheets)`, price: selectedPlan?.price || 19, tokens: parseInt(selectedFullTimePlan) };

      // Check for upgrade pricing
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

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getButtonText = (planType: string, tokens?: number) => {
    if (!isRegisteredUser) {
      if (planType === 'free') return 'Get Started Free';
      if (planType === 'side-gig') return 'Choose Side-Gig';
      return 'Choose Full-Time';
    }

    const current = getCurrentSubscriptionInfo();
    const upgradeInfo = calculateUpgradePricing(planType, tokens);

    if (isPlanDisabled(planType, tokens)) {
      if (planType === 'free') return 'Current Plan';
      if (planType === 'side-gig') return 'Current Plan';
      if (planType === 'full-time') return 'Current Plan';
    }

    if (upgradeInfo) {
      return `Upgrade (+$${upgradeInfo.priceDifference})`;
    }

    if (planType === 'free') return 'Get Started Free';
    if (planType === 'side-gig') return 'Choose Side-Gig';
    return 'Choose Full-Time';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            {isRegisteredUser && (
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
            {!isRegisteredUser && (
              <Button asChild variant="outline">
                <Link to="/login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
          
          {isRegisteredUser && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Balance: {tokenLeft} tokens
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <PricingCalculator onRecommendation={handleRecommendation} />

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          
          {/* Free Demo Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Free Demo</CardTitle>
              </div>
              <CardDescription className="text-base">
                Try our worksheet generator
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-lg text-muted-foreground">/forever</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">2 free tokens + limited access</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">2 free tokens on signup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All worksheet types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Basic student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-10" 
                onClick={() => handleSubscribe('free')}
                disabled={isPlanDisabled('free')}
                asChild={!isRegisteredUser}
              >
                {!isRegisteredUser ? (
                  <Link to="/signup">Get Started Free</Link>
                ) : (
                  getButtonText('free')
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Side-Gig Plan */}
          <Card className={`relative ${recommendedPlan === 'side-gig' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'side-gig' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold whitespace-nowrap">
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
                  <span className="text-sm">Unused credits roll over</span>
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
                disabled={isLoading === 'side-gig' || isPlanDisabled('side-gig')}
              >
                {isLoading === 'side-gig' ? 'Processing...' : getButtonText('side-gig')}
              </Button>
            </CardContent>
          </Card>

          {/* Full-Time Plan */}
          <Card className={`relative ${recommendedPlan === 'full-time' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'full-time' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold whitespace-nowrap">
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
                  <span className="text-sm">Unused credits roll over</span>
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
                disabled={isLoading === 'full-time' || isPlanDisabled('full-time', parseInt(selectedFullTimePlan))}
              >
                {isLoading === 'full-time' ? 'Processing...' : getButtonText('full-time', parseInt(selectedFullTimePlan))}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>
              Everything you need to know about our worksheet generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Collapsible key={index} className="border rounded-lg">
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50"
                    onClick={() => toggleFaqItem(index)}
                  >
                    <span className="font-medium">{item.question}</span>
                    {openFaqItems.includes(index) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                    {item.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pricing;
