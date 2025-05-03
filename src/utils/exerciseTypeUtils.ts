
/**
 * Utilities for exercise type management and configuration
 */

// Definition of exercise types available in the system
export const EXERCISE_TYPES = {
  READING: 'reading',
  MATCHING: 'matching',
  FILL_IN_BLANKS: 'fill-in-blanks',
  MULTIPLE_CHOICE: 'multiple-choice',
  DIALOGUE: 'dialogue',
  DISCUSSION: 'discussion',
  ERROR_CORRECTION: 'error-correction',
  WORD_FORMATION: 'word-formation',
  WORD_ORDER: 'word-order',
  TRUE_FALSE: 'true-false'
} as const;

// Type for exercise types
export type ExerciseType = typeof EXERCISE_TYPES[keyof typeof EXERCISE_TYPES];

// Get exercise counts based on lesson duration
export const getExerciseCountByDuration = (lessonTime: string): number => {
  switch (lessonTime) {
    case "30 min":
      return 4;  // 30 minutes = 4 exercises
    case "45 min":
      return 6;  // 45 minutes = 6 exercises
    default:
      return 8;  // 60 minutes (or default) = 8 exercises
  }
};

// Get exercise types by language level and learning goal
export const getExerciseTypes = (lessonTime: string): ExerciseType[] => {
  // Base set of exercises that are always included
  const coreExercises: ExerciseType[] = [
    EXERCISE_TYPES.READING,
    EXERCISE_TYPES.MULTIPLE_CHOICE,
    EXERCISE_TYPES.MATCHING,
    EXERCISE_TYPES.FILL_IN_BLANKS
  ];
  
  // Additional exercises based on lesson duration
  if (lessonTime === "30 min") {
    return coreExercises;
  } else if (lessonTime === "45 min") {
    return [
      ...coreExercises,
      EXERCISE_TYPES.DISCUSSION,
      EXERCISE_TYPES.TRUE_FALSE
    ];
  } else {
    return [
      ...coreExercises,
      EXERCISE_TYPES.DISCUSSION,
      EXERCISE_TYPES.TRUE_FALSE,
      EXERCISE_TYPES.ERROR_CORRECTION,
      EXERCISE_TYPES.DIALOGUE
    ];
  }
};

// Creates a prompt with specific exercise types and counts for ChatGPT
export const createExercisePrompt = (lessonTime: string): string => {
  const exerciseCount = getExerciseCountByDuration(lessonTime);
  const exerciseTypes = getExerciseTypes(lessonTime);
  
  // Create a string listing the exercise types
  const exerciseList = exerciseTypes.map((type, index) => {
    // Format the type name for display
    const typeName = type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `${index + 1}. ${typeName}`;
  }).join('\n');
  
  return `
You must include EXACTLY ${exerciseCount} exercises for this ${lessonTime} lesson.

The reading exercise MUST contain 280-320 words (not less, not more).

The exercises must include these specific types in this order:
${exerciseList}

Each exercise must have a clear title, instructions, and appropriate content.
`;
};
