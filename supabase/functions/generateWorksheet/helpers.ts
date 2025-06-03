
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
 * Parses and cleans JSON content from AI response with enhanced error handling
 */
export function parseAIResponse(jsonContent: string): any {
  if (!jsonContent || typeof jsonContent !== 'string') {
    throw new Error('Invalid JSON content: empty or not a string');
  }
  
  let cleanJsonContent = jsonContent.trim();
  
  // Remove any markdown formatting or extra text
  if (cleanJsonContent.includes('```json')) {
    const startIndex = cleanJsonContent.indexOf('```json') + 7;
    const endIndex = cleanJsonContent.lastIndexOf('```');
    if (endIndex > startIndex) {
      cleanJsonContent = cleanJsonContent.substring(startIndex, endIndex).trim();
    }
  }
  
  // Remove any text before first { and after last }
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON structure found in response');
  }
  
  cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  
  // Try to fix common JSON issues
  try {
    // Fix trailing commas before } or ]
    cleanJsonContent = cleanJsonContent.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between array elements (basic fix)
    cleanJsonContent = cleanJsonContent.replace(/}(\s*){/g, '},$1{');
    cleanJsonContent = cleanJsonContent.replace(/](\s*)\[/g, '],$1[');
    
    // Fix unescaped quotes in strings (basic approach)
    cleanJsonContent = cleanJsonContent.replace(/(?<!\\)"(?=[^,}\]]*[,}\]])/g, '\\"');
    
    console.log('Attempting to parse cleaned JSON content');
    const parsed = JSON.parse(cleanJsonContent);
    
    // Validate basic structure
    if (!parsed.title || !parsed.exercises || !Array.isArray(parsed.exercises)) {
      throw new Error('Parsed JSON missing required fields (title, exercises)');
    }
    
    return parsed;
  } catch (parseError) {
    console.error('JSON parsing failed even after cleaning:', parseError);
    console.error('Cleaned content length:', cleanJsonContent.length);
    console.error('Content preview:', cleanJsonContent.substring(0, 500));
    
    // Try a more aggressive approach - extract just the exercises array if possible
    try {
      const exercisesMatch = cleanJsonContent.match(/"exercises"\s*:\s*\[(.*?)\]/s);
      if (exercisesMatch) {
        console.log('Attempting to create minimal valid structure');
        const minimalStructure = {
          title: "Generated Worksheet",
          subtitle: "English Language Practice",
          introduction: "This worksheet contains various exercises to improve your English skills.",
          exercises: [],
          vocabulary_sheet: []
        };
        
        // Try to extract just the first few exercises
        const exercisesText = exercisesMatch[1];
        const firstExercise = exercisesText.substring(0, exercisesText.indexOf('},') + 1);
        
        if (firstExercise) {
          try {
            const exercise = JSON.parse('{' + firstExercise + '}');
            minimalStructure.exercises = [exercise];
            return minimalStructure;
          } catch (e) {
            // Fall through to final error
          }
        }
      }
    } catch (e) {
      // Final fallback failed
    }
    
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}
