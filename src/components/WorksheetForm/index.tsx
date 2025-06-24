import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useEventTracking } from '@/hooks/useEventTracking';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }),
  grade: z.string().min(1, {
    message: "Please select a grade.",
  }),
  exercise_count: z.string().min(1, {
    message: "Please select number of exercises.",
  }),
  student_level: z.string().min(1, {
    message: "Please select student level.",
  }),
  instructions: z.string().optional(),
});

interface WorksheetFormProps {
  onSubmit: (values: FormData) => void;
  isLoading: boolean;
  inputParams?: any;
}

export interface FormData {
  topic: string;
  grade: string;
  exercise_count: string;
  student_level: string;
  instructions?: string;
}

const WorksheetForm = ({ onSubmit, isLoading, inputParams }: WorksheetFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: inputParams?.topic || "",
      grade: inputParams?.grade || "",
      exercise_count: inputParams?.exercise_count || "",
      student_level: inputParams?.student_level || "",
      instructions: inputParams?.instructions || "",
    },
  });

  const { trackEvent } = useEventTracking();

  function isValidPositiveInteger(str: string) {
    if (typeof str !== 'string') {
      return false;
    }

    const num = Number(str);

    if (Number.isNaN(num)) {
      return false;
    }

    if (!Number.isInteger(num)) {
      return false;
    }

    if (num <= 0) {
      return false;
    }

    return true;
  }

  const handleSubmit = (data: FormData) => {
    // Track form submit
    trackEvent({
      eventType: 'form_submit',
      eventData: {
        timestamp: new Date().toISOString(),
        formData: data
      }
    });

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Present Simple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Grade 1</SelectItem>
                    <SelectItem value="2">Grade 2</SelectItem>
                    <SelectItem value="3">Grade 3</SelectItem>
                    <SelectItem value="4">Grade 4</SelectItem>
                    <SelectItem value="5">Grade 5</SelectItem>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exercise_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of exercises</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of exercises" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">3 exercises</SelectItem>
                    <SelectItem value="5">5 exercises</SelectItem>
                    <SelectItem value="7">7 exercises</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="student_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Specific instructions for the worksheet (optional)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Worksheet"}
        </Button>
      </form>
    </Form>
  );
};

export default WorksheetForm;
