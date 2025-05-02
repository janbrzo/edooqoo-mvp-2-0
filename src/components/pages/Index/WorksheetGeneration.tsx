
import React, { useState } from "react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import Sidebar from "@/components/Sidebar";
import GeneratingModal from "@/components/GeneratingModal";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { v4 as uuidv4 } from 'uuid';
import mockWorksheetData from '@/mockWorksheetData';

interface WorksheetGenerationProps {
  userId: string;
  onWorksheetGenerated: (worksheet: any, inputParams: FormData, generationTime: number, sourceCount: number, worksheetId: string) => void;
}

const getExercisesByTime = (exercises: any[], lessonTime: string) => {
  if (lessonTime === "30 min") {
    return exercises.slice(0, 4); // First 4 exercises for 30 min
  } else if (lessonTime === "45 min") {
    return exercises.slice(0, 6); // First 6 exercises for 45 min
  } else if (lessonTime === "60 min") {
    return exercises.slice(0, 8); // First 8 exercises for 60 min
  }
  return exercises.slice(0, 6); // Default to 6 exercises
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const WorksheetGeneration: React.FC<WorksheetGenerationProps> = ({ userId, onWorksheetGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (data: FormData) => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate worksheet using the actual API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // If we have a real worksheet, use it
      if (worksheetData && worksheetData.exercises && worksheetData.title) {
        // Handle shuffling for matching exercises
        worksheetData.exercises.forEach((exercise: any) => {
          if (exercise.type === "matching" && exercise.items) {
            exercise.originalItems = [...exercise.items];
            exercise.shuffledTerms = shuffleArray([...exercise.items]);
          }
        });
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        
        // Use the generation time and source count from the API response
        const generationTime = worksheetData.generationTime || Math.floor(Math.random() * (65 - 31) + 31);
        const sourceCount = worksheetData.sourceCount || Math.floor(Math.random() * (90 - 50) + 50);
        
        onWorksheetGenerated(worksheetData, data, generationTime, sourceCount, wsId);
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
      
      toast({
        title: "Worksheet generated successfully!",
        description: "Your custom worksheet is now ready to use.",
        className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
      });
    } catch (error) {
      console.error("Worksheet generation error:", error);
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      fallbackWorksheet.exercises = getExercisesByTime(fallbackWorksheet.exercises, data.lessonTime);
      
      fallbackWorksheet.exercises.forEach((exercise: any) => {
        if (exercise.type === "matching" && exercise.items) {
          exercise.originalItems = [...exercise.items];
          exercise.shuffledTerms = shuffleArray([...exercise.items]);
        }
      });
      
      const tempId = uuidv4();
      
      onWorksheetGenerated(
        fallbackWorksheet, 
        data, 
        Math.floor(Math.random() * (65 - 31) + 31),
        Math.floor(Math.random() * (90 - 50) + 50),
        tempId
      );
      
      // Let the user know we're using a fallback
      toast({
        title: "Using sample worksheet",
        description: error instanceof Error 
          ? `Generation error: ${error.message}. Using a sample worksheet instead.` 
          : "An unexpected error occurred. Using a sample worksheet instead.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="container mx-auto flex main-container">
        <div className="w-1/5 mx-0 py-[48px]">
          <Sidebar />
        </div>
        <div className="w-4/5 px-6 py-6 form-container">
          <WorksheetForm onSubmit={handleFormSubmit} />
        </div>
      </div>
      <GeneratingModal isOpen={isGenerating} />
    </>
  );
};

export default WorksheetGeneration;
