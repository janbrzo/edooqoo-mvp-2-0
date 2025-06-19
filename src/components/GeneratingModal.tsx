
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
}

const generationSteps = [
  "Analyzing your requirements...",
  "Researching topic-specific content...", 
  "Creating exercise structure...",
  "Generating reading comprehension...",
  "Creating vocabulary exercises...",
  "Developing grammar activities...",
  "Designing interactive tasks...",
  "Adding teacher guidance...",
  "Optimizing content difficulty...",
  "Finalizing worksheet layout...",
  "Quality checking exercises...",
  "Preparing downloadable content...",
  "Almost ready..."
];

export default function GeneratingModal({ isOpen }: GeneratingModalProps) {
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

    // More realistic progress - slower and more variable
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          // Slow down significantly near the end
          return Math.min(prev + Math.random() * 0.5, 99);
        } else if (prev >= 80) {
          // Slow down at 80%
          return prev + Math.random() * 1;
        } else if (prev >= 60) {
          // Medium speed at 60%
          return prev + Math.random() * 2;
        } else {
          // Faster at the beginning
          return prev + Math.random() * 3;
        }
      });
    }, 800); // Slower interval

    // Realistic step progression - varies between 3-8 seconds per step
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= generationSteps.length - 1) {
          return Math.floor(Math.random() * 3) + generationSteps.length - 3; // Stay in last 3 steps
        }
        return prev + 1;
      });
    }, Math.random() * 5000 + 3000); // Between 3-8 seconds

    // Timer - counts real time
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
    </div>
  );
}
