
// Helper functions used in the worksheet generator

/**
 * System prompt for OpenAI to generate worksheets
 */
export const SYSTEM_PROMPT = `You are an expert English teacher creating comprehensive worksheets for adult ESL students (1-on-1 lessons).

CRITICAL REQUIREMENTS:
1. Generate EXACTLY the requested number of exercises based on lesson duration
2. Always include a vocabulary_sheet with 10-15 relevant terms
3. All content must be appropriate for the specified English level
4. Include detailed teacher instructions for each exercise
5. Ensure exercises progress logically in difficulty

EXERCISE TYPES TO USE:
- reading (always include 300-word text with 5 comprehension questions)
- matching (vocabulary/concept matching)
- fill-in-blanks (5-8 sentences with grammar focus)
- multiple-choice (5-6 questions)
- dialogue (conversation practice)
- true-false (5-6 statements)
- discussion (3-4 thought-provoking questions)
- error-correction (5-6 sentences with common mistakes)

LESSON DURATION REQUIREMENTS:
- 30 min: Generate exactly 4 exercises
- 45 min: Generate exactly 6 exercises  
- 60 min: Generate exactly 8 exercises

OUTPUT FORMAT: Return valid JSON only, no additional text.`;

/**
 * Gets exercise types based on count of exercises needed
 * Now uses constant sets for consistent generation
 */
export function getExerciseTypesForCount(count: number): string[] {
  // Standard 8-exercise set (60 min lessons)
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
  
  // Always return the full 8-exercise set
  // The main function will trim to 6 if needed for 45 min lessons
  return fullSet;
}

/**
 * Gets missing exercise types from what we already have
 * Simplified since we now always generate the full set
 */
export function getExerciseTypesForMissing(existingExercises: any[], allTypes: string[]): string[] {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

/**
 * Gets expected exercise count based on lesson time
 */
export function getExpectedExerciseCount(lessonTime: string): number {
  if (lessonTime.includes('30')) return 4;
  if (lessonTime.includes('45')) return 6;
  return 8; // 60min or longer
}

/**
 * Creates OpenAI messages array for chat completion
 */
export function createOpenAIMessages(prompt: string, formData: any): any[] {
  const systemMessage = {
    role: "system",
    content: SYSTEM_PROMPT
  };

  const userMessage = {
    role: "user", 
    content: `Create a comprehensive English worksheet with the following requirements:

${prompt}

Lesson Duration: ${formData.lessonTime}
Required Exercises: ${getExpectedExerciseCount(formData.lessonTime)}

Generate a complete worksheet as JSON with this structure:
{
  "title": "Engaging worksheet title",
  "subtitle": "Brief description",
  "introduction": "Lesson introduction for students",
  "warmup_questions": [4 conversation starter questions],
  "grammar_rules": "Grammar explanation if teaching preferences include grammar focus",
  "exercises": [array of ${getExpectedExerciseCount(formData.lessonTime)} exercise objects],
  "vocabulary_sheet": [array of 10-15 vocabulary terms with definitions]
}`
  };

  return [systemMessage, userMessage];
}

/**
 * Calls OpenAI API and returns the response
 */
export async function callOpenAI(messages: any[]): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🤖 Calling OpenAI with', messages.length, 'messages');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', response.status, errorData);
    throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid OpenAI response format');
  }

  return data.choices[0].message.content;
}

/**
 * Parses and validates OpenAI response, returns structured worksheet data
 */
export function parseWorksheetResponse(aiResponse: string, lessonTime: string): any {
  console.log('📋 Parsing AI response, length:', aiResponse.length);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = aiResponse.trim();
    
    // Find JSON boundaries
    const firstBrace = cleanResponse.indexOf('{');
    const lastBrace = cleanResponse.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
    }
    
    const parsedData = JSON.parse(cleanResponse);
    
    // Validate required fields
    if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
      throw new Error('Missing or invalid exercises array');
    }
    
    // Ensure we have the right number of exercises
    const expectedCount = getExpectedExerciseCount(lessonTime);
    if (parsedData.exercises.length !== expectedCount) {
      console.warn(`Expected ${expectedCount} exercises, got ${parsedData.exercises.length}. Adjusting...`);
      
      if (parsedData.exercises.length > expectedCount) {
        parsedData.exercises = parsedData.exercises.slice(0, expectedCount);
      }
    }
    
    // Ensure vocabulary sheet exists
    if (!parsedData.vocabulary_sheet || !Array.isArray(parsedData.vocabulary_sheet)) {
      parsedData.vocabulary_sheet = createDefaultVocabulary();
    }
    
    console.log('✅ Successfully parsed worksheet with', parsedData.exercises.length, 'exercises');
    return parsedData;
    
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.log('Raw response:', aiResponse.substring(0, 500));
    throw new Error(`Failed to parse worksheet data: ${error.message}`);
  }
}

/**
 * Creates default vocabulary if none provided
 */
function createDefaultVocabulary(): any[] {
  return [
    { term: "Essential", meaning: "Absolutely necessary; extremely important" },
    { term: "Comprehensive", meaning: "Complete and including everything that is necessary" },
    { term: "Efficient", meaning: "Working in a well-organized way" },
    { term: "Innovative", meaning: "Using new methods or ideas" },
    { term: "Significant", meaning: "Important or noticeable" },
    { term: "Collaborate", meaning: "Work jointly on an activity" },
    { term: "Analyze", meaning: "Examine in detail" },
    { term: "Implement", meaning: "Put a decision or plan into effect" },
    { term: "Evaluate", meaning: "Form an idea of the amount or value" },
    { term: "Optimize", meaning: "Make the best use of something" }
  ];
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
    'true-false': 'fa-balance-scale'
  };
  
  return iconMap[type] || 'fa-tasks';
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
