// Helper functions used in the worksheet generator

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
  
  // For 6 exercises (45 min) - first 6 from the set
  const shortSet = [
    'reading', 
    'matching', 
    'fill-in-blanks', 
    'multiple-choice',
    'dialogue', 
    'true-false'
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
    // Removed: 'word-formation': 'fa-font',
    // Removed: 'word-order': 'fa-sort'
  };
  
  return iconMap[type] || 'fa-tasks';
}

/**
 * Generates placeholder text of specified word count
 */
export function generateFakeText(wordCount: number): string {
  const sentences = [
    "Learning a foreign language requires consistent practice and dedication.",
    "Students should focus on both speaking and listening skills to improve overall fluency.",
    "Regular vocabulary review helps to reinforce new words and phrases.",
    "Grammar exercises are important for building proper sentence structures.",
    "Reading comprehension improves with exposure to diverse texts and topics.",
    "Practicing writing helps students organize their thoughts in the target language.",
    "Cultural understanding enhances language learning and contextual usage.",
    "Listening to native speakers helps with pronunciation and intonation.",
    "Group activities encourage students to use the language in realistic scenarios.",
    "Technology can be a valuable tool for interactive language learning.",
    "Language games make the learning process more engaging and enjoyable.",
    "Watching films in the target language improves listening comprehension.",
    "Translation exercises help students understand nuances between languages.",
    "Language immersion accelerates the learning process significantly.",
    "Setting achievable goals motivates students to continue their language journey.",
  ];
  
  let text = "";
  let currentWordCount = 0;
  
  while (currentWordCount < wordCount) {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    text += " " + randomSentence;
    currentWordCount += randomSentence.split(/\s+/).length;
  }
  
  return text.trim();
}

/**
 * Parses and cleans JSON content from AI response
 */
export function parseAIResponse(jsonContent: string): any {
  // Clean the JSON content
  let cleanJsonContent = jsonContent;
  
  // Find the first occurrence of { and the last occurrence of }
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    // Extract only the text between the first { and the last }
    cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  }
  
  console.log('Attempting to parse cleaned JSON content');
  return JSON.parse(cleanJsonContent);
}
