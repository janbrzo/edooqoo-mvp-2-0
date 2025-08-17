
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenSystem = (userId?: string | null) => {
  const [tokenLeft, setTokenLeft] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔧 useTokenSystem effect triggered, userId:', userId);
    if (userId) {
      fetchTokenBalance();
    } else {
      console.log('🔧 No userId - setting demo mode defaults');
      setLoading(false);
      setTokenLeft(0);
      setProfile(null);
    }
  }, [userId]);

  const fetchTokenBalance = async () => {
    if (!userId) return;
    
    console.log('🔧 Fetching token balance for userId:', userId);
    
    try {
      // Get profile data with simplified token system
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('available_tokens, is_tokens_frozen, monthly_worksheet_limit, subscription_type, monthly_worksheets_used, total_worksheets_created, total_tokens_consumed, total_tokens_received, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('🔧 Profile fetch error:', error);
        // Don't show toast for "no profile" errors for anonymous users
        if (error.code !== 'PGRST116') {
          throw error;
        }
        // For anonymous users or users without profiles, just set defaults
        setTokenLeft(0);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      console.log('🔧 Profile data fetched:', {
        available_tokens: profileData?.available_tokens,
        is_tokens_frozen: profileData?.is_tokens_frozen,
        subscription_type: profileData?.subscription_type
      });
      
      // FIXED: Corrected Token Left calculation
      // Token Left = actual available_tokens (what user has)
      // This shows the real token count regardless of frozen state
      const availableTokens = profileData?.available_tokens || 0;
      
      setTokenLeft(availableTokens);
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
    console.log('🔧 hasTokens() check:', {
      userId,
      tokenLeft,
      is_tokens_frozen: profile?.is_tokens_frozen,
      result: userId ? (tokenLeft > 0 && !(profile?.is_tokens_frozen)) : false
    });
    
    if (!userId) return false; // Demo mode - no tokens
    // Tokens are available if not frozen and count > 0
    return tokenLeft > 0 && !(profile?.is_tokens_frozen);
  };

  const isDemo = !userId; // Anonymous users are in demo mode
  
  console.log('🔧 useTokenSystem final state:', {
    userId,
    tokenLeft,
    isDemo,
    hasTokens: hasTokens(),
    loading
  });

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
