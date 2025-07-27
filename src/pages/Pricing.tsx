
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Zap, ArrowRight } from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { PricingCalculator } from '@/components/PricingCalculator';

const Pricing = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const { tokenLeft, profile } = useTokenSystem(user?.id);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);

  const currentPlan = profile?.subscription_type || 'Free Demo';

  const handleRecommendation = (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => {
    setRecommendedPlan(plan);
    setRecommendedWorksheets(worksheetsNeeded);
  };

  const plans = [
    {
      name: 'Free Demo',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out the platform',
      features: [
        '2 free tokens to start',
        'All worksheet types',
        'Basic customization',
        'Preview functionality'
      ],
      buttonText: 'Current Plan',
      buttonVariant: 'outline' as const,
      isCurrentPlan: currentPlan === 'Free Demo',
      popular: false,
      icon: Users
    },
    {
      name: 'Side-Gig',
      price: '$9',
      period: 'month',
      description: 'Great for part-time teachers',
      features: [
        '15 worksheets per month',
        'Student management',
        'All exercise types',
        'Download & print',
        'Email support'
      ],
      buttonText: 'Upgrade to Side-Gig',
      buttonVariant: 'default' as const,
      isCurrentPlan: currentPlan === 'Side-Gig',
      popular: recommendedPlan === 'side-gig',
      icon: Users
    },
    {
      name: 'Full-Time',
      price: '$19',
      period: 'month',
      description: 'Perfect for professional teachers',
      features: [
        `${recommendedWorksheets} worksheets per month`,
        'Advanced customization',
        'Priority support',
        'Bulk operations',
        'Analytics & insights'
      ],
      buttonText: 'Upgrade to Full-Time',
      buttonVariant: 'default' as const,
      isCurrentPlan: currentPlan?.startsWith('Full-Time'),
      popular: recommendedPlan === 'full-time',
      icon: Zap
    }
  ];

  const additionalPlans = [
    { worksheets: 60, price: '$39' },
    { worksheets: 90, price: '$59' },
    { worksheets: 120, price: '$79' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate unlimited worksheets for your English students with our flexible pricing plans
          </p>
          
          {isRegisteredUser && (
            <div className="mt-8 flex justify-center">
              <Card className="inline-block">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{tokenLeft}</div>
                      <div className="text-sm text-muted-foreground">Token Left</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentPlan}</div>
                      <div className="text-sm text-muted-foreground">Current Plan</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <PricingCalculator onRecommendation={handleRecommendation} />

        {/* Main Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full"
                    disabled={plan.isCurrentPlan}
                    asChild={!plan.isCurrentPlan}
                  >
                    {plan.isCurrentPlan ? (
                      <span>Current Plan</span>
                    ) : (
                      <Link to="/profile">
                        {plan.buttonText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Full-Time Plans */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Need More Worksheets?</h2>
          <p className="text-muted-foreground">
            Full-Time plans with higher monthly limits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {additionalPlans.map((plan) => (
            <Card key={plan.worksheets} className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Full-Time {plan.worksheets}</CardTitle>
                <CardDescription>{plan.worksheets} worksheets per month</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                  disabled={currentPlan === `Full-Time ${plan.worksheets}`}
                >
                  {currentPlan === `Full-Time ${plan.worksheets}` ? (
                    <span>Current Plan</span>
                  ) : (
                    <Link to="/profile">
                      Upgrade to {plan.worksheets}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Why Choose Our Worksheet Generator?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3">🎯 Tailored Content</h3>
                <p className="text-sm text-muted-foreground">
                  Every worksheet is customized to your student's level and needs
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">⚡ Instant Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Get professional worksheets in seconds, not hours
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">📚 All Exercise Types</h3>
                <p className="text-sm text-muted-foreground">
                  Multiple choice, fill-in-the-blanks, matching, and more
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">👥 Student Management</h3>
                <p className="text-sm text-muted-foreground">
                  Keep track of your students and their progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of teachers who are already using our platform
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/profile">
                Choose Your Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">
                Try Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
