
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FormData, WorksheetFormProps } from './types';
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorksheetForm } from './useWorksheetForm';
import WorksheetHeader from './WorksheetHeader';
import FormFields from './FormFields';
import FormActions from './FormActions';

// Export FormData type so other files can import it
export type { FormData };

export default function WorksheetForm({ onSubmit }: WorksheetFormProps) {
  const {
    lessonTime,
    setLessonTime,
    lessonTopic,
    setLessonTopic,
    lessonGoal,
    setLessonGoal,
    additionalInformation,
    setAdditionalInformation,
    teachingPreferences,
    setTeachingPreferences,
    englishLevel,
    setEnglishLevel,
    currentSetIndex,
    randomGrammarFocus,
    refreshTiles
  } = useWorksheetForm();

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonTopic || !lessonGoal || !additionalInformation) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (Topic, Focus, Additional Information)",
        variant: "destructive"
      });
      return;
    }
    onSubmit({
      lessonTime,
      lessonTopic,
      lessonGoal: lessonGoal,
      teachingPreferences,
      additionalInformation,
      englishLevel
    });
  };

  return (
    <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
      <Card className="bg-white shadow-sm">
        <CardContent className={`${isMobile ? 'p-3' : 'p-8'}`}>
          <form onSubmit={handleSubmit}>
            <WorksheetHeader 
              lessonTime={lessonTime}
              englishLevel={englishLevel}
              onLessonTimeChange={setLessonTime}
              onEnglishLevelChange={setEnglishLevel}
            />
            
            <FormFields 
              currentSetIndex={currentSetIndex}
              randomGrammarFocus={randomGrammarFocus}
              lessonTopic={lessonTopic}
              lessonGoal={lessonGoal}
              additionalInformation={additionalInformation}
              teachingPreferences={teachingPreferences}
              onLessonTopicChange={setLessonTopic}
              onLessonGoalChange={setLessonGoal}
              onAdditionalInformationChange={setAdditionalInformation}
              onTeachingPreferencesChange={setTeachingPreferences}
            />

            <div className={`${isMobile ? 'text-center' : ''} mb-6`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                GENERAL HINT: To create a truly personalized, student‑focused worksheet, please provide as detailed a description as possible in each field.
              </p>
            </div>

            <FormActions 
              onRefreshTiles={refreshTiles}
              onSubmit={handleSubmit}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
