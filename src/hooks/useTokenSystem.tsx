
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenSystem = (userId?: string | null) => {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchTokenBalance();
      fetchMonthlyData();
    } else {
      setLoading(false);
      setTokenBalance(0);
      setMonthlyUsage(0);
      setMonthlyLimit(null);
    }
  }, [userId]);

  const fetchTokenBalance = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_token_balance', { p_teacher_id: userId });
      
      if (error) throw error;
      setTokenBalance(data || 0);
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch token balance",
        variant: "destructive"
      });
    }
  };

  const fetchMonthlyData = async () => {
    if (!userId) return;
    
    try {
      // For now, set default values - these can be fetched from database later
      setMonthlyUsage(0);
      setMonthlyLimit(null); // null means unlimited
    } catch (error: any) {
      console.error('Error fetching monthly data:', error);
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
        setMonthlyUsage(prev => prev + 1);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error consuming token:', error);
      return false;
    }
  };

  const hasTokens = tokenBalance > 0;
  const isDemo = !userId; // Anonymous users are in demo mode

  return {
    tokenBalance,
    monthlyUsage,
    monthlyLimit,
    loading,
    hasTokens,
    isDemo,
    consumeToken,
    refetchBalance: fetchTokenBalance
  };
};
