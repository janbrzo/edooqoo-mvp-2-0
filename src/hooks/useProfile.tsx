
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

    // Listen for window focus (when user returns from Stripe)
    const handleWindowFocus = () => {
      // Check if we're returning from successful payment
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true' || urlParams.get('session_id')) {
        // Auto-sync subscription status after payment
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('check-subscription-status');
            await fetchProfile();
          } catch (error) {
            console.error('Error auto-syncing subscription:', error);
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
