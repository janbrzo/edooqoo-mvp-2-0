
// Main exercise validation - refactored and modular

import { getIconForType } from './exerciseHelpers.ts';
import { validateReadingExercise } from './readingValidation.ts';
import { 
  validateMatchingExercise, 
  validateMultipleChoiceExercise, 
  validateFillInBlanksExercise, 
  validateTrueFalseExercise 
} from './basicValidations.ts';
import { 
  validateDialogueExercise, 
  validateDiscussionExercise, 
  validateSentencesExercise 
} from './advancedValidations.ts';

/**
 * Validate and potentially fix an exercise
 */
export function validateExercise(exercise: any): void {
  if (!exercise.type) {
    console.error('Exercise missing type field');
    exercise.type = 'multiple-choice';
  }
  
  if (!exercise.title) {
    console.error('Exercise missing title field');
    exercise.title = `Exercise: ${exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ')}`;
  }
  
  if (!exercise.icon) {
    console.error('Exercise missing icon field');
    exercise.icon = getIconForType(exercise.type);
  }
  
  if (!exercise.time) {
    console.error('Exercise missing time field');
    exercise.time = 5;
  }
  
  if (!exercise.instructions) {
    console.error('Exercise missing instructions field');
    exercise.instructions = `Complete this ${exercise.type} exercise.`;
  }
  
  if (!exercise.teacher_tip) {
    console.error('Exercise missing teacher_tip field');
    exercise.teacher_tip = `Help students with this ${exercise.type} exercise as needed.`;
  }
  
  // Type-specific validations
  switch(exercise.type) {
    case 'reading':
      validateReadingExercise(exercise);
      break;
    case 'matching':
      validateMatchingExercise(exercise);
      break;
    case 'multiple-choice':
      validateMultipleChoiceExercise(exercise);
      break;
    case 'fill-in-blanks':
      validateFillInBlanksExercise(exercise);
      break;
    case 'dialogue':
      validateDialogueExercise(exercise);
      break;
    case 'discussion':
      validateDiscussionExercise(exercise);
      break;
    case 'true-false':
      validateTrueFalseExercise(exercise);
      break;
    case 'error-correction':
    case 'word-formation':
    case 'word-order':
      validateSentencesExercise(exercise);
      break;
  }
}
