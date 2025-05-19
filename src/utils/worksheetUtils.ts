
/**
 * Określa oczekiwaną liczbę ćwiczeń na podstawie czasu lekcji
 */
export const getExpectedExerciseCount = (lessonTime: string): number => {
  if (lessonTime === "30 min") return 4;
  else if (lessonTime === "45 min") return 6;
  else return 8; // 60 min
};

/**
 * Miesza elementy tablicy w losowej kolejności
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Tworzy przykładowe słownictwo jako fallback
 */
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

/**
 * Sprawdza poprawność danych worksheetu
 */
export const validateWorksheet = (worksheetData: any, expectedCount: number): boolean => {
  if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    return false;
  }
  
  return worksheetData.exercises.length === expectedCount;
};

/**
 * Przetwarza ćwiczenia, dodając tytuły i przygotowując dane
 */
export const processExercises = (exercises: any[]): any[] => {
  return exercises.map((exercise: any, index: number) => {
    // Upewnij się że numer ćwiczenia jest poprawny
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    // Przetwarzanie ćwiczeń typu matching
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
    }
    
    // Przetwarzanie ćwiczeń typu reading
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`Reading exercise word count: ${wordCount}`);
      
      // Upewnij się że ma odpowiednią liczbę pytań
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
    
    return exercise;
  });
};
