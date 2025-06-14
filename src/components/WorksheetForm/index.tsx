
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps, Tile } from './types';
import { LESSON_TOPICS, LESSON_GOALS, GRAMMAR_FOCUS } from './constants';
import EnglishLevelSelector from './EnglishLevelSelector';
import FormField from './FormField';
import { useIsMobile } from "@/hooks/use-mobile";

// Export FormData type so other files can import it
export type { FormData };

const getRandomTiles = (tiles: Tile[], count = 4): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function WorksheetForm({ onSubmit }: WorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60 min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [teachingPreferences, setTeachingPreferences] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  const [randomTopics, setRandomTopics] = useState(getRandomTiles(LESSON_TOPICS));
  const [randomGoals, setRandomGoals] = useState(getRandomTiles(LESSON_GOALS));
  const [randomGrammarFocus, setRandomGrammarFocus] = useState(getRandomTiles(GRAMMAR_FOCUS));

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonTopic || !lessonGoal || !teachingPreferences) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (Topic, Goal, Grammar Focus)",
        variant: "destructive"
      });
      return;
    }
    onSubmit({
      lessonTime,
      lessonTopic,
      lessonGoal,
      teachingPreferences,
      additionalInformation,
      englishLevel
    });
  };

  const refreshTiles = () => {
    setRandomTopics(getRandomTiles(LESSON_TOPICS));
    setRandomGoals(getRandomTiles(LESSON_GOALS));
    setRandomGrammarFocus(getRandomTiles(GRAMMAR_FOCUS));
  };

  return (
    <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
      <Card className="bg-white shadow-sm">
        <CardContent className={`${isMobile ? 'p-3' : 'p-8'}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-start'} mb-6`}>
                <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 ${isMobile ? 'text-xl text-center' : 'text-3xl'}`}>
                  Create Your Worksheet
                </h1>
                
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-14'}`}>
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : 'w-32'}`}>
                    <Button 
                      type="button"
                      variant={lessonTime === "45 min" ? "default" : "outline"} 
                      onClick={() => setLessonTime("45 min")} 
                      className={lessonTime === "45 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                      size={isMobile ? "sm" : "sm"}
                    >
                      45 min
                    </Button>
                    <Button 
                      type="button"
                      variant={lessonTime === "60 min" ? "default" : "outline"} 
                      onClick={() => setLessonTime("60 min")} 
                      className={lessonTime === "60 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                      size={isMobile ? "sm" : "sm"}
                    >
                      60 min
                    </Button>
                  </div>
                  
                  <div className={`flex flex-col ${isMobile ? 'items-center' : 'items-end w-80'}`}>
                    <div className={`flex gap-1 mb-1 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
                      <Button 
                        type="button"
                        variant={englishLevel === "A1/A2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("A1/A2")} 
                        className={englishLevel === "A1/A2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        A1/A2
                      </Button>
                      <Button 
                        type="button"
                        variant={englishLevel === "B1/B2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("B1/B2")} 
                        className={englishLevel === "B1/B2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        B1/B2
                      </Button>
                      <Button 
                        type="button"
                        variant={englishLevel === "C1/C2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("C1/C2")} 
                        className={englishLevel === "C1/C2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        C1/C2
                      </Button>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'text-center' : ''}`}>
                      CEFR Scale: {englishLevel === "A1/A2" ? "Beginner/Elementary" : englishLevel === "B1/B2" ? "Intermediate/Upper-Intermediate" : "Advanced/Proficiency"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Lesson topic: What is the main subject of the lesson?"
                  placeholder="E.g. IT: debugging code"
                  value={lessonTopic}
                  onChange={setLessonTopic}
                  suggestions={randomTopics}
                />

                <FormField 
                  label="Lesson goal: What would you like to focus on during this lesson?"
                  placeholder="E.g. Preparing for a work presentation on AI"
                  value={lessonGoal}
                  onChange={setLessonGoal}
                  suggestions={randomGoals}
                />
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Grammar focus on:"
                  placeholder="E.g. Present Simple Tense, Conditionals"
                  value={teachingPreferences}
                  onChange={setTeachingPreferences}
                  suggestions={randomGrammarFocus}
                />
                <FormField 
                  label="Additional Information (optional)"
                  placeholder="Describe your idea or specific need for the lesson topic"
                  value={additionalInformation}
                  onChange={setAdditionalInformation}
                  suggestions={[]}
                  isOptional
                />
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-4`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={refreshTiles} 
                  className={`border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight ${isMobile ? 'w-full' : ''}`}
                  size={isMobile ? "sm" : "default"}
                >
                  Refresh Suggestions
                </Button>
                <Button 
                  type="submit" 
                  className={`bg-worksheet-purple hover:bg-worksheet-purpleDark ${isMobile ? 'w-full' : ''}`}
                  size={isMobile ? "sm" : "default"}
                >
                  Generate Custom Worksheet
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
