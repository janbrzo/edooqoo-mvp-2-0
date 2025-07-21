
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps } from './types';
import { getRandomPlaceholderSet, PlaceholderSet } from './placeholderSets';
import { getRandomSuggestionSets, getSuggestionSetMatchingPlaceholder, SuggestionSet } from './suggestionSets';
import FormField from './FormField';
import { useIsMobile } from "@/hooks/use-mobile";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useStudents } from "@/hooks/useStudents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type { FormData };

interface ExtendedWorksheetFormProps extends WorksheetFormProps {
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: { id: string; name: string } | null;
}

export default function WorksheetForm({ onSubmit, onStudentChange, preSelectedStudent }: ExtendedWorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [grammarFocus, setGrammarFocus] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("no-student");

  
  const [currentPlaceholders, setCurrentPlaceholders] = useState<PlaceholderSet>(getRandomPlaceholderSet());
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionSet[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { trackEvent } = useEventTracking();
  const { userId } = useAnonymousAuth();
  const { students } = useStudents();

  // Handle preSelectedStudent
  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudentId(preSelectedStudent.id);
    }
  }, [preSelectedStudent]);

  // Auto-adjust English level when student is selected
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== "no-student") {
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (selectedStudent) {
        const studentLevel = selectedStudent.english_level;
        // Map individual levels to our grouped levels
        if (studentLevel === 'A1' || studentLevel === 'A2') {
          setEnglishLevel('A1/A2');
        } else if (studentLevel === 'B1' || studentLevel === 'B2') {
          setEnglishLevel('B1/B2');
        } else if (studentLevel === 'C1' || studentLevel === 'C2') {
          setEnglishLevel('C1/C2');
        }
      }
    }
  }, [selectedStudentId, students]);

  // Call onStudentChange when selectedStudentId changes
  useEffect(() => {
    if (onStudentChange) {
      const studentId = selectedStudentId === "no-student" ? null : selectedStudentId;
      onStudentChange(studentId);
    }
  }, [selectedStudentId, onStudentChange]);

  useEffect(() => {
    if (isInitialLoad) {
      // Na początku: pierwszy zestaw jak placeholder, drugi losowy
      const matchingSet = getSuggestionSetMatchingPlaceholder(currentPlaceholders);
      const randomSets = getRandomSuggestionSets(1);
      
      if (matchingSet) {
        setCurrentSuggestions([matchingSet, randomSets[0]]);
      } else {
        setCurrentSuggestions(getRandomSuggestionSets(2));
      }
      setIsInitialLoad(false);
    }
  }, [currentPlaceholders, isInitialLoad]);

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

    // Track form submission
    trackEvent({
      eventType: 'form_submit',
      eventData: {
        lessonTime,
        lessonTopic,
        lessonGoal,
        grammarFocus,
        additionalInformation,
        englishLevel,
        timestamp: new Date().toISOString()
      }
    });

    onSubmit({
      lessonTime,
      lessonTopic,
      lessonGoal,
      teachingPreferences: grammarFocus,
      additionalInformation,
      englishLevel,
      studentId: selectedStudentId === "no-student" ? undefined : selectedStudentId || undefined
    });
  };

  const refreshSuggestions = () => {
    // Po refresh: oba zestawy losowe
    setCurrentPlaceholders(getRandomPlaceholderSet());
    setCurrentSuggestions(getRandomSuggestionSets(2));
  };

  const createSuggestionTiles = (field: 'lessonTopic' | 'lessonFocus' | 'additionalInformation' | 'grammarFocus') => {
    return currentSuggestions.map((set, index) => ({
      id: `${set.id}-${field}-${index}`,
      title: set[field]
    }));
  };

  return (
    <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
      <Card className="bg-white shadow-sm">
        <CardContent className={`${isMobile ? 'p-3' : 'p-8'}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-start'} mb-6`}>
                <div className={`${isMobile ? 'text-center' : ''}`}>
                  <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 ${isMobile ? 'text-xl' : 'text-3xl'} mb-2`}>
                    Create A Worksheet
                  </h1>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Tailored to your students. In seconds.
                  </p>
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-14'}`}>
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : 'w-32'}`}>
                    <Button 
                      type="button"
                      variant={lessonTime === "45min" ? "default" : "outline"} 
                      onClick={() => setLessonTime("45min")} 
                      className={lessonTime === "45min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                      size={isMobile ? "sm" : "sm"}
                    >
                      45 min
                    </Button>
                    <Button 
                      type="button"
                      variant={lessonTime === "60min" ? "default" : "outline"} 
                      onClick={() => setLessonTime("60min")} 
                      className={lessonTime === "60min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
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
                  suggestions={createSuggestionTiles('lessonTopic')}
                  isRequired={true}
                />

                <FormField 
                  label="Lesson focus: What should your student achieve by the end of the lesson?"
                  placeholder={currentPlaceholders.lessonFocus}
                  value={lessonGoal}
                  onChange={setLessonGoal}
                  suggestions={createSuggestionTiles('lessonFocus')}
                  isRequired={true}
                />
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Additional Information: Extra context & personal or situational details"
                  placeholder={currentPlaceholders.additionalInformation}
                  value={additionalInformation}
                  onChange={setAdditionalInformation}
                  suggestions={createSuggestionTiles('additionalInformation')}
                  isRequired={true}
                />
                
                <FormField 
                  label="Grammar focus (optional):"
                  placeholder={currentPlaceholders.grammarFocus}
                  value={grammarFocus}
                  onChange={setGrammarFocus}
                  suggestions={createSuggestionTiles('grammarFocus')}
                  isOptional={true}
                />
              </div>

              {/* Student Selection - only for authenticated users */}
              {userId && students.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student (optional):
                  </label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a student or leave empty for general worksheet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-student">No specific student</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.english_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={`mb-6 ${isMobile ? 'text-center' : ''}`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  GENERAL HINT: To create a truly personalized, student‑focused worksheet, please provide as detailed a description as possible in each field.
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-4`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={refreshSuggestions} 
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
