
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
}

// Expanded generation steps to better reflect real process
const generationSteps = [
  "Analyzing your requirements...",
  "Processing topic and level information...",
  "Researching industry-specific content...",
  "Gathering educational materials...",
  "Planning exercise structure...",
  "Creating reading content...",
  "Designing matching exercises...",
  "Developing fill-in-blanks exercises...",
  "Preparing multiple-choice questions...",
  "Creating dialogue examples...",
  "Formulating discussion questions...",
  "Developing error correction exercises...",
  "Finalizing vocabulary lists...",
  "Polishing worksheet content...",
  "Preparing final formatting...",
];

export default function GeneratingModal({
  isOpen
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep(0);
      setElapsedTime(0);
      return;
    }

    // More realistic progress calculation for total generation time of ~60 seconds
    const totalExpectedDuration = 60000; // 60 seconds in milliseconds
    const progressUpdateInterval = 500; // Update every 500ms
    const progressIncrement = 100 / (totalExpectedDuration / progressUpdateInterval);
    
    // Progress animation - slower and more realistic
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Slow down as we approach 100%
        const remaining = 100 - prev;
        const newIncrement = prev < 90 
          ? progressIncrement 
          : progressIncrement * (remaining / 10);
          
        if (prev >= 99) {
          return 99; // Hold at 99% until generation completes
        }
        return Math.min(99, prev + newIncrement);
      });
    }, progressUpdateInterval);

    // Step animation - show each step for longer
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        // Calculate appropriate step based on progress
        const targetStep = Math.floor((progress / 100) * generationSteps.length);
        return Math.min(targetStep, generationSteps.length - 1);
      });
    }, 2000);

    // Timer
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, progress]);

  if (!isOpen) return null;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] space-y-6">
        <h2 className="text-2xl font-semibold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Generating Your Worksheet
        </h2>
        <Progress 
          value={progress} 
          className="h-3 bg-gray-200" 
          indicatorClassName="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" 
        />
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Time: {formatTime(elapsedTime)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <p className="text-center min-h-[24px] animate-pulse font-normal text-sky-400">
          {generationSteps[currentStep]}
        </p>
      </div>
    </div>;
}
