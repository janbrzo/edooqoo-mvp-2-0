
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSubscriptionVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifySubscriptionPayment = async (sessionId: string) => {
    setIsVerifying(true);
    try {
      console.log('Verifying subscription payment:', { sessionId });
      
      const { data, error } = await supabase.functions.invoke('verify-subscription-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('Subscription verification error:', error);
        throw error;
      }

      if (data.success) {
        console.log('Subscription verified successfully:', data);
        
        toast({
          title: "Subscription Activated!",
          description: `Your ${data.subscription.plan_type} plan is now active. ${data.subscription.tokens_added} tokens have been added to your account.`,
          className: "bg-green-50 border-green-200"
        });

        return {
          success: true,
          subscription: data.subscription,
          message: data.message
        };
      } else {
        console.log('Subscription verification failed:', data);
        
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Unable to verify your payment. Please contact support.",
          variant: "destructive"
        });

        return {
          success: false,
          message: data.message || "Payment verification failed"
        };
      }
    } catch (error) {
      console.error('Subscription verification exception:', error);
      
      toast({
        title: "Verification Error",
        description: "Failed to verify your subscription payment. Please contact support.",
        variant: "destructive"
      });

      return {
        success: false,
        message: "Verification failed"
      };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifySubscriptionPayment,
    isVerifying
  };
};
