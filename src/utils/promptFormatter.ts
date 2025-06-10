
import { FormData } from "@/components/WorksheetForm";

export const formatPromptForAI = (data: FormData): string => {
  console.log('📝 Formatting prompt for AI with data:', data);
  
  let prompt = `${data.lessonTopic} - ${data.lessonGoal}. Teaching preferences: ${data.teachingPreferences}`;
  
  if (data.studentProfile) {
    prompt += `. Student profile: ${data.studentProfile}`;
  }
  
  if (data.studentStruggles) {
    prompt += `. Student struggles: ${data.studentStruggles}`;
  }
  
  if (data.englishLevel) {
    prompt += `. English level: ${data.englishLevel} (according to CEFR scale - vocabulary and grammar should not exceed this level)`;
  }
  
  prompt += `. Lesson duration: ${data.lessonTime}.`;
  
  console.log('📝 Formatted prompt:', prompt);
  return prompt;
};

export const createFormDataForStorage = (prompt: FormData) => {
  return {
    lessonTopic: prompt.lessonTopic,
    lessonGoal: prompt.lessonGoal,
    teachingPreferences: prompt.teachingPreferences,
    studentProfile: prompt.studentProfile || null,
    studentStruggles: prompt.studentStruggles || null,
    englishLevel: prompt.englishLevel || null,
    lessonTime: prompt.lessonTime
  };
};
