
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthFlow } from './useAuthFlow';

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

export const useOnboardingProgress = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const [progress, setProgress] = useState<OnboardingProgress>({
    steps: {
      add_student: false,
      generate_worksheet: false,
      share_worksheet: false
    },
    completed: false,
    dismissed: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRegisteredUser && user) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user, isRegisteredUser]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_progress')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.onboarding_progress) {
        setProgress(data.onboarding_progress as OnboardingProgress);
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('onboarding_progress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newProgress: Partial<OnboardingProgress>) => {
    const updatedProgress = { ...progress, ...newProgress };
    
    // Check if all steps are completed
    const allStepsCompleted = Object.values(updatedProgress.steps).every(step => step);
    if (allStepsCompleted && !updatedProgress.completed) {
      updatedProgress.completed = true;
    }

    setProgress(updatedProgress);

    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_progress: updatedProgress })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      // Fallback to localStorage
      localStorage.setItem('onboarding_progress', JSON.stringify(updatedProgress));
    }
  };

  const markStepCompleted = (step: keyof OnboardingStep) => {
    updateProgress({
      steps: {
        ...progress.steps,
        [step]: true
      }
    });
  };

  const dismissOnboarding = () => {
    updateProgress({ dismissed: true });
  };

  const getCompletionPercentage = () => {
    const completedSteps = Object.values(progress.steps).filter(step => step).length;
    const totalSteps = Object.keys(progress.steps).length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  return {
    progress,
    loading,
    markStepCompleted,
    dismissOnboarding,
    getCompletionPercentage,
    refetch: fetchProgress
  };
};
