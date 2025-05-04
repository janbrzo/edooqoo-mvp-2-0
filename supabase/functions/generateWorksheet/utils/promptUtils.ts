
/**
 * Utility functions for prompt parsing and handling
 */

/**
 * Parsuje metadane z surowego promptu
 */
export function parsePromptMetadata(rawPrompt: string) {
  const lines = rawPrompt.split('\n');
  const out: Record<string,string> = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    const k = key.trim();
    if (['Lesson topic','Lesson goal','Teaching preferences','Student Profile','Main Struggles'].includes(k)) {
      out[k] = rest.join(':').trim();
    }
  }
  return {
    lessonTopic: out['Lesson topic'] ?? '',
    lessonGoal: out['Lesson goal'] ?? '',
    teachingPreferences: out['Teaching preferences'] ?? '',
    studentProfile: out['Student Profile'] ?? '',
    mainStruggles: out['Main Struggles'] ?? ''
  };
}

/**
 * Określa liczbę zadań na podstawie czasu lekcji
 */
export function determineExerciseCount(rawPrompt: string): number {
  let exerciseCount = 6; // Default
  if (rawPrompt.includes('30 min')) {
    exerciseCount = 4;
  } else if (rawPrompt.includes('45 min')) {
    exerciseCount = 6;
  } else if (rawPrompt.includes('60 min')) {
    exerciseCount = 8;
  }
  return exerciseCount;
}

/**
 * Generuje przykładowy tekst o określonej liczbie słów
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
