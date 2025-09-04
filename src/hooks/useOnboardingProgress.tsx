
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

  // Check step completion function
  const checkSteps = useCallback(async () => {
    if (loading || progress.dismissed || progress.completed) return;

    console.log('[Onboarding] Checking steps...', { 
      studentsCount: students.length, 
      totalWorksheets: profile?.total_worksheets_created || 0 
    });

    const newSteps: OnboardingStep = {
      add_student: students.length > 0,
      generate_worksheet: (profile?.total_worksheets_created || 0) > 0,
      share_worksheet: false // Will be checked separately
    };

    // Check if any worksheet has been shared
    if (newSteps.generate_worksheet && profile?.id) {
      try {
        const { data: sharedWorksheets } = await supabase
          .from('worksheets')
          .select('id')
          .eq('teacher_id', profile.id)
          .not('share_token', 'is', null)
          .limit(1);
        
        newSteps.share_worksheet = (sharedWorksheets?.length || 0) > 0;
      } catch (error) {
        console.error('Error checking shared worksheets:', error);
      }
    }

    const allCompleted = Object.values(newSteps).every(step => step);
    const hasChanges = JSON.stringify(newSteps) !== JSON.stringify(progress.steps);

    console.log('[Onboarding] Step check results:', { newSteps, allCompleted, hasChanges });

    if (hasChanges || (allCompleted && !progress.completed)) {
      const newProgress: OnboardingProgress = {
        ...progress,
        steps: newSteps,
        completed: allCompleted
      };

      setProgress(newProgress);
      saveProgress(newProgress);
    }
  }, [students.length, profile?.total_worksheets_created, profile?.id, loading, progress.dismissed, progress.completed]);

  // Initial check and dependencies effect
  useEffect(() => {
    checkSteps();
  }, [students, profile, loading]);

  // Real-time subscriptions and periodic checking
  useEffect(() => {
    if (loading || progress.dismissed || progress.completed || !profile?.id) return;

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

    // Periodic check every 3 seconds when onboarding is active
    intervalRef.current = setInterval(() => {
      console.log('[Onboarding] Periodic check triggered');
      checkSteps();
    }, 3000);

    return () => {
      console.log('[Onboarding] Cleaning up subscriptions and interval');
      supabase.removeChannel(worksheetChannel);
      supabase.removeChannel(studentChannel);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profile?.id, progress.dismissed, progress.completed, loading, checkSteps]);

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
