
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps, Tile } from './types';
import { LESSON_TOPICS, LESSON_GOALS, TEACHING_PREFERENCES, STUDENT_PROFILES, STUDENT_STRUGGLES } from './constants';
import EnglishLevelSelector from './EnglishLevelSelector';
import FormField from './FormField';

const getRandomTiles = (tiles: Tile[], count = 5): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function WorksheetForm({ onSubmit }: WorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60 min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [teachingPreferences, setTeachingPreferences] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  const [studentProfile, setStudentProfile] = useState("");
  const [studentStruggles, setStudentStruggles] = useState("");
  const [randomTopics, setRandomTopics] = useState(getRandomTiles(LESSON_TOPICS));
  const [randomGoals, setRandomGoals] = useState(getRandomTiles(LESSON_GOALS));
  const [randomPreferences, setRandomPreferences] = useState(getRandomTiles(TEACHING_PREFERENCES));
  const [randomProfiles, setRandomProfiles] = useState(getRandomTiles(STUDENT_PROFILES));
  const [randomStruggles, setRandomStruggles] = useState(getRandomTiles(STUDENT_STRUGGLES));

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonTopic || !lessonGoal || !teachingPreferences) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (Topic, Goal, Teaching Preferences)",
        variant: "destructive"
      });
      return;
    }
    onSubmit({
      lessonTime,
      lessonTopic,
      lessonGoal,
      teachingPreferences,
      englishLevel,
      studentProfile,
      studentStruggles
    });
  };

  const refreshTiles = () => {
    setRandomTopics(getRandomTiles(LESSON_TOPICS));
    setRandomGoals(getRandomTiles(LESSON_GOALS));
    setRandomPreferences(getRandomTiles(TEACHING_PREFERENCES));
    setRandomProfiles(getRandomTiles(STUDENT_PROFILES));
    setRandomStruggles(getRandomTiles(STUDENT_STRUGGLES));
  };

  return (
    <div className="w-full py-[24px]">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-3xl">Create Your Worksheet</h1>
            <div className="flex gap-2">
              <Button 
                variant={lessonTime === "45 min" ? "default" : "outline"} 
                onClick={() => setLessonTime("45 min")} 
                className={lessonTime === "45 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
              >
                45 min
              </Button>
              <Button 
                variant={lessonTime === "60 min" ? "default" : "outline"} 
                onClick={() => setLessonTime("60 min")} 
                className={lessonTime === "60 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
              >
                60 min
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Teaching preferences: What stimulates your student best?"
                placeholder="E.g. Writing exercises, dialogues"
                value={teachingPreferences}
                onChange={setTeachingPreferences}
                suggestions={randomPreferences}
              />

              <EnglishLevelSelector 
                englishLevel={englishLevel}
                setEnglishLevel={setEnglishLevel}
              />
            </div>

            <h3 className="font-medium text-muted-foreground pt-0 text-base">Optional Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Student Profile"
                placeholder="E.g. Goal: IT career advancement..."
                value={studentProfile}
                onChange={setStudentProfile}
                suggestions={randomProfiles}
              />

              <FormField 
                label="Main Struggles: What does your student struggle with during lessons?"
                placeholder="E.g. Student struggles with 'r' pronunciation"
                value={studentStruggles}
                onChange={setStudentStruggles}
                suggestions={randomStruggles}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={refreshTiles} 
                className="border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight"
              >
                Refresh Suggestions
              </Button>
              <Button 
                type="submit" 
                className="bg-worksheet-purple hover:bg-worksheet-purpleDark"
              >
                Generate Custom Worksheet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export * from './types';
