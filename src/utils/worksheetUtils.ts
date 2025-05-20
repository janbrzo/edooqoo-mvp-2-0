
/**
 * Utility functions for worksheet generation and processing
 */

// Get expected number of exercises based on lesson time
export const getExpectedExerciseCount = (lessonTime: string): number => {
  if (lessonTime === "30 min") return 4;
  else if (lessonTime === "45 min") return 6;
  else return 8;
};

// Shuffle array elements (for matching exercises)
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Create sample vocabulary items when vocabulary is missing
export const createSampleVocabulary = (count: number) => {
  const terms = [
    'Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 
    'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose', 
    'Kinetic', 'Luminous', 'Meticulous', 'Nostalgia', 'Omnipotent'
  ];
  const meanings = [
    'Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 
    'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 
    'Sociable', 'Random or lacking organization', 'Perfect, flawless', 
    'To place side by side', 'Related to motion', 'Full of light', 
    'Showing great attention to detail', 'Sentimental longing for the past', 
    'Having unlimited power'
  ];
  
  return Array(Math.min(count, terms.length)).fill(null).map((_, i) => ({
    term: terms[i],
    meaning: meanings[i]
  }));
};

// Validate worksheet structure
export const validateWorksheet = (worksheetData: any, expectedCount: number): boolean => {
  if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    return false;
  }
  
  return worksheetData.exercises.length === expectedCount;
};

// Process and enhance exercises
export const processExercises = (exercises: any[]): any[] => {
  return exercises.map((exercise: any, index: number) => {
    // Make sure exercise number is correct
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    // Process matching exercises
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
    }
    
    // Process reading exercise
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`Reading exercise word count: ${wordCount}`);
      
      // Ensure it has adequate number of questions
      if (!exercise.questions || exercise.questions.length < 5) {
        if (!exercise.questions) exercise.questions = [];
        while (exercise.questions.length < 5) {
          exercise.questions.push({
            text: `Additional question ${exercise.questions.length + 1} about the text.`,
            answer: "Answer would be based on the text content."
          });
        }
      }
    }

    // Ensure discussion exercises have proper questions
    if (exercise.type === 'discussion' && (!exercise.questions || exercise.questions.some((q: any) => 
      q.text && q.text.includes('Discussion question')))) {
      
      if (!exercise.questions) exercise.questions = [];
      
      // Fix generic questions with proper ones based on topic
      for (let i = 0; i < exercise.questions.length; i++) {
        if (exercise.questions[i].text.includes('Discussion question')) {
          exercise.questions[i].text = `What is your opinion about this topic? (Question ${i + 1})`;
        }
      }
    }

    // Fix error-correction exercises with generic sentences
    if (exercise.type === 'error-correction' && exercise.sentences) {
      for (let i = 0; i < exercise.sentences.length; i++) {
        if (exercise.sentences[i].text.includes('This sentence')) {
          exercise.sentences[i].text = `The weather are very nice today. (Sentence ${i + 1})`;
          exercise.sentences[i].corrected = `The weather is very nice today.`;
        }
      }
    }
    
    return exercise;
  });
};
