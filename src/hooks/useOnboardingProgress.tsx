
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useStudents } from '@/hooks/useStudents';

interface OnboardingStep {
  add_student: boolean;
  generate_worksheet: boolean;
  share_worksheet: boolean;
}

interface OnboardingProgress {
  steps: OnboardingStep;
  completed: boolean;
  dismissed: boolean;
}

const defaultProgress: OnboardingProgress = {
  steps: {
    add_student: false,
    generate_worksheet: false,
    share_worksheet: false
  },
  completed: false,
  dismissed: false
};

export const useOnboardingProgress = () => {
  const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const { students } = useStudents();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Load progress from profile or localStorage
  useEffect(() => {
    const profileWithOnboarding = profile as any;
    if (profileWithOnboarding?.onboarding_progress) {
      try {
        const savedProgress = profileWithOnboarding.onboarding_progress as OnboardingProgress;
        setProgress(savedProgress);
      } catch (error) {
        console.error('Error parsing onboarding progress:', error);
        // Fallback to localStorage
        const localProgress = localStorage.getItem('onboarding_progress');
        if (localProgress) {
          try {
            setProgress(JSON.parse(localProgress));
          } catch (e) {
            setProgress(defaultProgress);
          }
        }
      }
    } else {
      // Fallback to localStorage
      const localProgress = localStorage.getItem('onboarding_progress');
      if (localProgress) {
        try {
          setProgress(JSON.parse(localProgress));
        } catch (error) {
          setProgress(defaultProgress);
        }
      }
    }
    setLoading(false);
  }, [profile]);

  // ULTRA-ENHANCED: Check step completion with IMMEDIATE database sync and forced refresh
  const checkSteps = useCallback(async () => {
    if (loading || !profile?.id) {
      console.log('[Onboarding] Skipping checkSteps - loading or no profile', { loading, profileId: profile?.id });
      return;
    }

    console.log('[Onboarding] Checking steps directly from database...', { 
      studentsCount: students.length, 
      totalWorksheets: profile?.total_worksheets_created || 0 
    });

    try {
      // CRITICAL: Always check students directly from database for real-time accuracy
      const { data: dbStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', profile.id);
        
      if (studentsError) {
        console.error('[Onboarding] Error checking students from DB:', studentsError);
        return;
      }
      
      const studentsCount = dbStudents?.length || 0;
      console.log('[Onboarding] Direct DB check - students count:', studentsCount);

      // CRITICAL: Always check worksheets directly from database for real-time accuracy
      const { data: dbWorksheets, error: worksheetsError } = await supabase
        .from('worksheets')
        .select('id, share_token')
        .eq('teacher_id', profile.id)
        .is('deleted_at', null);
        
      if (worksheetsError) {
        console.error('[Onboarding] Error checking worksheets from DB:', worksheetsError);
        return;
      }
      
      const worksheetsCount = dbWorksheets?.length || 0;
      const sharedWorksheetsCount = dbWorksheets?.filter(w => w.share_token)?.length || 0;

      console.log('[Onboarding] Direct DB check - worksheets:', { 
        total: worksheetsCount, 
        shared: sharedWorksheetsCount 
      });

      const newSteps: OnboardingStep = {
        add_student: studentsCount > 0,
        generate_worksheet: worksheetsCount > 0,
        share_worksheet: sharedWorksheetsCount > 0
      };

      const allCompleted = Object.values(newSteps).every(step => step);
      
      // CRITICAL: Force refresh onboarding progress from database immediately after checking steps
      const { data: currentOnboardingData } = await supabase
        .from('profiles')
        .select('onboarding_progress')
        .eq('id', profile.id)
        .single();
      
      // Use setProgress with function to avoid stale closures
      setProgress(currentProgress => {
        const hasChanges = JSON.stringify(newSteps) !== JSON.stringify(currentProgress.steps);
        
        console.log('[Onboarding] Step check results:', { 
          newSteps, 
          allCompleted, 
          hasChanges,
          currentDismissed: currentProgress.dismissed,
          currentCompleted: currentProgress.completed
        });

        // ADDED: Force update if dismissed status changed - FIXED TypeScript casting
        let dbProgress: OnboardingProgress | null = null;
        try {
          if (currentOnboardingData?.onboarding_progress && typeof currentOnboardingData.onboarding_progress === 'object') {
            dbProgress = currentOnboardingData.onboarding_progress as unknown as OnboardingProgress;
          }
        } catch (e) {
          console.warn('[Onboarding] Failed to parse onboarding_progress from DB:', e);
        }
        
        const dismissedChanged = dbProgress && (dbProgress.dismissed !== currentProgress.dismissed);

        if (currentProgress.dismissed && !dismissedChanged) {
          return currentProgress; // No changes needed if truly dismissed
        }

        if (hasChanges || (allCompleted && !currentProgress.completed) || dismissedChanged) {
          const newProgress: OnboardingProgress = {
            ...currentProgress,
            steps: newSteps,
            completed: allCompleted,
            dismissed: dbProgress?.dismissed || currentProgress.dismissed // Sync dismissed state from DB
          };

          // ADDED: Always save progress after checking steps for immediate sync
          setTimeout(() => saveProgress(newProgress), 100);
          return newProgress;
        }

        return currentProgress;
      });
    } catch (error) {
      console.error('[Onboarding] Error in checkSteps:', error);
    }
  }, [profile?.id, loading]); // SIMPLIFIED: Removed students.length to avoid circular deps

  // Initial check and dependencies effect
  useEffect(() => {
    checkSteps();
  }, [students, profile, loading]);

  // Real-time subscriptions and periodic checking - FIXED: simpler dependency management
  useEffect(() => {
    if (loading || !profile?.id) return;

    console.log('[Onboarding] Setting up real-time subscriptions and periodic check');

    // Set up real-time subscription for worksheets
    const worksheetChannel = supabase
      .channel('onboarding-worksheets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'worksheets',
          filter: `teacher_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('[Onboarding] Worksheet created, refreshing steps:', payload);
          setTimeout(checkSteps, 1000); // Small delay to ensure profile is updated
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'worksheets',
          filter: `teacher_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('[Onboarding] Worksheet updated, checking for share_token:', payload);
          if (payload.new.share_token && !payload.old.share_token) {
            setTimeout(checkSteps, 500); // Check immediately when worksheet is shared
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for students
    const studentChannel = supabase
      .channel('onboarding-students')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
          filter: `teacher_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('[Onboarding] Student added, refreshing steps:', payload);
          setTimeout(checkSteps, 500);
        }
      )
      .subscribe();

    // ULTRA-FAST: 200ms periodic check for INSTANT responsiveness
    intervalRef.current = setInterval(() => {
      console.log('[Onboarding] Periodic check triggered - immediate mode');
      checkSteps();
    }, 200);  // ULTRA-SHORTENED: 200ms for INSTANT response after adding student
    
    // ADDED: Force refresh on window focus for better responsiveness
    const handleWindowFocus = () => {
      console.log('[Onboarding] Window focus detected, force refreshing');
      setTimeout(checkSteps, 500);
    };
    
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      console.log('[Onboarding] Cleaning up subscriptions and interval');
      supabase.removeChannel(worksheetChannel);
      supabase.removeChannel(studentChannel);
      window.removeEventListener('focus', handleWindowFocus);  // ADDED: cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profile?.id, loading, checkSteps]);

  const saveProgress = async (newProgress: OnboardingProgress) => {
    // Save to localStorage as fallback
    localStorage.setItem('onboarding_progress', JSON.stringify(newProgress));

    // Save to Supabase if user is authenticated
    if (profile?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ 
            onboarding_progress: newProgress as any
          } as any)
          .eq('id', profile.id);
      } catch (error) {
        console.error('Error saving onboarding progress:', error);
      }
    }
  };

  const dismissOnboarding = async () => {
    const newProgress: OnboardingProgress = {
      ...progress,
      dismissed: true
    };
    
    setProgress(newProgress);
    await saveProgress(newProgress);
  };

  const getCompletionPercentage = () => {
    const completedSteps = Object.values(progress.steps).filter(Boolean).length;
    const totalSteps = Object.keys(progress.steps).length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const shouldShow = () => {
    // Nie pokazuj onboarding dla anonimowych użytkowników (bez email)
    const isAnonymous = !profile?.email || profile.email === '';
    return !progress.dismissed && !progress.completed && profile?.id && !isAnonymous;
  };

  // Manual refresh function to trigger from components
  const refreshProgress = useCallback(() => {
    console.log('[Onboarding] Manual refresh triggered');
    checkSteps();
  }, [checkSteps]);

  return {
    progress,
    loading,
    dismissOnboarding,
    getCompletionPercentage,
    shouldShow,
    saveProgress,
    refreshProgress
  };
};
