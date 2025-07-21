import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Users } from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { User, GraduationCap } from 'lucide-react';

const Pricing = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const { tokenBalance } = useTokenSystem(user?.id || null);

  // Navigation component for authenticated users
  const AuthenticatedNav = () => (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
      <Badge variant="outline" className="text-sm">
        Balance: {tokenBalance} tokens
      </Badge>
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard">
          <GraduationCap className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/profile">
          <User className="h-4 w-4 mr-2" />
          Profile
        </Link>
      </Button>
    </div>
  );

  // Navigation component for anonymous users
  const AnonymousNav = () => (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/signup">Get started</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Left side navigation */}
      <div className="fixed top-4 left-4 z-50">
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            Generator
          </Link>
        </Button>
      </div>

      {/* Navigation based on auth status */}
      {isRegisteredUser ? <AuthenticatedNav /> : <AnonymousNav />}
      
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:text-center lg:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple pricing plans
          </h2>
          <p className="mt-3 text-lg text-gray-500 sm:mt-5 sm:text-md lg:text-lg sm:max-w-xl sm:mx-auto md:mt-5 lg:mx-0">
            Choose the plan that fits your needs. Whether you're just starting out or need more power, we've got you covered.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Free Plan */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Free Demo</CardTitle>
                <CardDescription>Perfect for trying out the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold">$0</div>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Limited access to features</li>
                  <li>2 worksheet generation tokens</li>
                  <li>Community support</li>
                </ul>
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Side-Gig Plan */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Side-Gig</CardTitle>
                <CardDescription>For occasional worksheet generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold">$9</div>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Access to all features</li>
                  <li>15 worksheet generation tokens</li>
                  <li>Priority support</li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/profile">Upgrade to Side-Gig</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Full-Time Plan */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Full-Time</CardTitle>
                <CardDescription>For teachers with regular needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold">$19</div>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Access to all features</li>
                  <li>30 worksheet generation tokens</li>
                  <li>Priority support</li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/profile">Upgrade to Full-Time</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
