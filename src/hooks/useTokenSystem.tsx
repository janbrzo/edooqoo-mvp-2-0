
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenSystem = (userId?: string | null) => {
  const [tokenLeft, setTokenLeft] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchTokenBalance();
    } else {
      // For anonymous users, set loading to false immediately and don't fetch anything
      setLoading(false);
      setTokenLeft(0);
      setProfile(null);
    }
  }, [userId]);

  const fetchTokenBalance = async () => {
    if (!userId) return;
    
    try {
      // Get profile data with simplified token system
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('available_tokens, is_tokens_frozen, monthly_worksheet_limit, subscription_type, monthly_worksheets_used, total_worksheets_created, total_tokens_consumed, total_tokens_received, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Token Left = actual available_tokens (what user has)
      const availableTokens = profileData?.available_tokens || 0;
      
      setTokenLeft(availableTokens);
      setProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      // Only show toast for authenticated users - suppress for anonymous users
      if (userId) {
        toast({
          title: "Error",
          description: "Failed to fetch token balance",
          variant: "destructive"
        });
      }
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
        // Refresh the token data after successful consumption
        await fetchTokenBalance();
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error consuming token:', error);
      return false;
    }
  };

  // Check if user has tokens available for use
  const hasTokens = () => {
    if (!userId) return true; // Demo mode - allow worksheet generation (will be watermarked)
    // Tokens are available if not frozen and count > 0
    return tokenLeft > 0 && !(profile?.is_tokens_frozen);
  };

  const isDemo = !userId; // Anonymous users are in demo mode

  return {
    tokenLeft, // Shows actual available_tokens count
    profile,
    loading,
    hasTokens: hasTokens(),
    isDemo,
    consumeToken,
    refetchBalance: fetchTokenBalance
  };
};
