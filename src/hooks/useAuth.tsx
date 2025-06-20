
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * Backward compatible auth hook that provides userId like the old useAnonymousAuth
 * but now works with proper authentication
 */
export function useAuth() {
  const { user, session, loading, signUp, signIn, signOut, isAuthenticated } = useAuthContext();

  return {
    // Backward compatibility
    userId: user?.id || null,
    loading,
    error: null, // For backward compatibility
    
    // New auth functionality
    user,
    session,
    signUp,
    signIn,
    signOut,
    isAuthenticated
  };
}
