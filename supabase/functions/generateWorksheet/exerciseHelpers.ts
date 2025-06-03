
// Exercise-specific helper functions

/**
 * Gets exercise types based on count of exercises needed
 * NEW LOGIC: Fixed exercise sets instead of dynamic selection
 */
export function getExerciseTypesForCount(count: number): string[] {
  // For 8 exercises (60 min) - complete set
  const fullSet = [
    'reading', 
    'matching', 
    'fill-in-blanks', 
    'multiple-choice',
    'dialogue', 
    'true-false', 
    'discussion', 
    'error-correction'
  ];
  
  // Always return the full 8-exercise set for generation
  // Frontend logic will trim to 6 if needed
  return fullSet;
}

/**
 * Gets missing exercise types from what we already have
 * This function is now less relevant but kept for backward compatibility
 */
export function getExerciseTypesForMissing(existingExercises: any[], allTypes: string[]): string[] {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

/**
 * Assigns icon based on exercise type
 */
export function getIconForType(type: string): string {
  const iconMap: {[key: string]: string} = {
    'multiple-choice': 'fa-check-square',
    'reading': 'fa-book-open',
    'matching': 'fa-link',
    'fill-in-blanks': 'fa-pencil-alt',
    'dialogue': 'fa-comments',
    'discussion': 'fa-users',
    'error-correction': 'fa-exclamation-triangle',
    'true-false': 'fa-balance-scale',
  };
  
  return iconMap[type] || 'fa-tasks';
}
