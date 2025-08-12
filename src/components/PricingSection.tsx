
import React from "react";
import { PricingCalculator } from "@/components/PricingCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

const PricingSection = () => {
  const handleSubscription = async (planType: string, monthlyLimit: number, price: number, planName: string) => {
    console.log(`Subscribe to ${planName}: ${monthlyLimit} worksheets for $${price}`);
    // Implementation would go here
  };

  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Calculate exactly what you need and upgrade anytime. All plans include unlimited editing and downloads.
          </p>
        </div>

        {/* Pricing Calculator */}
        <div className="mb-16">
          <PricingCalculator />
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Side-Gig Plan */}
          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Side-Gig</CardTitle>
              <CardDescription className="text-gray-600">Perfect for occasional tutoring</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$19</div>
                <div className="text-gray-600">/month</div>
                <Badge variant="secondary" className="mt-2">20 worksheets</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">20 AI worksheets/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Unlimited editing & downloads</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Student progress tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Email support</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => handleSubscription('side-gig', 20, 19, 'Side-Gig')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Full-Time Plans */}
          <Card className="relative border-2 border-blue-300 bg-blue-50 hover:border-blue-400 transition-colors">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Full-Time 30</CardTitle>
              <CardDescription className="text-gray-600">Great for growing practices</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$39</div>
                <div className="text-gray-600">/month</div>
                <Badge variant="secondary" className="mt-2">30 worksheets</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">30 AI worksheets/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Everything in Side-Gig</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Advanced analytics</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => handleSubscription('full-time-30', 30, 39, 'Full-Time 30')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Full-Time 60</CardTitle>
              <CardDescription className="text-gray-600">For busy professionals</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$69</div>
                <div className="text-gray-600">/month</div>
                <Badge variant="secondary" className="mt-2">60 worksheets</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">60 AI worksheets/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Everything in Full-Time 30</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Bulk export features</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Custom templates</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => handleSubscription('full-time-60', 60, 69, 'Full-Time 60')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Full-Time 90</CardTitle>
              <CardDescription className="text-gray-600">Maximum productivity</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$99</div>
                <div className="text-gray-600">/month</div>
                <Badge variant="secondary" className="mt-2">90 worksheets</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">90 AI worksheets/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Everything in Full-Time 60</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">White-label options</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => handleSubscription('full-time-90', 90, 99, 'Full-Time 90')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Need more than 90 worksheets? Contact us for enterprise pricing.
          </p>
          <p className="text-sm text-gray-500">
            All plans include 7-day free trial • Cancel anytime • No setup fees
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
