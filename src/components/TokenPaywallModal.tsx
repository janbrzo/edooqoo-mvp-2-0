
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, CreditCard, Zap, Users } from 'lucide-react';

interface TokenPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: number;
  onUpgrade?: () => void;
}

export const TokenPaywallModal: React.FC<TokenPaywallModalProps> = ({ 
  isOpen,
  onClose,
  tokenBalance, 
  onUpgrade 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
          <DialogTitle>No Tokens Remaining</DialogTitle>
          <DialogDescription>
            You have {tokenBalance} tokens left. Choose a subscription plan to continue generating worksheets.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              View All Plans
            </Link>
          </Button>
          <div className="flex gap-2 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
