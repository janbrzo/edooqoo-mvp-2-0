
import { useMemo } from 'react';
import { calculateWorksheetTimes, WorksheetTimes } from '@/utils/timeCalculator';

export const useWorksheetTimes = (lessonTime?: string): WorksheetTimes => {
  return useMemo(() => {
    if (!lessonTime) {
      return calculateWorksheetTimes('45min'); // Default fallback
    }
    return calculateWorksheetTimes(lessonTime);
  }, [lessonTime]);
};
