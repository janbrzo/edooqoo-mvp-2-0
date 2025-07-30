
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
      
      // Improved anonymous detection - less restrictive for real users
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

  // Helper function to determine if user is anonymous - LESS RESTRICTIVE for real users
  const determineIfAnonymous = (session: Session | null): boolean => {
    console.log('🧩 determineIfAnonymous called with:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      isAnonymousFlag: session?.user?.is_anonymous
    });

    if (!session || !session.user) {
      console.log('❌ No session or user - returning anonymous');
      return true; // No session = anonymous
    }
    
    const user = session.user;
    
    // If explicitly marked as anonymous, it's anonymous
    if (user.is_anonymous === true) {
      console.log('✅ User explicitly marked as anonymous');
      return true;
    }
    
    // Check if user has a real email
    if (!user.email || user.email.trim() === '') {
      console.log('❌ No email - returning anonymous');
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
      console.log('❌ Anonymous email pattern detected - returning anonymous');
      return true;
    }
    
    // MAIN CHANGE: If user has real email and is_anonymous is NOT true, treat as authenticated
    if (user.email && user.is_anonymous !== true) {
      console.log('✅ User has real email and is_anonymous !== true - returning authenticated (false)');
      return false;
    }
    
    // If we get here, something is unclear - be defensive but check email again
    if (user.email && !hasAnonymousEmail) {
      console.log('⚠️ Unclear case but user has real email - returning authenticated (false)');
      return false;
    }
    
    // Final fallback to anonymous
    console.log('❓ Final fallback - returning anonymous');
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
