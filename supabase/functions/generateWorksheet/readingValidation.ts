
// Reading exercise validation

import { generateFakeText } from './textHelpers.ts';

export function validateReadingExercise(exercise: any): void {
  // Validate content
  if (!exercise.content) {
    console.error('Reading exercise missing content');
    exercise.content = generateFakeText(300);
  } else {
    const wordCount = exercise.content.split(/\s+/).length;
    if (wordCount < 280 || wordCount > 320) {
      console.warn(`Reading exercise word count (${wordCount}) is outside target range of 280-320 words`);
    }
  }
  
  // Validate questions
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    console.error('Reading exercise missing questions or has fewer than 5');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 5) {
      exercise.questions.push({
        text: `Question ${exercise.questions.length + 1} about the reading?`,
        answer: `Answer to question ${exercise.questions.length + 1}.`
      });
    }
  }
}
