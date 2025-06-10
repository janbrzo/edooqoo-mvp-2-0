
import { FormData } from "@/components/WorksheetForm";

export const formatPromptForAI = (data: FormData): string => {
  console.log('📝 Formatting enhanced prompt for AI with data:', data);
  
  // Enhanced prompt formatting with more detailed context
  let prompt = `TOPIC: ${data.lessonTopic}\nGOAL: ${data.lessonGoal}\nTEACHING STYLE: ${data.teachingPreferences}`;
  
  if (data.englishLevel) {
    prompt += `\nENGLISH LEVEL: ${data.englishLevel} (CEFR) - Vocabulary and grammar complexity must strictly adhere to this level`;
  }
  
  if (data.studentProfile) {
    prompt += `\nSTUDENT PROFILE: ${data.studentProfile} - Adapt exercise content and scenarios to match this profile`;
  }
  
  if (data.studentStruggles) {
    prompt += `\nSTUDENT CHALLENGES: ${data.studentStruggles} - Design exercises that specifically address these difficulties`;
  }
  
  prompt += `\nLESSON DURATION: ${data.lessonTime}`;
  
  // Add specific instructions for teachingPreferences integration
  prompt += `\n\nSPECIAL INSTRUCTIONS: The teaching preferences "${data.teachingPreferences}" must be prominently reflected in exercises 5 (dialogue) and 7 (discussion). Create scenarios, topics, and questions that directly incorporate these preferences.`;
  
  console.log('📝 Enhanced formatted prompt:', prompt);
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
