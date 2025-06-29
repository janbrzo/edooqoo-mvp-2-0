
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

// Fixed exercise times based on lesson duration and grammar presence - updated with exact specifications
export const getExerciseTimeByType = (exerciseType: string, lessonTime: string, hasGrammar: boolean = true): number => {
  const timeMap = {
    '45min': {
      withGrammar: { // 45min total: 5 warmup + 10 grammar + 30 exercises = 45min
        'reading': 7,
        'multiple-choice': 5,
        'fill-in-blanks': 4,
        'matching': 5,
        'dialogue': 6,
        'discussion': 0, // Obcięte w 45min
        'error-correction': 0, // Obcięte w 45min
        'word-formation': 4,
        'word-order': 4,
        'true-false': 3
      },
      withoutGrammar: { // 45min total: 5 warmup + 0 grammar + 40 exercises = 45min
        'reading': 9,
        'multiple-choice': 7,
        'fill-in-blanks': 5,
        'matching': 6,
        'dialogue': 8,
        'discussion': 0, // Obcięte w 45min
        'error-correction': 0, // Obcięte w 45min
        'word-formation': 5,
        'word-order': 5,
        'true-false': 5
      }
    },
    '60min': {
      withGrammar: { // 60min total: 5 warmup + 15 grammar + 40 exercises = 60min
        'reading': 7,
        'multiple-choice': 5,
        'fill-in-blanks': 4,
        'matching': 5,
        'dialogue': 6,
        'discussion': 6,
        'error-correction': 4,
        'word-formation': 4,
        'word-order': 4,
        'true-false': 3
      },
      withoutGrammar: { // 60min total: 5 warmup + 0 grammar + 55 exercises = 60min
        'reading': 9,
        'multiple-choice': 7,
        'fill-in-blanks': 5,
        'matching': 6,
        'dialogue': 8,
        'discussion': 9,
        'error-correction': 6,
        'word-formation': 6,
        'word-order': 6,
        'true-false': 5
      }
    }
  };
  
  const lessonConfig = timeMap[lessonTime as keyof typeof timeMap];
  const grammarConfig = hasGrammar ? lessonConfig.withGrammar : lessonConfig.withoutGrammar;
  
  return grammarConfig[exerciseType as keyof typeof grammarConfig] || 0;
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
