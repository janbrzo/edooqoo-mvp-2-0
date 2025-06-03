
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
 * Enhanced JSON parsing with comprehensive error handling and cleaning
 */
export function parseAIResponse(jsonContent: string): any {
  if (!jsonContent || typeof jsonContent !== 'string') {
    throw new Error('Invalid JSON content: empty or not a string');
  }
  
  console.log('Original content length:', jsonContent.length);
  console.log('Content starts with:', jsonContent.substring(0, 200));
  
  let cleanJsonContent = jsonContent.trim();
  
  // Step 1: Remove markdown formatting
  if (cleanJsonContent.includes('```json')) {
    const startIndex = cleanJsonContent.indexOf('```json') + 7;
    const endIndex = cleanJsonContent.lastIndexOf('```');
    if (endIndex > startIndex) {
      cleanJsonContent = cleanJsonContent.substring(startIndex, endIndex).trim();
    }
  }
  
  // Step 2: Extract JSON structure
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON structure found in response');
  }
  
  cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  console.log('Extracted JSON length:', cleanJsonContent.length);
  
  // Step 3: Comprehensive JSON cleaning
  try {
    // Fix trailing commas
    cleanJsonContent = cleanJsonContent.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between objects and arrays
    cleanJsonContent = cleanJsonContent.replace(/}(\s*){/g, '},$1{');
    cleanJsonContent = cleanJsonContent.replace(/](\s*)\[/g, '],$1[');
    
    // Fix unescaped quotes in strings (more robust approach)
    cleanJsonContent = cleanJsonContent.replace(/(?<!\\)"(?![,}\]:]*[,}\]])/g, '\\"');
    
    // Fix common escape sequence issues
    cleanJsonContent = cleanJsonContent.replace(/\\n/g, '\\\\n');
    cleanJsonContent = cleanJsonContent.replace(/\\t/g, '\\\\t');
    
    // Remove any control characters that might break JSON
    cleanJsonContent = cleanJsonContent.replace(/[\x00-\x1F\x7F]/g, '');
    
    console.log('Attempting to parse cleaned JSON');
    const parsed = JSON.parse(cleanJsonContent);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed content is not a valid object');
    }
    
    if (!parsed.title || !parsed.exercises || !Array.isArray(parsed.exercises)) {
      throw new Error('Missing required fields: title, exercises array');
    }
    
    if (parsed.exercises.length === 0) {
      throw new Error('Exercises array is empty');
    }
    
    console.log('Successfully parsed JSON with', parsed.exercises.length, 'exercises');
    return parsed;
    
  } catch (parseError) {
    console.error('Initial JSON parsing failed:', parseError.message);
    console.error('Problematic content preview:', cleanJsonContent.substring(0, 500));
    
    // Fallback: Try to extract and reconstruct minimal structure
    try {
      console.log('Attempting fallback reconstruction...');
      
      // Extract title
      const titleMatch = cleanJsonContent.match(/"title"\s*:\s*"([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : 'Generated Worksheet';
      
      // Extract subtitle
      const subtitleMatch = cleanJsonContent.match(/"subtitle"\s*:\s*"([^"]+)"/);
      const subtitle = subtitleMatch ? subtitleMatch[1] : 'English Language Practice';
      
      // Extract introduction
      const introMatch = cleanJsonContent.match(/"introduction"\s*:\s*"([^"]+)"/);
      const introduction = introMatch ? introMatch[1] : 'This worksheet contains exercises to improve your English skills.';
      
      // Try to extract exercises array
      const exercisesMatch = cleanJsonContent.match(/"exercises"\s*:\s*\[(.*?)\]/s);
      let exercises = [];
      
      if (exercisesMatch) {
        // Try to parse individual exercises
        const exercisesText = exercisesMatch[1];
        const exerciseBlocks = exercisesText.split('},{');
        
        for (let i = 0; i < Math.min(exerciseBlocks.length, 8); i++) {
          try {
            let exerciseBlock = exerciseBlocks[i].trim();
            if (!exerciseBlock.startsWith('{')) exerciseBlock = '{' + exerciseBlock;
            if (!exerciseBlock.endsWith('}')) exerciseBlock = exerciseBlock + '}';
            
            const exercise = JSON.parse(exerciseBlock);
            if (exercise.type && exercise.title) {
              exercises.push(exercise);
            }
          } catch (e) {
            console.warn(`Failed to parse exercise ${i}:`, e.message);
          }
        }
      }
      
      // If we got at least some exercises, create minimal structure
      if (exercises.length > 0) {
        const fallbackStructure = {
          title,
          subtitle,
          introduction,
          exercises,
          vocabulary_sheet: []
        };
        
        console.log('Fallback reconstruction successful with', exercises.length, 'exercises');
        return fallbackStructure;
      }
    } catch (fallbackError) {
      console.error('Fallback reconstruction failed:', fallbackError.message);
    }
    
    throw new Error(`Failed to parse AI response: ${parseError.message}. Content length: ${cleanJsonContent.length}`);
  }
}
