
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps, Tile } from './types';
import { 
  GRAMMAR_FOCUS, 
  SYNCHRONIZED_PLACEHOLDERS,
  LESSON_TOPIC_TILES,
  LESSON_FOCUS_TILES,
  ADDITIONAL_INFO_TILES
} from './constants';
import FormField from './FormField';
import { useIsMobile } from "@/hooks/use-mobile";

// Export FormData type so other files can import it
export type { FormData };

// Funkcja do losowego wyboru 3 kategorii z 8 dostępnych (A-H)
const getRandomCategories = (categoryKeys: string[], count = 3): string[] => {
  const shuffled = [...categoryKeys].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Funkcja do losowego wyboru jednego kafelka z każdej wybranej kategorii
const getRandomTilesFromCategories = (tilesObject: Record<string, Tile[]>, selectedCategories: string[]): Tile[] => {
  const selectedTiles: Tile[] = [];
  selectedCategories.forEach(category => {
    const categoryTiles = tilesObject[category];
    if (categoryTiles && categoryTiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryTiles.length);
      selectedTiles.push(categoryTiles[randomIndex]);
    }
  });
  return selectedTiles;
};

// Funkcja do losowego wyboru kafelków Grammar Focus (pozostaje jak była - 3 kafelki)
const getRandomTiles = (tiles: Tile[], count = 3): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomPlaceholderIndex = (): number => {
  return Math.floor(Math.random() * SYNCHRONIZED_PLACEHOLDERS.length);
};

export default function WorksheetForm({ onSubmit }: WorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60 min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [teachingPreferences, setTeachingPreferences] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  
  // Stany dla nowego systemu kategorii
  const [topicCategories, setTopicCategories] = useState(() => 
    getRandomCategories(Object.keys(LESSON_TOPIC_TILES))
  );
  const [focusCategories, setFocusCategories] = useState(() => 
    getRandomCategories(Object.keys(LESSON_FOCUS_TILES))
  );
  const [infoCategories, setInfoCategories] = useState(() => 
    getRandomCategories(Object.keys(ADDITIONAL_INFO_TILES))
  );
  
  // Kafelki na podstawie wybranych kategorii
  const [randomTopics, setRandomTopics] = useState(() => 
    getRandomTilesFromCategories(LESSON_TOPIC_TILES, topicCategories)
  );
  const [randomGoals, setRandomGoals] = useState(() => 
    getRandomTilesFromCategories(LESSON_FOCUS_TILES, focusCategories)
  );
  const [randomInfoTiles, setRandomInfoTiles] = useState(() => 
    getRandomTilesFromCategories(ADDITIONAL_INFO_TILES, infoCategories)
  );
  
  // Grammar Focus pozostaje jak było
  const [randomGrammarFocus, setRandomGrammarFocus] = useState(getRandomTiles(GRAMMAR_FOCUS));
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(getRandomPlaceholderIndex());

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

  const refreshTiles = () => {
    // Losuj nowe kategorie dla każdego pola
    const newTopicCategories = getRandomCategories(Object.keys(LESSON_TOPIC_TILES));
    const newFocusCategories = getRandomCategories(Object.keys(LESSON_FOCUS_TILES));
    const newInfoCategories = getRandomCategories(Object.keys(ADDITIONAL_INFO_TILES));
    
    // Ustaw nowe kategorie
    setTopicCategories(newTopicCategories);
    setFocusCategories(newFocusCategories);
    setInfoCategories(newInfoCategories);
    
    // Wygeneruj nowe kafelki na podstawie nowych kategorii
    setRandomTopics(getRandomTilesFromCategories(LESSON_TOPIC_TILES, newTopicCategories));
    setRandomGoals(getRandomTilesFromCategories(LESSON_FOCUS_TILES, newFocusCategories));
    setRandomInfoTiles(getRandomTilesFromCategories(ADDITIONAL_INFO_TILES, newInfoCategories));
    
    // Grammar Focus pozostaje jak było
    setRandomGrammarFocus(getRandomTiles(GRAMMAR_FOCUS));
    
    // Zmień placeholder na nowy losowy zestaw
    setCurrentPlaceholderIndex(getRandomPlaceholderIndex());
  };

  // Get current synchronized placeholders
  const currentPlaceholders = SYNCHRONIZED_PLACEHOLDERS[currentPlaceholderIndex];

  return (
    <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
      <Card className="bg-white shadow-sm">
        <CardContent className={`${isMobile ? 'p-3' : 'p-8'}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-start'} mb-6`}>
                <div className={`${isMobile ? 'text-center' : ''}`}>
                  <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                    Create A Worksheet
                  </h1>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
                    Tailored to your students. In seconds.
                  </p>
                </div>
                
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
                  label="Lesson topic: General theme or real‑life scenario"
                  placeholder={currentPlaceholders.lessonTopic}
                  value={lessonTopic}
                  onChange={setLessonTopic}
                  suggestions={randomTopics}
                  currentPlaceholderIndex={currentPlaceholderIndex}
                />

                <FormField 
                  label="Lesson focus: What should your student achieve by the end of the lesson?"
                  placeholder={currentPlaceholders.lessonFocus}
                  value={lessonGoal}
                  onChange={setLessonGoal}
                  suggestions={randomGoals}
                  currentPlaceholderIndex={currentPlaceholderIndex}
                />
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Additional Information: Extra context & personal or situational details"
                  placeholder={currentPlaceholders.additionalInfo}
                  value={additionalInformation}
                  onChange={setAdditionalInformation}
                  suggestions={randomInfoTiles}
                />
                <FormField 
                  label="Grammar focus (optional):"
                  placeholder={currentPlaceholders.grammarFocus}
                  value={teachingPreferences}
                  onChange={setTeachingPreferences}
                  suggestions={randomGrammarFocus}
                  isOptional
                  currentPlaceholderIndex={currentPlaceholderIndex}
                />
              </div>

              <div className={`${isMobile ? 'text-center' : ''} mb-6`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  GENERAL HINT: To create a truly personalized, student‑focused worksheet, please provide as detailed a description as possible in each field.
                </p>
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
