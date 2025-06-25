import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEventTracking } from "@/hooks/useEventTracking";
import TrackingFormWrapper from './TrackingFormWrapper';

const formSchema = z.object({
  lessonTopic: z.string().min(3, {
    message: "Lesson topic must be at least 3 characters.",
  }),
  lessonGoal: z.string().min(10, {
    message: "Lesson goal must be at least 10 characters.",
  }),
  teachingPreferences: z.string().optional(),
  additionalInformation: z.string().optional(),
  englishLevel: z.string().optional(),
  lessonTime: z.string(),
});

export interface FormData extends z.infer<typeof formSchema> {}

interface WorksheetFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const WorksheetForm = ({ onSubmit, isLoading }: WorksheetFormProps) => {
  const { toast } = useToast();
  const { trackEvent } = useEventTracking();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lessonTopic: "",
      lessonGoal: "",
      teachingPreferences: "",
      additionalInformation: "",
      englishLevel: "A1",
      lessonTime: "60 min",
    },
  });

  const handleSubmit = (data: FormData) => {
    // Track form submission
    trackEvent({
      eventType: 'form_submit',
      eventData: {
        timestamp: new Date().toISOString(),
        lessonTime: data.lessonTime,
        englishLevel: data.englishLevel
      }
    });
    
    onSubmit(data);
  };

  return (
    <TrackingFormWrapper>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="lessonTopic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Topic</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson topic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lessonGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Goal</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter lesson goal"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teachingPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teaching Preferences (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter teaching preferences"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalInformation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Information (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional information"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="englishLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>English Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lessonTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30 min">30 min</SelectItem>
                      <SelectItem value="45 min">45 min</SelectItem>
                      <SelectItem value="60 min">60 min</SelectItem>
                      <SelectItem value="90 min">90 min</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                Generating...
                <svg
                  className="animate-spin h-5 w-5 ml-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </>
            ) : (
              "Generate Worksheet"
            )}
          </Button>
        </form>
      </Form>
    </TrackingFormWrapper>
  );
};

export default WorksheetForm;
