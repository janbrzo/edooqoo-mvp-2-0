import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader } from "lucide-react";

interface GeneratingModalProps {
  isOpen: boolean;
}

const GeneratingModal: React.FC<GeneratingModalProps> = ({ isOpen }) => {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Initializing...");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen) {
      // Reset progress when modal opens
      setProgress(0);
      setCurrentTask("Initializing the content generation process");
      
      // Define generation steps with realistic timings
      const generationSteps = [
        { task: "Analyzing your requirements", duration: 8 },
        { task: "Creating outline for worksheet exercises", duration: 10 },
        { task: "Generating reading content and questions", duration: 15 },
        { task: "Formulating vocabulary list and definitions", duration: 12 },
        { task: "Creating matching exercise pairs", duration: 10 },
        { task: "Developing fill-in-the-blank sentences", duration: 12 },
        { task: "Generating multiple choice questions", duration: 10 },
        { task: "Creating dialogue exercise", duration: 8 },
        { task: "Developing discussion questions", duration: 10 },
        { task: "Preparing error correction sentences", duration: 10 },
        { task: "Finalizing teacher notes and tips", duration: 8 },
        { task: "Organizing worksheet layout", duration: 7 },
        { task: "Performing final quality check", duration: 5 }
      ];

      const totalDuration = generationSteps.reduce((sum, step) => sum + step.duration, 0);
      let elapsed = 0;
      let stepIndex = 0;

      // Create a more realistic progress animation
      interval = setInterval(() => {
        if (stepIndex < generationSteps.length) {
          const currentStep = generationSteps[stepIndex];
          setCurrentTask(currentStep.task);
          
          elapsed++;
          if (elapsed >= currentStep.duration) {
            elapsed = 0;
            stepIndex++;
          }
          
          // Calculate overall progress
          const completedDuration = generationSteps
            .slice(0, stepIndex)
            .reduce((sum, step) => sum + step.duration, 0);
          
          const currentProgress = completedDuration + elapsed;
          const progressPercentage = Math.min(
            Math.floor((currentProgress / totalDuration) * 100),
            99 // Never reach 100% until actual completion
          );
          
          setProgress(progressPercentage);
        }
      }, 600);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-md">
        <h2 className="text-xl font-semibold text-center mb-4">Generating Your Worksheet</h2>
        <p className="text-center mb-6 text-gray-600">
          {currentTask}
        </p>
        
        <div className="mb-4">
          <Progress
            value={progress}
            className="h-2 mb-2"
            indicatorClassName="bg-worksheet-purple"
          />
          <p className="text-xs text-right text-gray-500">{progress}% complete</p>
        </div>
        
        <div className="flex justify-center">
          <div className="flex items-center text-worksheet-purple">
            <Loader className="animate-spin mr-2 h-5 w-5" />
            <span>This may take up to a minute...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingModal;
