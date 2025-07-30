
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
      console.log('Auth state change:', event, session?.user?.is_anonymous);
      console.log('🔍 Auth details:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        isAnonymousFlag: session?.user?.is_anonymous,
        userId: session?.user?.id
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Improved anonymous detection
      const isUserAnonymous = determineIfAnonymous(session);
      console.log('🔍 User determined as anonymous:', isUserAnonymous);
      setIsAnonymous(isUserAnonymous);
      setLoading(false);
    });

    // Check for existing session without creating anonymous account
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        isAnonymousFlag: session?.user?.is_anonymous,
        userId: session?.user?.id
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      const isUserAnonymous = determineIfAnonymous(session);
      console.log('🔍 Initial user determined as anonymous:', isUserAnonymous);
      setIsAnonymous(isUserAnonymous);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to determine if user is anonymous
  const determineIfAnonymous = (session: Session | null): boolean => {
    if (!session || !session.user) {
      return true; // No session = anonymous
    }
    
    const user = session.user;
    
    // Check if explicitly marked as anonymous
    if (user.is_anonymous === true) {
      return true;
    }
    
    // Check if user has a real email
    if (!user.email || user.email.trim() === '') {
      return true;
    }
    
    // Check for anonymous email patterns
    const anonymousEmailPatterns = [
      /^anonymous/i,
      /^guest/i,
      /^temp/i,
      /@anonymous\./i,
      /@temp\./i
    ];
    
    const hasAnonymousEmail = anonymousEmailPatterns.some(pattern => 
      pattern.test(user.email || '')
    );
    
    if (hasAnonymousEmail) {
      return true;
    }
    
    // If is_anonymous is explicitly false and user has real email, treat as authenticated
    if (user.is_anonymous === false && user.email) {
      return false;
    }
    
    // Default to anonymous for safety if unclear
    return true;
  };

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
