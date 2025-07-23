
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSubscriptionVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifySubscription = async (sessionId: string) => {
    setIsVerifying(true);
    try {
      console.log('🔍 VERIFYING SUBSCRIPTION:', { sessionId });
      
      const { data, error } = await supabase.functions.invoke('verify-subscription-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('❌ SUBSCRIPTION VERIFICATION ERROR:', error);
        throw error;
      }

      console.log('✅ SUBSCRIPTION VERIFICATION SUCCESS:', data);

      if (data.success) {
        toast({
          title: "Subscription activated!",
          description: `Your plan is now active. ${data.tokensAdded} tokens have been added to your account.`,
          className: "bg-green-50 border-green-200"
        });
        
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('💥 SUBSCRIPTION VERIFICATION EXCEPTION:', error);
      
      toast({
        title: "Subscription verification failed",
        description: error instanceof Error ? error.message : "Please contact support if the issue persists.",
        variant: "destructive"
      });
      
      return { success: false, error };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifySubscription,
    isVerifying
  };
};
