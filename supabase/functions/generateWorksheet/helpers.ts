
// Main helper functions - refactored and simplified

import { getExerciseTypesForCount, getExerciseTypesForMissing, getIconForType } from './exerciseHelpers.ts';
import { generateFakeText } from './textHelpers.ts';
import { parseAIResponse } from './jsonParser.ts';

// Re-export functions for backward compatibility
export {
  getExerciseTypesForCount,
  getExerciseTypesForMissing,
  getIconForType,
  generateFakeText,
  parseAIResponse
};
