
import { useState, useEffect } from 'react';
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

  // Check step completion
  useEffect(() => {
    if (loading || progress.dismissed || progress.completed) return;

    const checkSteps = async () => {
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

      if (hasChanges || (allCompleted && !progress.completed)) {
        const newProgress: OnboardingProgress = {
          ...progress,
          steps: newSteps,
          completed: allCompleted
        };

        setProgress(newProgress);
        saveProgress(newProgress);
      }
    };

    checkSteps();
  }, [students, profile, loading, progress]);

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
    return !progress.dismissed && !progress.completed && profile?.id;
  };

  return {
    progress,
    loading,
    dismissOnboarding,
    getCompletionPercentage,
    shouldShow,
    saveProgress
  };
};
