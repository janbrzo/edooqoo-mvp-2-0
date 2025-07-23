
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenSystem = (userId?: string | null) => {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchTokenBalance();
    } else {
      setLoading(false);
      setTokenBalance(0);
      setProfile(null);
    }
  }, [userId]);

  const fetchTokenBalance = async () => {
    if (!userId) return;
    
    try {
      // Get both token balance and profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('token_balance, monthly_worksheet_limit, subscription_type')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setTokenBalance(profileData?.token_balance || 0);
      setProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch token balance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const consumeToken = async (worksheetId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('consume_token', { 
          p_teacher_id: userId, 
          p_worksheet_id: worksheetId 
        });
      
      if (error) throw error;
      
      if (data) {
        setTokenBalance(prev => Math.max(0, prev - 1));
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error consuming token:', error);
      return false;
    }
  };

  // Check if user has tokens available (either from balance or monthly limit)
  const hasTokens = () => {
    if (!userId) return false; // Demo mode - no tokens
    
    // If user has token balance, they can generate
    if (tokenBalance > 0) return true;
    
    // If user has active subscription with monthly limit, they can generate
    const monthlyLimit = profile?.monthly_worksheet_limit || 0;
    const subscriptionActive = profile?.subscription_type && profile?.subscription_type !== 'Free Demo';
    
    return subscriptionActive && monthlyLimit > 0;
  };

  const isDemo = !userId; // Anonymous users are in demo mode

  return {
    tokenBalance,
    profile,
    loading,
    hasTokens: hasTokens(),
    isDemo,
    consumeToken,
    refetchBalance: fetchTokenBalance
  };
};
