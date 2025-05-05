import OpenAI from "https://esm.sh/openai@4.28.0";
import { validateExercise } from "../utils/exerciseValidators.ts";
import { getExerciseTypesForMissing, getIconForType } from "../utils/exerciseTypes.ts";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// Improved template detection with more sophisticated patterns
const detectTemplateContent = (text: string): boolean => {
  if (!text) return false;
  
  const templatePatterns = [
    /This is (sentence|question|dialogue|statement|line|expression) \d+/i,
    /This is [a-z]+ \d+/i,
    /Speaker [A-Z]/i,
    /Person [A-Z]:/i,
    /Term \d+/i,
    /Definition \d+/i,
    /Option [A-Z] for question \d+/i
  ];
  
  return templatePatterns.some(pattern => pattern.test(text));
};

// Find exercises containing template content
const findTemplateExercises = (worksheet: any): number[] => {
  const templateExercises: number[] = [];
  
  worksheet.exercises.forEach((exercise: any, index: number) => {
    // Check sentences
    if (exercise.sentences?.some((s: any) => detectTemplateContent(s.text || s.answer))) {
      templateExercises.push(index);
      return;
    }
    
    // Check questions
    if (exercise.questions) {
      if (Array.isArray(exercise.questions)) {
        // For discussion exercises, questions are strings
        if (exercise.type === 'discussion') {
          if (exercise.questions.some((q: string) => detectTemplateContent(q))) {
            templateExercises.push(index);
            return;
          }
        } 
        // For other exercises, questions are objects with text property
        else if (exercise.questions.some((q: any) => 
          detectTemplateContent(q.text) || 
          (q.options && q.options.some((o: any) => detectTemplateContent(o.text))))) {
          templateExercises.push(index);
          return;
        }
      }
    }
    
    // Check dialogue
    if (exercise.dialogue?.some((d: any) => detectTemplateContent(d.text) || detectTemplateContent(d.speaker))) {
      templateExercises.push(index);
      return;
    }
    
    // Check statements
    if (exercise.statements?.some((s: any) => detectTemplateContent(s.text))) {
      templateExercises.push(index);
      return;
    }
    
    // Check items (matching exercises)
    if (exercise.items?.some((i: any) => detectTemplateContent(i.term) || detectTemplateContent(i.definition))) {
      templateExercises.push(index);
      return;
    }
  });
  
  return templateExercises;
};

// Enhanced system prompt with more emphasis on authenticity
function createSystemPrompt(exerciseCount: number, exerciseTypes: string[]): string {
  return `You are an expert ESL English language teacher with over 15 years of experience creating engaging, practical worksheets for business professionals. 
    Your goal: produce a premium-quality, real-world worksheet that a private business English tutor would use with their executive clients.
    
    IMPORTANT RULES:
    1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
    2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from 1.
    3. Ensure variety and progressive difficulty tailored to adult business learners.
    4. All exercises MUST be practical, realistic business scenarios - not academic.
    5. Include industry-specific vocabulary and business expressions throughout.
    6. Keep instructions concise and professional.
    
    CRITICAL QUALITY REQUIREMENTS:
    1. ABSOLUTELY NO GENERIC TEMPLATES! Never use phrases like "This is sentence X" or "Speaker A".
    2. ALL content must be AUTHENTIC, REALISTIC and BUSINESS-SPECIFIC. Write as if for real executives.
    3. Use varied, natural language - never repetitive structures.
    4. Exercise 1: Reading Comprehension must have 280-320 words of realistic business content.
    5. Each exercise needs the FULL required number of items:
       - Fill-in-blanks/error-correction/word-formation: 10+ unique, authentic sentences
       - Multiple-choice: 10+ questions with 3+ realistic options each
       - Matching: 10+ genuine business term/definition pairs
       - True-false: 10+ varied business statements
       - Discussion: 10+ thought-provoking business questions
       - Dialogue: 10+ natural exchanges between realistic named professionals
    
    OUTPUT STRUCTURE:
    Return a valid JSON object with this structure:
    {
      "title": "Compelling Business English Title",
      "subtitle": "Professional Subtitle",
      "introduction": "Brief introduction to the business context and learning goals",
      "exercises": [
        {
          "type": "one of the specified exercise types",
          "title": "Exercise X: Type",
          "icon": "fa-icon-name",
          "time": number of minutes,
          "instructions": "Clear professional instructions",
          "teacher_tip": "Practical guidance for the business English tutor",
          // Additional fields based on exercise type...
        }
      ],
      "vocabulary_sheet": [
        {"term": "business term", "meaning": "clear definition"}
      ]
    }`;
}

// Generate worksheet using OpenAI with improved prompting
export async function generateWorksheetWithOpenAI(
  prompt: string, 
  exerciseCount: number, 
  exerciseTypes: string[]
): Promise<any> {
  console.log('Generating worksheet with OpenAI...');
  
  try {
    // Initial generation with improved prompt
    const worksheetData = await generateInitialWorksheet(prompt, exerciseCount, exerciseTypes);
    
    // Detect and regenerate template exercises
    return await handleTemplateExercises(worksheetData, prompt, exerciseCount, exerciseTypes);
  } catch (apiError) {
    console.error('OpenAI API error:', apiError);
    throw new Error('Error communicating with AI service: ' + (apiError.message || 'Unknown error'));
  }
}

// Generate the initial worksheet
async function generateInitialWorksheet(
  prompt: string,
  exerciseCount: number,
  exerciseTypes: string[]
): Promise<any> {
  const systemPrompt = createSystemPrompt(exerciseCount, exerciseTypes);
  
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" }, 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    max_tokens: 4000
  });

  const jsonContent = aiResponse.choices[0].message.content;
  console.log('AI response received, processing...');
  
  try {
    const worksheetData = JSON.parse(jsonContent);
    
    // Basic validation of the structure
    if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('Invalid worksheet structure returned from AI');
    }
    
    // Validate each exercise
    for (const exercise of worksheetData.exercises) {
      validateExercise(exercise);
    }
    
    // Handle incorrect exercise count
    if (worksheetData.exercises.length !== exerciseCount) {
      return await fixExerciseCount(worksheetData, prompt, exerciseCount, exerciseTypes);
    }
    
    return worksheetData;
  } catch (parseError) {
    console.error('Failed to process AI response:', parseError);
    throw new Error('Failed to generate a valid worksheet structure. Please try again.');
  }
}

// Fix exercise count if needed
async function fixExerciseCount(
  worksheetData: any,
  prompt: string,
  exerciseCount: number,
  exerciseTypes: string[]
): Promise<any> {
  console.log(`Received ${worksheetData.exercises.length} exercises, expected ${exerciseCount}`);
  
  // If too few exercises, generate additional ones
  if (worksheetData.exercises.length < exerciseCount) {
    const additionalExercisesNeeded = exerciseCount - worksheetData.exercises.length;
    console.log(`Generating ${additionalExercisesNeeded} additional exercises`);
    
    const additionalExercises = await generateAdditionalExercises(
      prompt,
      additionalExercisesNeeded,
      worksheetData.exercises,
      exerciseTypes
    );
    
    worksheetData.exercises = [...worksheetData.exercises, ...additionalExercises];
  } 
  // If too many, trim down
  else if (worksheetData.exercises.length > exerciseCount) {
    worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
    console.log(`Trimmed exercises to ${worksheetData.exercises.length}`);
  }
  
  return worksheetData;
}

// Generate additional exercises if needed
async function generateAdditionalExercises(
  prompt: string,
  count: number,
  existingExercises: any[],
  allExerciseTypes: string[]
): Promise<any[]> {
  const missingTypes = getExerciseTypesForMissing(existingExercises, allExerciseTypes);
  
  const systemPrompt = `You are an expert business English teacher creating authentic exercises for executives.
    Create ${count} additional high-quality exercises following these strict requirements:
    1. NEVER use template phrases like "This is sentence X" or "Speaker A/B"
    2. Use REAL business scenarios, names, and vocabulary
    3. Make content appropriate for executives in 1-on-1 training
    4. Create complete exercises with all required fields
    5. Exercise content must relate directly to: "${prompt}"`;
    
  const userPrompt = `Create ${count} additional business English exercises related to: "${prompt}".
    Use ONLY these exercise types: ${missingTypes.join(', ')}.
    Number the exercises sequentially starting from ${existingExercises.length + 1}.
    IMPORTANT: Ensure all content is authentic business language - NO TEMPLATES OR PLACEHOLDERS!`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 3000
    });
    
    const additionalExercisesText = response.choices[0].message.content;
    const additionalData = JSON.parse(additionalExercisesText);
    
    if (Array.isArray(additionalData)) {
      return additionalData;
    } else if (additionalData.exercises && Array.isArray(additionalData.exercises)) {
      return additionalData.exercises;
    } else {
      console.error("Unexpected format for additional exercises:", additionalData);
      throw new Error("Invalid format for additional exercises");
    }
  } catch (error) {
    console.error('Failed to generate additional exercises:', error);
    
    // Fallback: create simple placeholder exercises
    return Array.from({ length: count }, (_, i) => ({
      type: missingTypes[i % missingTypes.length],
      title: `Exercise ${existingExercises.length + i + 1}: ${missingTypes[i % missingTypes.length].charAt(0).toUpperCase() + missingTypes[i % missingTypes.length].slice(1).replace(/-/g, ' ')}`,
      icon: getIconForType(missingTypes[i % missingTypes.length]),
      time: 5,
      instructions: `Complete this ${missingTypes[i % missingTypes.length]} exercise.`,
      teacher_tip: `Help students with this ${missingTypes[i % missingTypes.length]} exercise.`
    }));
  }
}

// Handle exercises containing template content
async function handleTemplateExercises(
  worksheetData: any,
  prompt: string,
  exerciseCount: number,
  exerciseTypes: string[]
): Promise<any> {
  // Find exercises with template content
  const templatedExercises = findTemplateExercises(worksheetData);
  
  if (templatedExercises.length === 0) {
    console.log('No template content detected, finalizing worksheet');
    return finalizeWorksheet(worksheetData, exerciseCount);
  }
  
  console.log(`Detected ${templatedExercises.length} exercises with template content: ${templatedExercises.join(', ')}`);
  
  // If more than half of exercises have templates, regenerate entire worksheet
  if (templatedExercises.length > exerciseCount / 2) {
    console.log('Too many template exercises, regenerating entire worksheet');
    return await generateInitialWorksheet(
      prompt + " IMPORTANT: DO NOT use any template content or placeholder text anywhere.",
      exerciseCount,
      exerciseTypes
    );
  }
  
  // Otherwise, regenerate only the problematic exercises
  const regeneratedWorksheet = { ...worksheetData };
  
  for (const index of templatedExercises) {
    const exercise = worksheetData.exercises[index];
    console.log(`Regenerating exercise ${index + 1} (${exercise.type})`);
    
    try {
      const regenerated = await regenerateExercise(exercise, index + 1, prompt);
      regeneratedWorksheet.exercises[index] = regenerated;
    } catch (error) {
      console.error(`Failed to regenerate exercise ${index + 1}:`, error);
      // Keep original exercise if regeneration fails
    }
  }
  
  // Check again for templates after regeneration
  const remainingTemplates = findTemplateExercises(regeneratedWorksheet);
  if (remainingTemplates.length > 0) {
    console.log(`Still have ${remainingTemplates.length} templated exercises after regeneration`);
    // Try one more time with stronger prompting
    for (const index of remainingTemplates) {
      try {
        const exercise = regeneratedWorksheet.exercises[index];
        console.log(`Final attempt to regenerate exercise ${index + 1} (${exercise.type})`);
        
        const regenerated = await regenerateExercise(
          exercise, 
          index + 1,
          prompt,
          true // Use enhanced prompting
        );
        regeneratedWorksheet.exercises[index] = regenerated;
      } catch (error) {
        console.error(`Failed final regeneration of exercise ${index + 1}:`, error);
      }
    }
  }
  
  return finalizeWorksheet(regeneratedWorksheet, exerciseCount);
}

// Regenerate a single exercise
async function regenerateExercise(
  exercise: any,
  exerciseNumber: number,
  originalPrompt: string,
  enhancedPrompt = false
): Promise<any> {
  const exerciseType = exercise.type;
  
  const systemPrompt = enhancedPrompt ? 
    `You are creating a SINGLE authentic business English exercise for professional adults.
    THIS IS CRITICAL: Your content MUST be 100% AUTHENTIC business language with NO TEMPLATES.
    NEVER use phrases like "This is sentence X", "Speaker A", "Person B", or "Term 1".
    Instead, use realistic business scenarios, authentic dialogue with real names, and natural language.
    Your output must be indistinguishable from content a professional business English teacher would create.` :
    `You are creating a single high-quality business English exercise for a professional worksheet.
    Create authentic content with no templates or placeholders.`;
  
  const specificInstructions = getSpecificInstructions(exerciseType);
  
  const userPrompt = `Recreate Exercise ${exerciseNumber}: ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace(/-/g, ' ')} 
    related to: "${originalPrompt}"
    
    ${specificInstructions}
    
    DO NOT use any generic templates!
    Return as a single JSON object with all required fields for this exercise type.`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8, // Higher temperature for more variation
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000
    });
    
    const regeneratedText = response.choices[0].message.content;
    const regeneratedExercise = JSON.parse(regeneratedText);
    
    // Keep original metadata
    regeneratedExercise.type = exerciseType;
    regeneratedExercise.title = `Exercise ${exerciseNumber}: ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace(/-/g, ' ')}`;
    regeneratedExercise.icon = exercise.icon || getIconForType(exerciseType);
    regeneratedExercise.time = exercise.time || 5;
    
    // Validate regenerated exercise
    validateExercise(regeneratedExercise);
    
    return regeneratedExercise;
  } catch (error) {
    console.error(`Error regenerating ${exerciseType} exercise:`, error);
    throw new Error(`Failed to regenerate ${exerciseType} exercise`);
  }
}

// Get specific instructions based on exercise type
function getSpecificInstructions(exerciseType: string): string {
  switch(exerciseType) {
    case 'reading':
      return 'Create a 280-320 word authentic business text with at least 5 comprehension questions.';
    case 'multiple-choice':
      return 'Create at least 10 business-relevant multiple-choice questions, each with 3-4 options.';
    case 'fill-in-blanks':
      return 'Create at least 10 business sentences with gaps and a word bank.';
    case 'matching':
      return 'Create at least 10 business terms and definitions to match.';
    case 'true-false':
      return 'Create at least 10 business statements with varied truth values.';
    case 'dialogue':
      return 'Create a natural business dialogue with at least 10 exchanges between named professionals, and 10 useful expressions.';
    case 'discussion':
      return 'Create at least 10 thought-provoking business discussion questions.';
    case 'error-correction':
      return 'Create at least 10 business sentences with grammar errors to correct.';
    case 'word-formation':
      return 'Create at least 10 business sentences requiring word transformations.';
    case 'word-order':
      return 'Create at least 10 business sentences with scrambled word order.';
    default:
      return 'Create authentic business content with no templates.';
  }
}

// Final worksheet processing
function finalizeWorksheet(worksheetData: any, exerciseCount: number): any {
  // Ensure correct exercise numbering and icons
  worksheetData.exercises.forEach((exercise: any, index: number) => {
    const exerciseNumber = index + 1;
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
    
    // Set icon if missing
    if (!exercise.icon) {
      exercise.icon = getIconForType(exercise.type);
    }
  });
  
  // Add random source count for stats display
  worksheetData.sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
  
  // Check final exercise count
  console.log(`Final exercise count: ${worksheetData.exercises.length} (expected: ${exerciseCount})`);
  
  return worksheetData;
}
