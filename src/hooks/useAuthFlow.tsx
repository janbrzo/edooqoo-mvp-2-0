
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AccountType = 'demo' | 'side-gig' | 'full-time' | null;

export function useAuthFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const anonymous = session?.user?.is_anonymous === true;
      console.log(`Auth change: ${event}, anonymous=${anonymous}`);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAnonymous(anonymous);
      setLoading(false);
    });

    // Check for existing session without creating anonymous account
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAnonymous(session?.user?.is_anonymous === true);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isRegisteredUser = user && !isAnonymous && user.email;

  return {
    user,
    session,
    loading,
    isAnonymous,
    isRegisteredUser,
    signInAnonymously,
    signOut
  };
}
