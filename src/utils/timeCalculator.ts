
export interface WorksheetTimes {
  warmup: number;
  grammar: number;
  exercisesTotal: number;
  suggestedPerExercise: number;
  totalLesson: number;
}

export const calculateWorksheetTimes = (lessonTime: string, hasGrammar: boolean = true): WorksheetTimes => {
  const totalMinutes = lessonTime === '45min' ? 45 : 60;
  
  const warmup = 5; // Always 5 minutes
  const grammar = hasGrammar ? (lessonTime === '45min' ? 10 : 15) : 0;
  const exercisesTotal = totalMinutes - warmup - grammar;
  
  // Calculate suggested exercise count and time
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

// Fixed exercise times based on lesson duration and grammar presence
export const getExerciseTimeByType = (exerciseType: string, lessonTime: string, hasGrammar: boolean = true): number => {
  const timeMap = {
    '45min': {
      withGrammar: { // 45min total: 5 warmup + 10 grammar + 30 exercises = 45min
        'reading': 8,
        'multiple-choice': 6,
        'fill-in-blanks': 7,
        'matching': 5,
        'dialogue': 8,
        'discussion': 8,
        'error-correction': 6,
        'word-formation': 6,
        'word-order': 5,
        'true-false': 5
      },
      withoutGrammar: { // 45min total: 5 warmup + 0 grammar + 40 exercises = 45min
        'reading': 10,
        'multiple-choice': 8,
        'fill-in-blanks': 9,
        'matching': 7,
        'dialogue': 10,
        'discussion': 10,
        'error-correction': 8,
        'word-formation': 8,
        'word-order': 7,
        'true-false': 7
      }
    },
    '60min': {
      withGrammar: { // 60min total: 5 warmup + 15 grammar + 40 exercises = 60min
        'reading': 10,
        'multiple-choice': 8,
        'fill-in-blanks': 9,
        'matching': 6,
        'dialogue': 10,
        'discussion': 10,
        'error-correction': 8,
        'word-formation': 8,
        'word-order': 6,
        'true-false': 6
      },
      withoutGrammar: { // 60min total: 5 warmup + 0 grammar + 55 exercises = 60min
        'reading': 14,
        'multiple-choice': 11,
        'fill-in-blanks': 12,
        'matching': 9,
        'dialogue': 13,
        'discussion': 13,
        'error-correction': 11,
        'word-formation': 11,
        'word-order': 9,
        'true-false': 9
      }
    }
  };
  
  const lessonConfig = timeMap[lessonTime as keyof typeof timeMap];
  const grammarConfig = hasGrammar ? lessonConfig.withGrammar : lessonConfig.withoutGrammar;
  
  return grammarConfig[exerciseType as keyof typeof grammarConfig] || (hasGrammar ? 6 : 8);
};

export const validateWorksheetTimes = (
  warmupTime: number,
  grammarTime: number, 
  exerciseTimes: number[],
  targetTime: number
): { isValid: boolean; actualTime: number; difference: number } => {
  const actualTime = warmupTime + grammarTime + exerciseTimes.reduce((sum, time) => sum + time, 0);
  const difference = Math.abs(actualTime - targetTime);
  const isValid = difference <= 1; // Allow 1 minute tolerance
  
  return { isValid, actualTime, difference };
};
