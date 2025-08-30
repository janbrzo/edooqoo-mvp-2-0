
import { useEffect } from 'react';
import { useOnboardingProgress } from './useOnboardingProgress';
import { useStudents } from './useStudents';
import { useWorksheetHistory } from './useWorksheetHistory';

export const useOnboardingTracking = () => {
  const { progress, markStepCompleted } = useOnboardingProgress();
  const { students } = useStudents();
  const { worksheets } = useWorksheetHistory();

  // Track when first student is added
  useEffect(() => {
    if (!progress.steps.add_student && students.length > 0) {
      markStepCompleted('add_student');
    }
  }, [students.length, progress.steps.add_student, markStepCompleted]);

  // Track when first worksheet is generated
  useEffect(() => {
    if (!progress.steps.generate_worksheet && worksheets.length > 0) {
      markStepCompleted('generate_worksheet');
    }
  }, [worksheets.length, progress.steps.generate_worksheet, markStepCompleted]);

  // Track worksheet sharing (we'll detect this through download events)
  useEffect(() => {
    const handleWorksheetShare = () => {
      if (!progress.steps.share_worksheet) {
        markStepCompleted('share_worksheet');
      }
    };

    // Listen for download events
    window.addEventListener('worksheetDownloaded', handleWorksheetShare);
    window.addEventListener('worksheetShared', handleWorksheetShare);

    return () => {
      window.removeEventListener('worksheetDownloaded', handleWorksheetShare);
      window.removeEventListener('worksheetShared', handleWorksheetShare);
    };
  }, [progress.steps.share_worksheet, markStepCompleted]);
};
