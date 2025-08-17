
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Profile = Tables<'profiles'>;

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    
    // Listen for URL changes that might indicate return from payment
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Delay to ensure any webhook has time to process
        setTimeout(fetchProfile, 2000);
      }
    };

    // REMOVED: finalize-upgrade handling from window focus - now handled in Profile.tsx
    const handleWindowFocus = () => {
      // Check if we're returning from successful payment (but don't call finalize-upgrade here)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        // Only sync subscription status, finalize-upgrade is handled in Profile.tsx
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('check-subscription-status');
            await fetchProfile();
          } catch (error) {
            console.error('[useProfile] Error syncing subscription:', error);
          }
        }, 3000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is anonymous
      const isAnonymous = user.is_anonymous === true || !user.email;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // FIXED: Don't show toast errors for anonymous users or "no profile" errors
        if (!isAnonymous && error.code !== 'PGRST116') {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }
      
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // Check if user is anonymous before showing toast
      const { data: { user } } = await supabase.auth.getUser();
      const isAnonymous = user?.is_anonymous === true || !user?.email;
      
      if (!isAnonymous) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    refetch: fetchProfile
  };
};
