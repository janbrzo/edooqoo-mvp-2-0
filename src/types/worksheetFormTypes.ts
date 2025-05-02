
import { LessonTime } from "@/constants/worksheetFormData";

export interface FormData {
  lessonTime: LessonTime;
  lessonTopic: string;
  lessonGoal: string;
  teachingPreferences: string;
  studentProfile?: string;
  studentStruggles?: string;
}
