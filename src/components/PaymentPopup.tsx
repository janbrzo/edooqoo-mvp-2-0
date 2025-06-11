
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (sessionToken: string) => void;
  worksheetId: string | null;
  userIp?: string | null;
}

const PaymentPopup = ({ isOpen, onClose, onPaymentSuccess, worksheetId, userIp }: PaymentPopupProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Check for existing valid token when popup opens
  useEffect(() => {
    if (isOpen) {
      const downloadToken = sessionStorage.getItem('downloadToken');
      const tokenExpiry = sessionStorage.getItem('downloadTokenExpiry');
      
      if (downloadToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        if (Date.now() < expiryTime) {
          console.log('Found existing valid token, unlocking downloads');
          onPaymentSuccess(downloadToken);
          onClose();
          return;
        } else {
          // Token expired, clean up
          sessionStorage.removeItem('downloadToken');
          sessionStorage.removeItem('downloadTokenExpiry');
        }
      }
    }
  }, [isOpen, onPaymentSuccess, onClose]);

  const handlePayment = async () => {
    if (!worksheetId) {
      toast({
        title: "Error",
        description: "Missing worksheet information. Please try generating the worksheet again.",
        variant: "destructive"
      });
      return;
    }

    // Use IP address as user identifier, fallback to browser fingerprint
    const userIdentifier = userIp || `browser_${navigator.userAgent.slice(0, 50)}_${Date.now()}`;

    setIsProcessing(true);
    try {
      console.log('Creating payment session for:', { worksheetId, userIdentifier });
      
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-export-payment', {
        body: { 
          worksheetId,
          userId: userIdentifier,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: window.location.href
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from payment service');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to create payment session. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    // Generate temporary session token for testing
    const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in sessionStorage for testing
    sessionStorage.setItem('downloadToken', tempToken);
    sessionStorage.setItem('downloadTokenExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    
    toast({
      title: "Payment Skipped (Test Mode)",
      description: "Downloads are now unlocked for testing purposes.",
      className: "bg-yellow-50 border-yellow-200"
    });
    
    onPaymentSuccess(tempToken);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-worksheet-purple" />
            Unlock Downloads
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 mb-2">
              <strong>One-time payment of $1 USD</strong> unlocks downloads for HTML version during your current session.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Download className="h-4 w-4" />
              <span>HTML download included</span>
            </div>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Redirecting to payment page...
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? "Redirecting to Payment..." : "Pay $1 with Stripe"}
            </Button>

            {/* Temporary skip button for testing */}
            <Button 
              onClick={handleSkipPayment}
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              disabled={isProcessing}
            >
              Skip Payment (Test Mode)
            </Button>

            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Secure payment processed by Stripe. Downloads expire when you close your browser session.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;
