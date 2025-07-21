import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Users, Zap, CheckCircle } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'plan-selection'>('signin');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedFullTimePlan, setSelectedFullTimePlan] = useState('30');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const plan = urlParams.get('plan');
    
    if (plan) {
      setSelectedPlan(plan);
      setMode('signup');
      
      if (plan.startsWith('full-time-')) {
        const planTokens = plan.replace('full-time-', '');
        setSelectedFullTimePlan(planTokens);
      }
    } else {
      // Default to sign in when no plan is specified
      setMode('signin');
    }
  }, [location]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign in successful',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            plan: selectedPlan,
            fullTimePlan: selectedFullTimePlan
          }
        }
      });
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign up successful',
          description: 'Please check your email to verify your account.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Sign up failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        toast({
          title: 'Failed to sign in anonymously',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signed in anonymously',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Failed to sign in anonymously',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const urlParams = new URLSearchParams(location.search);
    const plan = urlParams.get('plan');
    
    if (plan) {
      // If came from plan selection, go back to previous page
      navigate(-1);
    } else {
      // If no plan, show plan selection
      setMode('plan-selection');
    }
  };

  const fullTimePlans = [
    { tokens: '30', price: 19 },
    { tokens: '60', price: 39 },
    { tokens: '90', price: 59 },
    { tokens: '120', price: 79 }
  ];

  const selectedFullTimePlanData = fullTimePlans.find(p => p.tokens === selectedFullTimePlan);

  if (mode === 'plan-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-muted-foreground">Select the plan that works best for you</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Demo Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-xl">Free Demo</CardTitle>
                </div>
                <CardDescription className="text-base">2 worksheets</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Try it out</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPlan('demo');
                    setMode('signup');
                  }}
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Side-Gig Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Side-Gig Plan</CardTitle>
                </div>
                <CardDescription className="text-base">15 worksheets/month</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Part-time teaching</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPlan('side-gig');
                    setMode('signup');
                  }}
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            {/* Full-Time Plan */}
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                  Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Full-Time Plan</CardTitle>
                </div>
                <CardDescription className="text-base">30+ worksheets/month</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">From $19</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Professional teaching</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPlan('full-time');
                    setMode('signup');
                  }}
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {mode === 'signin' ? 'Sign In' : `Sign Up${selectedPlan ? ` - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan` : ''}`}
              </CardTitle>
              <CardDescription>
                {mode === 'signin' 
                  ? 'Enter your credentials to access your account'
                  : `Create your account${selectedPlan ? ` and start with the ${selectedPlan} plan` : ''}`
                }
              </CardDescription>
            </div>
          </div>

          {selectedPlan && mode === 'signup' && (
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {selectedPlan === 'demo' && 'Free Demo Plan'}
                    {selectedPlan === 'side-gig' && 'Side-Gig Plan'}
                    {selectedPlan === 'full-time' && 'Full-Time Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan === 'demo' && '2 worksheets to try'}
                    {selectedPlan === 'side-gig' && '15 worksheets/month - $9/month'}
                    {selectedPlan === 'full-time' && `${selectedFullTimePlan} worksheets/month - $${selectedFullTimePlanData?.price}/month`}
                  </p>
                </div>
                {selectedPlan === 'full-time' && (
                  <Select value={selectedFullTimePlan} onValueChange={setSelectedFullTimePlan}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fullTimePlans.map((plan) => (
                        <SelectItem key={plan.tokens} value={plan.tokens}>
                          {plan.tokens}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={mode === 'signin' ? handleSignIn : handleSignUp}
              className="w-full"
              disabled={loading || !email || !password}
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                disabled={loading}
                className="text-sm"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </Button>
            </div>

            {mode === 'signin' && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={signInAnonymously}
                  disabled={loading}
                  className="w-full"
                >
                  Try Demo (No Registration)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
