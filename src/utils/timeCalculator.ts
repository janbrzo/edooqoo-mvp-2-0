
export interface WorksheetTimes {
  warmup: number;
  grammar: number;
  exercisesTotal: number;
  suggestedPerExercise: number;
  totalLesson: number;
}

export const calculateWorksheetTimes = (lessonTime: string): WorksheetTimes => {
  const totalMinutes = lessonTime === '45min' ? 45 : 60;
  
  const warmup = 5; // Always 5 minutes
  const grammar = lessonTime === '45min' ? 10 : 15;
  const exercisesTotal = totalMinutes - warmup - grammar;
  
  // Suggest 4-5 exercises for 45min, 5-6 for 60min
  const suggestedExerciseCount = lessonTime === '45min' ? 4 : 5;
  const suggestedPerExercise = Math.round(exercisesTotal / suggestedExerciseCount);
  
  return {
    warmup,
    grammar,
    exercisesTotal,
    suggestedPerExercise,
    totalLesson: totalMinutes
  };
};

export const getExerciseTimeByType = (exerciseType: string, lessonTime: string): number => {
  const isShortLesson = lessonTime === '45min';
  
  const timeMap: Record<string, { short: number; long: number }> = {
    'reading': { short: 8, long: 10 },
    'multiple-choice': { short: 5, long: 7 },
    'fill-in-blanks': { short: 6, long: 8 },
    'matching': { short: 4, long: 6 },
    'dialogue': { short: 7, long: 9 },
    'discussion': { short: 8, long: 10 },
    'error-correction': { short: 6, long: 8 },
    'word-formation': { short: 6, long: 8 },
    'word-order': { short: 5, long: 7 },
    'true-false': { short: 5, long: 7 }
  };
  
  const times = timeMap[exerciseType] || { short: 6, long: 8 };
  return isShortLesson ? times.short : times.long;
};

export const validateWorksheetTimes = (
  warmupTime: number,
  grammarTime: number, 
  exerciseTimes: number[],
  targetTime: number
): { isValid: boolean; actualTime: number; difference: number } => {
  const actualTime = warmupTime + grammarTime + exerciseTimes.reduce((sum, time) => sum + time, 0);
  const difference = Math.abs(actualTime - targetTime);
  const isValid = difference <= 2; // Allow 2 minute tolerance
  
  return { isValid, actualTime, difference };
};
