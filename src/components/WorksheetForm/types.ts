
export type LessonTime = "45 min" | "60 min";
export type EnglishLevel = "A1/A2" | "B1/B2" | "C1/C2";

export type Tile = {
  id: string;
  title: string;
};

export interface FormData {
  lessonTime: LessonTime;
  lessonTopic: string;
  lessonGoal: string;
  teachingPreferences: string;
  englishLevel?: EnglishLevel;
  fullPrompt?: string;
  formDataForStorage?: any;
}

export interface WorksheetFormProps {
  onSubmit: (data: FormData) => void;
}
