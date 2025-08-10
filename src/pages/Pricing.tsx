import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, User, GraduationCap, Zap, Users, Gift, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { usePlanLogic } from '@/hooks/usePlanLogic';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PricingCalculator } from '@/components/PricingCalculator';
import { ConfirmDowngradeDialog } from '@/components/ConfirmDowngradeDialog';

const Pricing = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const { tokenLeft, profile } = useTokenSystem(user?.id);
  const { currentPlan, plans, canUpgradeTo, getUpgradePrice, getUpgradeTokens, getRecommendedFullTimePlan } = usePlanLogic(profile?.subscription_type);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState(getRecommendedFullTimePlan());
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);
  const [hasManuallyChanged, setHasManuallyChanged] = useState(false);
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);

  // NEW: Downgrade dialog state
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [pendingDowngrade, setPendingDowngrade] = useState<{
    planType: 'side-gig' | 'full-time';
    targetPlan: any;
  } | null>(null);

  const fullTimePlans = [
    { tokens: '30', price: 19 },
    { tokens: '60', price: 39 },
    { tokens: '90', price: 59 },
    { tokens: '120', price: 79 }
  ];

  const selectedPlan = fullTimePlans.find(plan => plan.tokens === selectedFullTimePlan);

  useEffect(() => {
    if (!hasManuallyChanged) {
      setSelectedFullTimePlan(getRecommendedFullTimePlan());
    }
  }, [getRecommendedFullTimePlan, hasManuallyChanged]);

  const faqItems = [
    {
      question: "How does payment work for anonymous users vs. logged-in users?",
      answer: "Anonymous users can generate worksheets for free but need to pay a one-time $1 fee to download them. This unlocks downloads for about 24 hours. Logged-in users with active subscriptions automatically have downloads unlocked as part of their plan."
    },
    {
      question: "What do I get for the $1 download payment?",
      answer: "The $1 payment unlocks both the Student and Teacher versions of your worksheet as HTML files. You can download them multiple times during your session (approximately 24 hours). After the session expires, you'll need to pay again for new downloads."
    },
    {
      question: "How are tokens and monthly worksheets consumed?",
      answer: "The system prioritizes using your monthly worksheet allowance first, then uses available tokens (purchased or rollover). This ensures you get maximum value from your subscription before consuming additional tokens."
    },
    {
      question: "What happens to unused monthly worksheets?",
      answer: "Great news! Unused monthly worksheets now carry forward to the next month as rollover tokens. These rollover tokens are used after your purchased tokens but before your new monthly worksheets. This means you never lose unused worksheets!"
    },
    {
      question: "Can I use the app without a subscription?",
      answer: "Yes! You get 2 free tokens when you sign up. You can also purchase additional tokens anytime without a subscription. Anonymous users (not logged in) can generate worksheets for free but need to pay $1 to download them."
    },
    {
      question: "Do I need to confirm my email after signing up?",
      answer: "Yes, you need to confirm your email address by clicking the link sent to your email after registration. This is required for security and to access all features of your account."
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
      answer: "Yes, all users can export worksheets to HTML and PDF formats. HTML format is recommended as it provides the best quality and works offline. PDF export is also available for convenience."
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
      question: "What happens if I run out of tokens?",
      answer: "When you run out of tokens and monthly worksheets, you can either upgrade your subscription plan for more monthly worksheets or purchase additional tokens. Your account and saved data remain accessible regardless of your token balance."
    },
    {
      question: "Do you offer promotional codes or discounts?",
      answer: "Promotional codes and special offers may be available from time to time. Check our website announcements or contact support for current promotions."
    },
    {
      question: "Can I edit worksheets after they're generated?",
      answer: "Yes! All generated worksheets are fully editable. You can modify any text, add or remove exercises, and customize the content to perfectly match your teaching needs before downloading."
    },
    {
      question: "How can I verify my payment went through?",
      answer: "After successful payment through Stripe, you'll be redirected to a confirmation page, and download buttons will immediately unlock. For subscription payments, you'll also receive an email confirmation from Stripe."
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

  // NEW: Handle downgrade confirmation
  const handleDowngradeConfirm = async () => {
    if (!pendingDowngrade) return;
    
    setIsLoading(pendingDowngrade.planType);
    try {
      const { planType, targetPlan } = pendingDowngrade;
      
      console.log('Attempting downgrade:', { planType, targetPlan });

      const { data, error } = await supabase.functions.invoke('downgrade-subscription', {
        body: {
          planType: planType,
          monthlyLimit: targetPlan.tokens || targetPlan.monthlyLimit,
          price: targetPlan.price,
          planName: targetPlan.name
        }
      });

      if (error) {
        console.error('Downgrade error details:', error);
        throw error;
      }

      if (data?.success) {
        console.log('Downgrade successful:', data);
        toast({
          title: "Plan Changed Successfully!",
          description: `Your subscription has been changed to ${data.newPlan}. The change is effective immediately.`,
        });

        // Refresh profile data
        await supabase.functions.invoke('check-subscription-status');
        // Note: no refetch here since this is pricing page, profile will refresh when user navigates
      } else {
        throw new Error(data?.error || 'Downgrade failed');
      }
    } catch (error: any) {
      console.error('Downgrade error:', error);
      toast({
        title: "Plan Change Error",
        description: error.message || "Failed to change plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
      setShowDowngradeDialog(false);
      setPendingDowngrade(null);
    }
  };

  const handleSubscribe = async (planType: 'side-gig' | 'full-time') => {
    if (!isRegisteredUser) {
      toast({
        title: "Registration Required",
        description: "Please sign up to subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/signup');
      return;
    }

    setIsLoading(planType);
    try {
      const planData = planType === 'side-gig' 
        ? { name: 'Side-Gig Plan', price: 9, tokens: 15 }
        : { name: `Full-Time Plan (${selectedFullTimePlan} worksheets)`, price: selectedPlan?.price || 19, tokens: parseInt(selectedFullTimePlan) };

      const targetPlan = planType === 'side-gig' 
        ? plans.find(p => p.id === 'side-gig')
        : plans.find(p => p.tokens === parseInt(selectedFullTimePlan) && p.type === 'full-time');

      if (!targetPlan) {
        throw new Error('Target plan not found');
      }

      const upgradePrice = getUpgradePrice(targetPlan);
      const upgradeTokens = getUpgradeTokens(targetPlan);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: planType,
          monthlyLimit: planData.tokens,
          price: upgradePrice,
          planName: planData.name,
          upgradeTokens: upgradeTokens,
          isUpgrade: currentPlan.type !== 'free'
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
    if (!isRegisteredUser) {
      toast({
        title: "Registration Required",
        description: "Please sign up to manage subscriptions.",
        variant: "destructive"
      });
      navigate('/signup');
      return;
    }

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

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const sideGigPlan = plans.find(p => p.id === 'side-gig');
  const canUpgradeToSideGig = sideGigPlan ? canUpgradeTo(sideGigPlan) : false;
  const sideGigUpgradePrice = sideGigPlan ? getUpgradePrice(sideGigPlan) : 0;
  const isSideGigLowerPlan = currentPlan.type === 'full-time' && !!sideGigPlan;

  const fullTimePlan = plans.find(p => p.tokens === parseInt(selectedFullTimePlan) && p.type === 'full-time');
  const canUpgradeToFullTime = fullTimePlan ? canUpgradeTo(fullTimePlan) : false;
  const fullTimeUpgradePrice = fullTimePlan ? getUpgradePrice(fullTimePlan) : 0;

  const isFullTimeDowngrade = fullTimePlan && currentPlan.type === 'full-time' && fullTimePlan.tokens < currentPlan.tokens;

  const getButtonText = (planType: 'free' | 'side-gig' | 'full-time') => {
    if (planType === 'free') {
      if (!isRegisteredUser) return 'Get Started Free';
      return currentPlan.type === 'free' ? 'Current Plan' : 'Get Started Free';
    }
    
    if (planType === 'side-gig') {
      if (isSideGigLowerPlan) return 'Lower Plan';
      if (!canUpgradeToSideGig) return 'Current Plan';
      return currentPlan.type === 'free' ? 'Choose Side-Gig' : 'Upgrade to Side-Gig';
    }
    
    if (planType === 'full-time') {
      if (isFullTimeDowngrade) return 'Lower Plan';
      if (!canUpgradeToFullTime) return 'Current Plan';
      return currentPlan.type === 'free' ? 'Choose Full-Time' : 'Upgrade to Full-Time';
    }
    
    return 'Choose Plan';
  };

  const isButtonDisabled = (planType: 'free' | 'side-gig' | 'full-time') => {
    if (planType === 'free') {
      if (!isRegisteredUser) return false;
      return currentPlan.type !== 'free';
    }
    
    if (planType === 'side-gig') {
      return !isSideGigLowerPlan && !canUpgradeToSideGig;
    }
    
    if (planType === 'full-time') {
      return !isFullTimeDowngrade && !canUpgradeToFullTime;
    }
    
    return false;
  };

  const getButtonStyle = (planType: 'side-gig' | 'full-time') => {
    if (planType === 'side-gig' && isSideGigLowerPlan) {
      return 'bg-black text-white hover:bg-black/90';
    }
    if (planType === 'full-time' && isFullTimeDowngrade) {
      return 'bg-black text-white hover:bg-black/90';
    }
    return planType === 'full-time' ? 'bg-primary hover:bg-primary/90' : '';
  };

  const handleSideGigAction = () => {
    if (isSideGigLowerPlan) {
      setPendingDowngrade({
        planType: 'side-gig',
        targetPlan: { ...sideGigPlan, tokens: 15, monthlyLimit: 15 }
      });
      setShowDowngradeDialog(true);
    } else {
      handleSubscribe('side-gig');
    }
  };

  const handleFullTimeAction = () => {
    if (isFullTimeDowngrade) {
      setPendingDowngrade({
        planType: 'full-time',
        targetPlan: { ...fullTimePlan, tokens: parseInt(selectedFullTimePlan), monthlyLimit: parseInt(selectedFullTimePlan) }
      });
      setShowDowngradeDialog(true);
    } else {
      handleSubscribe('full-time');
    }
  };

  const handleFreeSignup = () => {
    if (!isRegisteredUser) {
      setShowEmailConfirmationModal(true);
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
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
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Current: {currentPlan.name}
              </Badge>
            </div>
          )}
        </div>

        <PricingCalculator onRecommendation={handleRecommendation} />

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          
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
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">Free per worksheet</p>
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
                  <span className="text-sm">Worksheets are editable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-10" 
                onClick={handleFreeSignup}
                disabled={isButtonDisabled('free')}
              >
                {getButtonText('free')}
              </Button>
            </CardContent>
          </Card>

          <Card className={`relative ${recommendedPlan === 'side-gig' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'side-gig' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold whitespace-nowrap">
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
                {currentPlan.type !== 'free' && canUpgradeToSideGig && !isSideGigLowerPlan && (
                  <Badge variant="outline" className="mt-1">
                    Upgrade now for ${sideGigUpgradePrice}
                  </Badge>
                )}
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">$0.60 per worksheet</p>
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
                  <span className="text-sm">Unused worksheets carry forward</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Worksheets are editable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
              </div>
              
              <Button 
                className={`w-full h-10 ${getButtonStyle('side-gig')}`}
                onClick={handleSideGigAction}
                disabled={isLoading === 'side-gig' || isButtonDisabled('side-gig')}
              >
                {isLoading === 'side-gig' ? 'Processing...' : getButtonText('side-gig')}
              </Button>
            </CardContent>
          </Card>

          <Card className={`relative ${recommendedPlan === 'full-time' ? 'border-primary shadow-lg' : ''}`}>
            {recommendedPlan === 'full-time' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold whitespace-nowrap">
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
                  <span className="text-4xl font-bold">
                    ${selectedPlan?.price}
                  </span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <div>
                  <Badge variant="secondary">{selectedFullTimePlan} worksheets / month</Badge>
                  {currentPlan.type !== 'free' && canUpgradeToFullTime && !isFullTimeDowngrade && (
                    <Badge variant="outline" className="mt-1">
                      Upgrade now for ${fullTimeUpgradePrice}
                    </Badge>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">
                    ${((selectedPlan?.price || 19) / parseInt(selectedFullTimePlan)).toFixed(2)} per worksheet
                  </p>
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
                  <span className="text-sm">Unused worksheets carry forward</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Worksheets are editable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Student management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to HTML & PDF</span>
                </div>
              </div>
              
              <Button 
                className={`w-full h-10 ${getButtonStyle('full-time')}`}
                onClick={handleFullTimeAction}
                disabled={isLoading === 'full-time' || isButtonDisabled('full-time')}
              >
                {isLoading === 'full-time' ? 'Processing...' : getButtonText('full-time')}
              </Button>
            </CardContent>
          </Card>
        </div>

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

        <Dialog open={showEmailConfirmationModal} onOpenChange={setShowEmailConfirmationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
              <DialogTitle>Check Your Email</DialogTitle>
              <DialogDescription>
                We've sent you a confirmation email. Please click the link in your email to verify your account and complete your registration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> You need to confirm your email address to access all features and start using your free tokens.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setShowEmailConfirmationModal(false)}
              >
                Got it, I'll check my email
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDowngradeDialog
          open={showDowngradeDialog}
          onOpenChange={setShowDowngradeDialog}
          currentPlan={currentPlan.name}
          targetPlan={pendingDowngrade?.targetPlan?.name || ''}
          onConfirm={handleDowngradeConfirm}
          isLoading={isLoading !== null}
        />
      </div>
    </div>
  );
};

export default Pricing;
