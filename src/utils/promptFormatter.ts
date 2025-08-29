
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
  promptLines.push(`languageStyle: ${languageStyle}/10`);

  // Add optional grammar focus only if provided
  if (data.teachingPreferences) {
    promptLines.push(`grammarFocus: ${data.teachingPreferences}`);
  }

  if (data.additionalInformation) {
    promptLines.push(`additionalInformation: ${data.additionalInformation}`);
  }

  // Join lines with newlines for clean key-value format
  const formattedPrompt = promptLines.join('\n');
  
  console.log('📝 Formatted prompt (key-value format):', formattedPrompt);
  return formattedPrompt;
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
