
// Enhanced JSON parsing with comprehensive error handling and cleaning

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
  
  // Step 1: Remove markdown formatting more aggressively
  if (cleanJsonContent.includes('```json')) {
    const startIndex = cleanJsonContent.indexOf('```json') + 7;
    const endIndex = cleanJsonContent.lastIndexOf('```');
    if (endIndex > startIndex) {
      cleanJsonContent = cleanJsonContent.substring(startIndex, endIndex).trim();
    }
  } else if (cleanJsonContent.includes('```')) {
    // Handle cases where there's just ``` without json
    const firstTriple = cleanJsonContent.indexOf('```');
    const lastTriple = cleanJsonContent.lastIndexOf('```');
    if (lastTriple > firstTriple) {
      const possibleJson = cleanJsonContent.substring(firstTriple + 3, lastTriple).trim();
      if (possibleJson.startsWith('{')) {
        cleanJsonContent = possibleJson;
      }
    }
  }
  
  // Step 2: Extract JSON structure - look for the outermost braces
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON structure found in response');
  }
  
  cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  console.log('Extracted JSON length:', cleanJsonContent.length);
  
  // Step 3: Comprehensive JSON cleaning and fixing
  try {
    // Remove any non-printable characters except newlines and tabs
    cleanJsonContent = cleanJsonContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Fix common JSON issues more aggressively
    cleanJsonContent = cleanJsonContent
      // Remove trailing commas before } or ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Add missing commas between objects
      .replace(/}(\s*){/g, '},$1{')
      // Add missing commas between arrays
      .replace(/](\s*)\[/g, '],$1[')
      // Fix unescaped quotes in strings - improved pattern
      .replace(/(?<!\\)"(?![,}\]\s]*[,}\]])/g, '\\"')
      // Fix newlines and control characters in strings
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      // Remove any leftover markdown or text before/after JSON
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '');
    
    console.log('Attempting to parse cleaned JSON');
    const parsed = JSON.parse(cleanJsonContent);
    
    // Validate basic structure
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
    
    // Enhanced fallback: Try to reconstruct from fragments
    try {
      console.log('Attempting enhanced fallback reconstruction...');
      return attemptFallbackReconstruction(cleanJsonContent);
    } catch (fallbackError) {
      console.error('Fallback reconstruction failed:', fallbackError.message);
      throw new Error(`Failed to parse AI response: ${parseError.message}. Content length: ${cleanJsonContent.length}`);
    }
  }
}

function attemptFallbackReconstruction(content: string): any {
  // Extract title
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Generated Worksheet';
  
  // Extract subtitle
  const subtitleMatch = content.match(/"subtitle"\s*:\s*"([^"]+)"/);
  const subtitle = subtitleMatch ? subtitleMatch[1] : 'English Language Practice';
  
  // Extract introduction
  const introMatch = content.match(/"introduction"\s*:\s*"([^"]+)"/);
  const introduction = introMatch ? introMatch[1] : 'This worksheet contains exercises to improve your English skills.';
  
  // Try to extract exercises array with improved regex
  const exercisesMatch = content.match(/"exercises"\s*:\s*\[(.*?)\]/s);
  let exercises = [];
  
  if (exercisesMatch) {
    // Split by exercise boundaries more carefully
    const exercisesText = exercisesMatch[1];
    const exercisePattern = /{\s*"type"\s*:\s*"[^"]+"/g;
    const matches = [...exercisesText.matchAll(exercisePattern)];
    
    for (let i = 0; i < matches.length && i < 8; i++) {
      try {
        const start = matches[i].index;
        const end = i < matches.length - 1 ? matches[i + 1].index : exercisesText.length;
        let exerciseText = exercisesText.substring(start, end).trim();
        
        // Clean up the exercise text
        if (exerciseText.endsWith(',')) {
          exerciseText = exerciseText.slice(0, -1);
        }
        if (!exerciseText.endsWith('}')) {
          exerciseText += '}';
        }
        
        const exercise = JSON.parse(exerciseText);
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
    
    console.log('Enhanced fallback reconstruction successful with', exercises.length, 'exercises');
    return fallbackStructure;
  }
  
  throw new Error('Could not reconstruct any valid exercises from the response');
}
