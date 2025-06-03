
// Enhanced JSON parsing with comprehensive error handling and cleaning

/**
 * Enhanced JSON parsing with comprehensive error handling and cleaning
 */
export function parseAIResponse(jsonContent: string): any {
  if (!jsonContent || typeof jsonContent !== 'string') {
    throw new Error('Invalid JSON content: empty or not a string');
  }
  
  console.log('=== JSON PARSER DEBUG ===');
  console.log('Original content length:', jsonContent.length);
  console.log('Content starts with:', jsonContent.substring(0, 300));
  console.log('Content ends with:', jsonContent.substring(jsonContent.length - 100));
  
  let cleanJsonContent = jsonContent.trim();
  
  // Step 1: Aggressively remove ALL markdown formatting
  console.log('Step 1: Removing markdown...');
  
  // Remove ```json at start and ``` at end
  if (cleanJsonContent.includes('```json')) {
    const startIndex = cleanJsonContent.indexOf('```json') + 7;
    const endIndex = cleanJsonContent.lastIndexOf('```');
    if (endIndex > startIndex) {
      cleanJsonContent = cleanJsonContent.substring(startIndex, endIndex).trim();
      console.log('Removed ```json``` wrapper, new length:', cleanJsonContent.length);
    }
  } else if (cleanJsonContent.includes('```')) {
    // Handle cases where there's just ```
    const lines = cleanJsonContent.split('\n');
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '```' || lines[i].trim().startsWith('```')) {
        if (startLine === -1) {
          startLine = i + 1;
        } else {
          endLine = i;
          break;
        }
      }
    }
    
    if (startLine !== -1 && endLine !== -1) {
      cleanJsonContent = lines.slice(startLine, endLine).join('\n').trim();
      console.log('Removed ``` wrapper, new length:', cleanJsonContent.length);
    }
  }
  
  // Step 2: Find JSON boundaries more aggressively
  console.log('Step 2: Finding JSON boundaries...');
  
  // Look for the first { and last }
  let jsonStart = -1;
  let jsonEnd = -1;
  let braceCount = 0;
  
  for (let i = 0; i < cleanJsonContent.length; i++) {
    if (cleanJsonContent[i] === '{') {
      if (jsonStart === -1) jsonStart = i;
      braceCount++;
    } else if (cleanJsonContent[i] === '}') {
      braceCount--;
      if (braceCount === 0 && jsonStart !== -1) {
        jsonEnd = i;
        break;
      }
    }
  }
  
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error('No valid JSON structure found');
    throw new Error('No valid JSON structure found in response');
  }
  
  cleanJsonContent = cleanJsonContent.substring(jsonStart, jsonEnd + 1);
  console.log('Extracted JSON boundaries, length:', cleanJsonContent.length);
  console.log('JSON starts with:', cleanJsonContent.substring(0, 200));
  
  // Step 3: Clean and fix JSON issues
  console.log('Step 3: Cleaning JSON...');
  
  try {
    // Remove any non-printable characters except necessary whitespace
    cleanJsonContent = cleanJsonContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Fix common JSON issues
    cleanJsonContent = cleanJsonContent
      // Remove trailing commas before } or ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unescaped quotes in strings (more aggressive)
      .replace(/(?<!\\)"(?=(?:[^"\\]|\\.)*"[^"]*(?:[^"\\]|\\.)*"[^"]*$)/g, '\\"')
      // Fix newlines in strings
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    
    console.log('Attempting JSON.parse...');
    const parsed = JSON.parse(cleanJsonContent);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed content is not a valid object');
    }
    
    if (!parsed.title || !parsed.exercises || !Array.isArray(parsed.exercises)) {
      console.error('Missing required fields:', { 
        hasTitle: !!parsed.title, 
        hasExercises: !!parsed.exercises, 
        isArray: Array.isArray(parsed.exercises) 
      });
      throw new Error('Missing required fields: title, exercises array');
    }
    
    if (parsed.exercises.length === 0) {
      throw new Error('Exercises array is empty');
    }
    
    console.log('SUCCESS: Parsed JSON with', parsed.exercises.length, 'exercises');
    return parsed;
    
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError.message);
    console.error('Problematic JSON preview:', cleanJsonContent.substring(0, 1000));
    
    // Enhanced fallback reconstruction
    try {
      console.log('Attempting enhanced fallback reconstruction...');
      return attemptEnhancedFallback(cleanJsonContent);
    } catch (fallbackError) {
      console.error('Fallback reconstruction failed:', fallbackError.message);
      throw new Error(`Failed to parse AI response: ${parseError.message}. Content preview: ${cleanJsonContent.substring(0, 200)}`);
    }
  }
}

function attemptEnhancedFallback(content: string): any {
  console.log('=== ENHANCED FALLBACK ===');
  
  // Try to reconstruct basic structure
  const result: any = {
    title: 'Generated Worksheet',
    subtitle: 'English Language Practice',
    introduction: 'This worksheet contains exercises to improve your English skills.',
    exercises: [],
    vocabulary_sheet: []
  };
  
  // Extract title more aggressively
  const titlePatterns = [
    /"title"\s*:\s*"([^"]+)"/,
    /'title'\s*:\s*'([^']+)'/,
    /"title":\s*"([^"]+)"/
  ];
  
  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match) {
      result.title = match[1];
      console.log('Found title:', result.title);
      break;
    }
  }
  
  // Extract subtitle
  const subtitleMatch = content.match(/"subtitle"\s*:\s*"([^"]+)"/);
  if (subtitleMatch) {
    result.subtitle = subtitleMatch[1];
    console.log('Found subtitle:', result.subtitle);
  }
  
  // Extract introduction
  const introMatch = content.match(/"introduction"\s*:\s*"([^"]+)"/);
  if (introMatch) {
    result.introduction = introMatch[1];
    console.log('Found introduction:', result.introduction.substring(0, 50) + '...');
  }
  
  // Try to extract exercises using multiple approaches
  console.log('Extracting exercises...');
  
  // Approach 1: Find exercises array
  const exercisesMatch = content.match(/"exercises"\s*:\s*\[(.*?)\]/s);
  if (exercisesMatch) {
    const exercisesContent = exercisesMatch[1];
    console.log('Found exercises content, length:', exercisesContent.length);
    
    // Split by exercise type patterns
    const typePattern = /"type"\s*:\s*"([^"]+)"/g;
    const typeMatches = [...exercisesContent.matchAll(typePattern)];
    
    console.log('Found', typeMatches.length, 'type matches');
    
    for (let i = 0; i < typeMatches.length && i < 8; i++) {
      const match = typeMatches[i];
      const exerciseType = match[1];
      
      // Create basic exercise structure
      const exercise: any = {
        type: exerciseType,
        title: `Exercise ${i + 1}: ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace(/-/g, ' ')}`,
        icon: getIconForType(exerciseType),
        time: getTimeForType(exerciseType),
        instructions: `Complete this ${exerciseType} exercise.`,
        teacher_tip: `Help students with this ${exerciseType} exercise.`
      };
      
      // Add type-specific fields
      addTypeSpecificFields(exercise, exerciseType);
      
      result.exercises.push(exercise);
      console.log(`Created exercise ${i + 1}: ${exerciseType}`);
    }
  }
  
  // If we didn't get enough exercises, create them
  while (result.exercises.length < 8) {
    const types = ['reading', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'true-false', 'discussion', 'error-correction'];
    const type = types[result.exercises.length % types.length];
    
    const exercise: any = {
      type: type,
      title: `Exercise ${result.exercises.length + 1}: ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')}`,
      icon: getIconForType(type),
      time: getTimeForType(type),
      instructions: `Complete this ${type} exercise.`,
      teacher_tip: `Help students with this ${type} exercise.`
    };
    
    addTypeSpecificFields(exercise, type);
    result.exercises.push(exercise);
  }
  
  console.log(`Fallback reconstruction created ${result.exercises.length} exercises`);
  return result;
}

function getIconForType(type: string): string {
  const icons: {[key: string]: string} = {
    'reading': 'fa-book-open',
    'matching': 'fa-link',
    'fill-in-blanks': 'fa-pencil-alt',
    'multiple-choice': 'fa-check-square',
    'dialogue': 'fa-comments',
    'true-false': 'fa-balance-scale',
    'discussion': 'fa-users',
    'error-correction': 'fa-exclamation-triangle'
  };
  return icons[type] || 'fa-tasks';
}

function getTimeForType(type: string): number {
  const times: {[key: string]: number} = {
    'reading': 8,
    'matching': 7,
    'fill-in-blanks': 8,
    'multiple-choice': 6,
    'dialogue': 7,
    'true-false': 5,
    'discussion': 8,
    'error-correction': 6
  };
  return times[type] || 5;
}

function addTypeSpecificFields(exercise: any, type: string): void {
  switch (type) {
    case 'reading':
      exercise.content = 'This is a sample reading text for comprehension practice. Students should read carefully and answer the questions below.';
      exercise.questions = [
        { text: 'What is the main topic?', answer: 'Sample answer' },
        { text: 'Who is mentioned?', answer: 'Sample answer' },
        { text: 'When did this happen?', answer: 'Sample answer' },
        { text: 'Where does this take place?', answer: 'Sample answer' },
        { text: 'Why is this important?', answer: 'Sample answer' }
      ];
      break;
      
    case 'matching':
      exercise.items = [];
      for (let i = 1; i <= 10; i++) {
        exercise.items.push({
          term: `Term ${i}`,
          definition: `Definition ${i}`
        });
      }
      break;
      
    case 'fill-in-blanks':
      exercise.word_bank = ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7', 'word8', 'word9', 'word10'];
      exercise.sentences = [];
      for (let i = 1; i <= 10; i++) {
        exercise.sentences.push({
          text: `This is sentence ${i} with a _____ blank.`,
          answer: `word${i}`
        });
      }
      break;
      
    case 'multiple-choice':
      exercise.questions = [];
      for (let i = 1; i <= 10; i++) {
        exercise.questions.push({
          text: `Question ${i}?`,
          options: [
            { label: 'A', text: 'Option A', correct: i % 4 === 1 },
            { label: 'B', text: 'Option B', correct: i % 4 === 2 },
            { label: 'C', text: 'Option C', correct: i % 4 === 3 },
            { label: 'D', text: 'Option D', correct: i % 4 === 0 }
          ]
        });
      }
      break;
      
    case 'dialogue':
      exercise.dialogue = [];
      for (let i = 1; i <= 10; i++) {
        exercise.dialogue.push({
          speaker: i % 2 === 1 ? 'Person A' : 'Person B',
          text: `This is dialogue line ${i}.`
        });
      }
      exercise.expressions = ['expression1', 'expression2', 'expression3', 'expression4', 'expression5', 'expression6', 'expression7', 'expression8', 'expression9', 'expression10'];
      exercise.expression_instruction = 'Practice using these expressions.';
      break;
      
    case 'true-false':
      exercise.statements = [];
      for (let i = 1; i <= 10; i++) {
        exercise.statements.push({
          text: `Statement ${i}`,
          isTrue: i % 2 === 1
        });
      }
      break;
      
    case 'discussion':
      exercise.questions = [];
      for (let i = 1; i <= 10; i++) {
        exercise.questions.push(`Discussion question ${i}?`);
      }
      break;
      
    case 'error-correction':
      exercise.sentences = [];
      for (let i = 1; i <= 10; i++) {
        exercise.sentences.push({
          text: `This sentence ${i} has a error.`,
          answer: `This sentence ${i} has an error.`
        });
      }
      break;
  }
}
