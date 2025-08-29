
import { FormData } from '@/components/WorksheetForm/types';

export const formatPrompt = (data: FormData): string => {
  const prompt = `
LESSON DETAILS:
- Lesson Duration: ${data.lessonTime}
- English Level: ${data.englishLevel}
- Topic: ${data.lessonTopic}
- Focus/Goal: ${data.lessonGoal}
- Teaching Preferences: ${data.teachingPreferences || 'None specified'}
- Additional Information: ${data.additionalInformation || 'None provided'}
- Language Style: ${data.languageStyle}/10 (1=very casual, 10=very formal)
`;

  return prompt.trim();
};

export const createFullPrompt = (formData: FormData): string => {
  const formattedData = formatPrompt(formData);
  
  return `${formattedData}

Please generate a comprehensive English lesson worksheet based on the above requirements.`;
};
