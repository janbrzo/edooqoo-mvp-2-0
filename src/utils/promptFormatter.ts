
import { FormData } from "@/components/WorksheetForm";

export const formatPromptForAI = (data: FormData): string => {
  console.log('📝 Formatting prompt for AI with data:', data);
  
  // Build array of prompt lines for easy filtering of empty values
  const promptLines = [];

  // Add required fields
  promptLines.push(`lessonTopic: ${data.lessonTopic}`);
  promptLines.push(`lessonGoal: ${data.lessonGoal}`);
  promptLines.push(`englishLevel: ${data.englishLevel}`);

  // Add language style parameter
  const languageStyle = data.languageStyle || 5;
  promptLines.push(`languageStyle: ${languageStyle}/10 ${getLanguageStyleDescription(languageStyle)}`);

  // Add optional grammar focus only if provided
  if (data.teachingPreferences) {
    promptLines.push(`grammarFocus: ${data.teachingPreferences}`);
  }

  if (data.additionalInformation) {
    promptLines.push(`additionalInformation: ${data.additionalInformation}`);
  }

  // Add comprehensive instructions for content quality and diversity
  promptLines.push(`\nCONTENT QUALITY INSTRUCTIONS:`);
  promptLines.push(`- DIVERSITY: Ensure each exercise has completely different examples, scenarios, and contexts. Never repeat similar situations, names, places, or topics across exercises.`);
  promptLines.push(`- VARIETY: Use diverse vocabulary, varied sentence structures, and different real-life contexts in each exercise.`);
  promptLines.push(`- NATURAL LANGUAGE: Write in natural, authentic English that people actually use in real conversations and situations.`);
  
  // Add language style specific instructions
  promptLines.push(`\nLANGUAGE STYLE GUIDELINES (${languageStyle}/10):`);
  if (languageStyle <= 3) {
    promptLines.push(`- Use very casual, conversational language with contractions (I'm, you're, can't, won't)`);
    promptLines.push(`- Include everyday slang and informal expressions where appropriate`);
    promptLines.push(`- Use shorter, simpler sentences and relaxed grammar`);
    promptLines.push(`- Examples: "Hey, what's up?", "That's awesome!", "No way!", "Let's grab a coffee"`);
  } else if (languageStyle <= 6) {
    promptLines.push(`- Use neutral, balanced language that's friendly but not too casual`);
    promptLines.push(`- Mix contractions with full forms naturally`);
    promptLines.push(`- Use common idioms and everyday expressions`);
    promptLines.push(`- Examples: "How are you doing?", "That sounds great!", "I'd love to", "Let's meet up"`);
  } else {
    promptLines.push(`- Use more formal, professional language with proper grammar`);
    promptLines.push(`- Prefer full forms over contractions (I am, you are, cannot, will not)`);
    promptLines.push(`- Use sophisticated vocabulary and complex sentence structures`);
    promptLines.push(`- Examples: "How are you today?", "That is excellent!", "I would be delighted to", "Shall we arrange a meeting?"`);
  }

  // Add instructions for warmup questions
  promptLines.push(`\nIMPORTANT: Include a "warmup_questions" section with exactly 4 conversation starter questions that are personal and opinion-based, directly related to the lesson topic "${data.lessonTopic}". These should help students think about the topic and engage them at the beginning of the lesson. Make question number 1 and 2 generic and question number 3 and 4 specific.`);

  // Join lines with newlines for clean key-value format
  const formattedPrompt = promptLines.join('\n');
  
  console.log('📝 Formatted prompt (key-value format):', formattedPrompt);
  return formattedPrompt;
};

// Helper function to get language style description
const getLanguageStyleDescription = (value: number): string => {
  if (value <= 2) return "(very casual - slang, contractions)";
  if (value <= 4) return "(casual - relaxed, friendly)";
  if (value <= 6) return "(neutral - balanced style)";
  if (value <= 8) return "(formal - professional tone)";
  return "(very formal - academic style)";
};

export const createFormDataForStorage = (prompt: FormData) => {
  return {
    lessonTopic: prompt.lessonTopic,
    lessonGoal: prompt.lessonGoal,
    teachingPreferences: prompt.teachingPreferences || null,
    additionalInformation: prompt.additionalInformation || null,
    englishLevel: prompt.englishLevel || null,
    languageStyle: prompt.languageStyle || 5,
    lessonTime: prompt.lessonTime
  };
};
