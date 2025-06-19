
import FormField from './FormField';
import { useIsMobile } from "@/hooks/use-mobile";
import { WORKSHEET_SETS, GRAMMAR_FOCUS } from './constants';
import { Tile } from './types';

interface FormFieldsProps {
  currentSetIndex: number;
  randomGrammarFocus: Tile[];
  lessonTopic: string;
  lessonGoal: string;
  additionalInformation: string;
  teachingPreferences: string;
  onLessonTopicChange: (value: string) => void;
  onLessonGoalChange: (value: string) => void;
  onAdditionalInformationChange: (value: string) => void;
  onTeachingPreferencesChange: (value: string) => void;
}

export default function FormFields({
  currentSetIndex,
  randomGrammarFocus,
  lessonTopic,
  lessonGoal,
  additionalInformation,
  teachingPreferences,
  onLessonTopicChange,
  onLessonGoalChange,
  onAdditionalInformationChange,
  onTeachingPreferencesChange
}: FormFieldsProps) {
  const isMobile = useIsMobile();
  const currentSet = WORKSHEET_SETS[currentSetIndex];

  return (
    <>
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
        <FormField 
          label="Lesson topic: General theme or real‑life scenario"
          placeholder={currentSet.lessonTopic}
          value={lessonTopic}
          onChange={onLessonTopicChange}
          suggestions={currentSet.topicTiles}
        />

        <FormField 
          label="Lesson focus: What should your student achieve by the end of the lesson?"
          placeholder={currentSet.lessonFocus}
          value={lessonGoal}
          onChange={onLessonGoalChange}
          suggestions={currentSet.focusTiles}
        />
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
        <FormField 
          label="Additional Information: Extra context & personal or situational details"
          placeholder={currentSet.additionalInfo}
          value={additionalInformation}
          onChange={onAdditionalInformationChange}
          suggestions={currentSet.infoTiles}
        />
        <FormField 
          label="Grammar focus (optional):"
          placeholder={currentSet.grammarFocus}
          value={teachingPreferences}
          onChange={onTeachingPreferencesChange}
          suggestions={randomGrammarFocus}
          isOptional
        />
      </div>
    </>
  );
}
