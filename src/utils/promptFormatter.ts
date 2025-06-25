
import { FormData } from "@/components/WorksheetForm";

export const formatPromptForAI = (data: FormData): string => {
  console.log('📝 Formatting prompt for AI with data:', data);
  
  // Build array of prompt lines for easy filtering of empty values
  const promptLines = [];

  // Add required fields
  promptLines.push(`lessonTopic: ${data.lessonTopic}`);
  promptLines.push(`lessonGoal: ${data.lessonGoal}`);
  promptLines.push(`englishLevel: ${data.englishLevel}`);

  // Add optional grammar focus only if provided
  if (data.teachingPreferences) {
    promptLines.push(`grammarFocus: ${data.teachingPreferences}`);
  }

  if (data.additionalInformation) {
    promptLines.push(`additionalInformation: ${data.additionalInformation}`);
  }

  // Add instructions for warmup questions
  promptLines.push(`\nIMPORTANT: Include a "warmup_questions" section with exactly 4 conversation starter questions that are personal and opinion-based, directly related to the lesson topic "${data.lessonTopic}". These should help students think about the topic and engage them at the beginning of the lesson. Make question number 1 and 2 generic and question numer 3 and 4 specific.`);

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
    lessonTime: prompt.lessonTime
  };
};
