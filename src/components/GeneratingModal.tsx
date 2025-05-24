
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
}

const generationSteps = [
  "Initializing worksheet generation...",
  "Analyzing your requirements...", 
  "Researching industry-specific content...",
  "Creating reading comprehension passage...",
  "Generating vocabulary and matching exercises...",
  "Building interactive activities...",
  "Creating discussion questions...",
  "Developing error correction exercises...",
  "Finalizing exercise structure...",
  "Polishing content quality...",
  "Preparing your worksheet..."
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

    // Realistic progress animation (30-80 second generation)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return prev; // Stop at 95% until completion
        }
        // Slower progression based on elapsed time
        const targetProgress = Math.min((elapsedTime / 60) * 100, 95); // 60 seconds = 95%
        const increment = Math.random() * 1.5 + 0.5; // 0.5-2% increment
        return Math.min(prev + increment, targetProgress);
      });
    }, 2000); // Update every 2 seconds

    // Step animation - realistic timing based on elapsed time
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        // Change step every 5-8 seconds for more realistic feel
        const stepDuration = 5 + Math.random() * 3; // 5-8 seconds
        const expectedStep = Math.floor(elapsedTime / stepDuration) % generationSteps.length;
        return expectedStep;
      });
    }, 1000); // Check every second

    // Timer
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, elapsedTime]);

  // Complete progress when modal should close
  useEffect(() => {
    if (!isOpen && progress > 0) {
      setProgress(100);
    }
  }, [isOpen, progress]);

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
