
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAnonymousAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function signInAnonymously() {
      try {
        setLoading(true);
        
        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUserId(session.user.id);
        } else {
          // Sign in anonymously if no session exists
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          
          if (signInError) throw signInError;
          
          if (data?.user) {
            setUserId(data.user.id);
          }
        }
      } catch (err) {
        console.error('Error during anonymous authentication:', err);
        setError(err instanceof Error ? err : new Error('Unknown authentication error'));
      } finally {
        setLoading(false);
      }
    }

    signInAnonymously();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading, error };
}
