
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenSystem = (userId?: string | null) => {
  const [tokenLeft, setTokenLeft] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // FIXED: Check if user is anonymous by checking the actual user session
  const [isAnonymousUser, setIsAnonymousUser] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  useEffect(() => {
    if (userId && !isAnonymousUser) {
      fetchTokenBalance();
    } else {
      setLoading(false);
      setTokenLeft(0);
      setProfile(null);
    }
  }, [userId, isAnonymousUser]);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const anonymous = user?.is_anonymous === true || !user?.email;
      console.log('🔍 User status check:', {
        hasUser: !!user,
        userId: user?.id,
        isAnonymous: user?.is_anonymous,
        hasEmail: !!user?.email,
        finalAnonymousStatus: anonymous
      });
      setIsAnonymousUser(anonymous);
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsAnonymousUser(true);
    }
  };

  const fetchTokenBalance = async () => {
    if (!userId || isAnonymousUser) {
      console.log('🔍 Skipping token fetch - anonymous user');
      return;
    }
    
    try {
      console.log('🔍 Fetching token balance for authenticated user:', userId);
      
      // Get profile data with simplified token system
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('available_tokens, is_tokens_frozen, monthly_worksheet_limit, subscription_type, monthly_worksheets_used, total_worksheets_created, total_tokens_consumed, total_tokens_received, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Don't show toast for "no profile" errors for authenticated users - they might not have a profile yet
        if (error.code === 'PGRST116') {
          console.log('🔍 No profile found for authenticated user - this is normal for new users');
          setTokenLeft(0);
          setProfile(null);
          return;
        }
        throw error;
      }
      
      // FIXED: Corrected Token Left calculation
      // Token Left = actual available_tokens (what user has)
      // This shows the real token count regardless of frozen state
      const availableTokens = profileData?.available_tokens || 0;
      
      console.log('🔍 Token balance fetched:', {
        availableTokens,
        is_tokens_frozen: profileData?.is_tokens_frozen,
        subscription_type: profileData?.subscription_type
      });
      
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
    if (!userId || isAnonymousUser) return false;
    
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
    if (isAnonymousUser) {
      console.log('🔍 hasTokens() - Anonymous user, returning true (demo mode)');
      return true; // Anonymous users can always generate (demo worksheets)
    }
    
    // Authenticated users need tokens and not frozen
    const result = tokenLeft > 0 && !(profile?.is_tokens_frozen);
    console.log('🔍 hasTokens() - Authenticated user:', {
      tokenLeft,
      is_tokens_frozen: profile?.is_tokens_frozen,
      result
    });
    return result;
  };

  // FIXED: isDemo should be based on anonymous status, not userId presence
  const isDemo = isAnonymousUser;

  console.log('🔍 useTokenSystem final state:', {
    userId,
    tokenLeft,
    isDemo,
    isAnonymousUser,
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
