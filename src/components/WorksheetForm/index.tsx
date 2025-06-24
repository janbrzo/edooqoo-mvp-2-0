import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightbulb, Clock, Target, BookOpen, Sparkles } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import FormField from "./FormField";
import EnglishLevelSelector from "./EnglishLevelSelector";
import { 
  LESSON_TIME_OPTIONS, 
  LESSON_GOAL_OPTIONS, 
  LESSON_TOPIC_OPTIONS 
} from "./constants";
import { useEventTracking } from "@/hooks/useEventTracking";

const formSchema = z.object({
  lessonTime: z.string().min(1, "Please select lesson duration"),
  englishLevel: z.string().min(1, "Please select English level"),
  lessonTopic: z.string().min(3, "Topic must be at least 3 characters long"),
  lessonGoal: z.string().min(10, "Goal must be at least 10 characters long"),
});

export type FormData = z.infer<typeof formSchema>;

interface WorksheetFormProps {
  onSubmit: (data: FormData) => void;
}

const WorksheetForm = ({ onSubmit }: WorksheetFormProps) => {
  const { trackEvent } = useEventTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lessonTime: "",
      englishLevel: "",
      lessonTopic: "",
      lessonGoal: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Track form submission
    await trackEvent({
      eventType: 'form_submit',
      eventData: {
        timestamp: new Date().toISOString(),
        formData: {
          lessonTime: data.lessonTime,
          englishLevel: data.englishLevel,
          lessonTopic: data.lessonTopic.substring(0, 50), // Truncate for privacy
          lessonGoal: data.lessonGoal.substring(0, 50) // Truncate for privacy
        }
      }
    });
    
    onSubmit(data);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-worksheet-purple/5 via-white to-worksheet-purple/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-worksheet-purple to-worksheet-purpleDark bg-clip-text text-transparent">
                Worksheet Generator
              </CardTitle>
            </motion.div>
            <CardDescription className="text-xl text-gray-600">
              Create personalized English learning materials in seconds
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="lessonTime"
                    label="Lesson Duration"
                    icon={<Clock className="h-5 w-5" />}
                    type="select"
                    options={LESSON_TIME_OPTIONS}
                    placeholder="Select lesson duration"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <EnglishLevelSelector control={form.control} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="lessonTopic"
                    label="Lesson Topic"
                    icon={<BookOpen className="h-5 w-5" />}
                    type="combobox"
                    options={LESSON_TOPIC_OPTIONS}
                    placeholder="e.g., Travel, Food, Business English..."
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <FormField
                    control={form.control}
                    name="lessonGoal"
                    label="Lesson Goal"
                    icon={<Target className="h-5 w-5" />}
                    type="combobox"
                    options={LESSON_GOAL_OPTIONS}
                    placeholder="e.g., Practice past tense verbs..."
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-worksheet-purple to-worksheet-purpleDark hover:from-worksheet-purpleDark hover:to-worksheet-purple text-white font-semibold py-4 text-lg rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Generate Worksheet
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WorksheetForm;
