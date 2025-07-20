
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Zap, Users } from 'lucide-react';

interface TokenPaywallProps {
  isDemo: boolean;
  tokenBalance: number;
  onUpgrade?: () => void;
}

export const TokenPaywall: React.FC<TokenPaywallProps> = ({ 
  isDemo, 
  tokenBalance, 
  onUpgrade 
}) => {
  if (isDemo) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle>Ready to Generate More?</CardTitle>
          <CardDescription>
            Sign up for a free account to get tokens and generate unlimited worksheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Free Account Benefits:</h4>
            <ul className="text-sm space-y-1">
              <li>• 2 free tokens to start</li>
              <li>• Save and manage students</li>
              <li>• Access to all worksheet types</li>
              <li>• No subscription required</li>
            </ul>
          </div>
          <Button asChild className="w-full">
            <Link to="/auth">Sign Up for Free</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
        <CardTitle>No Tokens Remaining</CardTitle>
        <CardDescription>
          You have {tokenBalance} tokens left. Choose a subscription plan to continue generating worksheets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-secondary/50 p-4 rounded-lg text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h4 className="font-semibold">Side-Gig Plan</h4>
            <p className="text-2xl font-bold">$9</p>
            <p className="text-sm text-muted-foreground">15 worksheets/month</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
            <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h4 className="font-semibold">Full-Time Plan</h4>
            <p className="text-2xl font-bold">From $19</p>
            <p className="text-sm text-muted-foreground">30-120 worksheets/month</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link to="/pricing">
            Choose Your Plan
          </Link>
        </Button>
        <div className="flex gap-2 pt-4">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/profile">Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
