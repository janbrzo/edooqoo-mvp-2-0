
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useConditionalAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        setLoading(true);
        
        // Check if we already have a session without creating anonymous users
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
          setUserId(session.user.id);
          setIsAuthenticated(!session.user.is_anonymous);
        }
      } catch (err) {
        console.error('Error during auth check:', err);
        setError(err instanceof Error ? err : new Error('Unknown authentication error'));
      } finally {
        setLoading(false);
      }
    }

    checkExistingAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        setUserId(session.user.id);
        setIsAuthenticated(!session.user.is_anonymous);
      } else {
        setUserId(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading, error, isAuthenticated };
}
