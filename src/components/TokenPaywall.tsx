
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Home, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TokenPaywall = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Coins className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">No Tokens Remaining</CardTitle>
        <CardDescription>
          You need tokens to generate custom worksheets. Choose an option below to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg">
          <CreditCard className="mr-2 h-4 w-4" />
          Upgrade to Pro Plan
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Or buy individual tokens:
        </div>
        
        <Button variant="outline" className="w-full">
          Buy 10 Tokens - $4.99
        </Button>
        
        <div className="pt-4 border-t space-y-2">
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
