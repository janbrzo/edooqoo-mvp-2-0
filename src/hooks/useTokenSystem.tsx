
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
      // For anonymous users, set default values without fetching
      console.log('🔧 [useTokenSystem] Anonymous user detected, skipping token fetch');
      setLoading(false);
      setTokenLeft(0);
      setProfile(null);
    }
  }, [userId]);

  const fetchTokenBalance = async () => {
    // CRITICAL FIX: Early return for anonymous users to prevent all database calls
    if (!userId) {
      console.log('🔧 [fetchTokenBalance] Early return for anonymous user');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔧 [fetchTokenBalance] Fetching for authenticated user:', userId);
      
      // Get profile data with simplified token system
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('available_tokens, is_tokens_frozen, monthly_worksheet_limit, subscription_type, monthly_worksheets_used, total_worksheets_created, total_tokens_consumed, total_tokens_received, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // FIXED: Corrected Token Left calculation
      // Token Left = actual available_tokens (what user has)
      // This shows the real token count regardless of frozen state
      const availableTokens = profileData?.available_tokens || 0;
      
      setTokenLeft(availableTokens);
      setProfile(profileData);
      console.log('🔧 [fetchTokenBalance] Success - tokens:', availableTokens);
    } catch (error: any) {
      // CRITICAL FIX: Only show error toasts and logs for authenticated users
      if (userId) {
        console.error('Error fetching token balance:', error);
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
    // CRITICAL FIX: Move demo mode check to the very beginning
    if (!userId) {
      console.log('🔧 [hasTokens] Anonymous user (demo mode) - returning true');
      return true; // Demo mode - always allow
    }
    
    // For authenticated users: tokens are available if not frozen and count > 0
    const result = tokenLeft > 0 && !(profile?.is_tokens_frozen);
    console.log('🔧 [hasTokens] Authenticated user result:', { tokenLeft, frozen: profile?.is_tokens_frozen, result });
    return result;
  };

  const isDemo = !userId; // Anonymous users are in demo mode
  
  console.log('🔧 [useTokenSystem] Current state:', { userId: !!userId, tokenLeft, isDemo, hasTokensResult: hasTokens() });

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
