
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type LessonTime = "30 min" | "45 min" | "60 min";

type Tile = {
  id: string;
  title: string;
};

const LESSON_TOPICS: Tile[] = [
  { id: "it-debug", title: "IT: debugging code" },
  { id: "business-sales", title: "Business: sales negotiations" },
  { id: "finance-budget", title: "Finance: budgeting and forecasting" },
  { id: "marketing-social", title: "Marketing: creating social media content" },
  { id: "logistics-supply", title: "Logistics: supply chain issues" },
  { id: "hr-interviews", title: "HR: job interviews" },
  { id: "medicine-symptoms", title: "Medicine: describing symptoms" },
  { id: "education-tools", title: "Education: online learning tools" },
  { id: "law-contracts", title: "Law: understanding contracts" },
  { id: "tourism-booking", title: "Tourism: hotel booking" },
  { id: "retail-customer", title: "Retail: customer service skills" },
  { id: "automotive-diagnostic", title: "Automotive: diagnostic procedures" },
  { id: "telecom-network", title: "Telecommunications: network troubleshooting" },
  { id: "healthcare-patient", title: "Healthcare: patient consultation" },
  { id: "real-estate-valuation", title: "Real Estate: property valuation" },
  { id: "construction-safety", title: "Construction: safety protocols" },
  { id: "engineering-project", title: "Engineering: project planning" },
  { id: "hospitality-guest", title: "Hospitality: guest relations" }
];

const LESSON_GOALS: Tile[] = [
  { id: "presentation", title: "Preparing for a presentation" },
  { id: "small-talk", title: "Improving small talk skills" },
  { id: "formal-emails", title: "Writing formal emails" },
  { id: "listening", title: "Practicing listening comprehension" },
  { id: "business-processes", title: "Describing business processes" },
  { id: "grammar", title: "Understanding grammar rules" },
  { id: "vocabulary", title: "Expanding industry-specific vocabulary" },
  { id: "job-interview", title: "Preparing for a job interview" },
  { id: "role-play", title: "Role-playing workplace scenarios" },
  { id: "speaking", title: "Speaking fluently under pressure" },
  { id: "video-conferencing", title: "Becoming comfortable with video conferencing" },
  { id: "international", title: "Developing skills for international conferences" },
  { id: "tech-discussions", title: "Developing fluency in technology discussions" },
  { id: "leadership", title: "Practicing for team leadership roles" },
  { id: "customer-roles", title: "Preparing for customer-facing roles" },
  { id: "summarizing", title: "Learning to summarize lengthy documents" },
  { id: "cultural", title: "Understanding cultural nuances in business" },
  { id: "email-writing", title: "Improving email writing skills" }
];

const TEACHING_PREFERENCES: Tile[] = [
  { id: "writing", title: "Writing exercises" },
  { id: "role-plays", title: "Role-plays and dialogues" },
  { id: "gap-filling", title: "Gap-filling" },
  { id: "vocabulary", title: "Vocabulary focus" },
  { id: "grammar", title: "Grammar transformation" },
  { id: "reading", title: "Reading with questions" },
  { id: "multiple-choice", title: "Multiple choice" },
  { id: "brainstorming", title: "Brainstorming" },
  { id: "paraphrasing", title: "Paraphrasing" },
  { id: "picture", title: "Picture-based exercises" },
  { id: "comparison", title: "Comparison and contrast tasks" },
  { id: "reading-comp", title: "Reading comprehension activities" },
  { id: "simulated", title: "Simulated meetings or interviews" },
  { id: "gap-fill", title: "Gap-fill exercises" },
  { id: "email-templates", title: "Email writing templates" },
  { id: "audio", title: "Audio materials with comprehension tasks" },
  { id: "error-correction", title: "Error correction exercises" },
  { id: "case-studies", title: "Case studies with vocabulary focus" }
];

const STUDENT_PROFILES: Tile[] = [
  { id: "it-career", title: "Goal: IT career advancement, prefers writing, interested in programming, knows Present Simple, struggles with Future Tenses" },
  { id: "ielts", title: "Goal: passing IELTS exam, prefers quizzes, interested in travel, knows general vocabulary, struggles with idioms" },
  { id: "business", title: "Goal: business conversations, prefers dialogues, interested in finance, knows Past Simple, struggles with phrasal verbs" },
  { id: "presentation", title: "Goal: work presentation, prefers discussions, interested in marketing, knows industry vocabulary, struggles with conditionals" },
  { id: "conversation", title: "Goal: conversation fluency, prefers role-plays, interested in sports, knows Present Perfect, struggles with Passive Voice" },
  { id: "technical", title: "Goal: technical writing skills, visual learner, background in engineering, comfortable with technical vocabulary, needs help with articles" },
  { id: "customer", title: "Goal: customer service improvement, auditory learner, retail background, good conversational skills, difficulty with formal language" },
  { id: "medical", title: "Goal: medical communication, hands-on learner, healthcare professional, strong reading skills, challenges with pronunciation" },
  { id: "academic", title: "Goal: academic presentations, analytical thinker, research background, excellent writing skills, nervous about public speaking" },
  { id: "meetings", title: "Goal: international meetings, global mindset, management experience, good vocabulary range, issues with listening comprehension" },
  { id: "legal", title: "Goal: legal correspondence, detail-oriented, law background, excellent grammar, struggles with speaking fluently" },
  { id: "hospitality", title: "Goal: hospitality skills, outgoing personality, tourism background, good speaking skills, needs work on written communication" }
];

const STUDENT_STRUGGLES: Tile[] = [
  { id: "pronunciation", title: "Student struggles with 'r' pronunciation" },
  { id: "visual", title: "Student prefers visual learning materials" },
  { id: "nervous", title: "Student gets nervous during role-plays, needs encouragement" },
  { id: "subject-knowledge", title: "Student has extensive subject knowledge but limited language skills" },
  { id: "travel", title: "Student frequently travels internationally and needs practical travel English" },
  { id: "impatient", title: "Student is a quick learner but gets impatient with repetitive exercises" },
  { id: "exam", title: "Student needs exam-oriented practice with timed activities" },
  { id: "listening", title: "Student has difficulty with listening comprehension of native speakers" },
  { id: "accent", title: "Student has a strong accent that sometimes affects intelligibility" },
  { id: "dyslexia", title: "Student has dyslexia and benefits from multi-sensory approaches" },
  { id: "vocabulary", title: "Student gets overwhelmed with too much new vocabulary at once" }
];

const getRandomTiles = (tiles: Tile[], count = 5): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export interface FormData {
  lessonTime: LessonTime;
  lessonTopic: string;
  lessonGoal: string;
  teachingPreferences: string;
  studentProfile?: string;
  studentStruggles?: string;
}

interface WorksheetFormProps {
  onSubmit: (data: FormData) => void;
}

export default function WorksheetForm({ onSubmit }: WorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("45 min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [teachingPreferences, setTeachingPreferences] = useState("");
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
    
    // Basic validation
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
    <div className="w-full py-6">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-worksheet-purple">Create Your Worksheet</h1>
            <div className="flex gap-2">
              <Button 
                variant={lessonTime === "30 min" ? "default" : "outline"} 
                onClick={() => setLessonTime("30 min")}
                className={lessonTime === "30 min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
              >
                30 min
              </Button>
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
              {/* Lesson Topic */}
              <div>
                <label className="block text-sm font-medium mb-2">Lesson topic: What is the main subject of the lesson?</label>
                <Input 
                  type="text" 
                  placeholder="E.g. IT: debugging code"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {randomTopics.map(topic => (
                    <Button 
                      key={topic.id} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs font-light"
                      onClick={() => setLessonTopic(topic.title)}
                    >
                      {topic.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Lesson Goal */}
              <div>
                <label className="block text-sm font-medium mb-2">Lesson goal: What would you like to focus on during this lesson?</label>
                <Input 
                  type="text" 
                  placeholder="E.g. Preparing for a work presentation on AI"
                  value={lessonGoal}
                  onChange={(e) => setLessonGoal(e.target.value)}
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {randomGoals.map(goal => (
                    <Button 
                      key={goal.id} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs font-light"
                      onClick={() => setLessonGoal(goal.title)}
                    >
                      {goal.title}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Teaching Preferences */}
            <div>
              <label className="block text-sm font-medium mb-2">Teaching preferences: What stimulates your student best?</label>
              <Input 
                type="text" 
                placeholder="E.g. Writing exercises, dialogues"
                value={teachingPreferences}
                onChange={(e) => setTeachingPreferences(e.target.value)}
                className="mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {randomPreferences.map(preference => (
                  <Button 
                    key={preference.id} 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs font-light"
                    onClick={() => setTeachingPreferences(preference.title)}
                  >
                    {preference.title}
                  </Button>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-medium text-muted-foreground pt-2">Optional Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Profile */}
              <div>
                <label className="block text-sm font-medium mb-2">Student Profile</label>
                <Input 
                  type="text" 
                  placeholder="E.g. Goal: IT career advancement..."
                  value={studentProfile}
                  onChange={(e) => setStudentProfile(e.target.value)}
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {randomProfiles.map(profile => (
                    <Button 
                      key={profile.id} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs font-light"
                      onClick={() => setStudentProfile(profile.title)}
                    >
                      {profile.title.substring(0, 50)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Student Struggles */}
              <div>
                <label className="block text-sm font-medium mb-2">Main Struggles: What does your student struggle with during lessons?</label>
                <Input 
                  type="text" 
                  placeholder="E.g. Student struggles with 'r' pronunciation"
                  value={studentStruggles}
                  onChange={(e) => setStudentStruggles(e.target.value)}
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {randomStruggles.map(struggle => (
                    <Button 
                      key={struggle.id} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs font-light"
                      onClick={() => setStudentStruggles(struggle.title)}
                    >
                      {struggle.title}
                    </Button>
                  ))}
                </div>
              </div>
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
