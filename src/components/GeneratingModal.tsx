
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
  startTime?: number; // Start generation time
}

// More realistic generation steps with appropriate percentage weights
const generationSteps = [
  { message: "Analyzing requirements...", weight: 5 },
  { message: "Researching specialized content sources...", weight: 15 },
  { message: "Creating exercise structure...", weight: 15 },
  { message: "Generating exercises 1-4...", weight: 25 },
  { message: "Generating exercises 5-8...", weight: 25 },
  { message: "Refining final content...", weight: 10 },
  { message: "Preparing worksheet...", weight: 5 }
];

// Total weight sum
const totalWeight = generationSteps.reduce((sum, step) => sum + step.weight, 0);

// More realistic estimated total generation time in seconds
const estimatedTotalTime = 60; // average 60 seconds for generation

export default function GeneratingModal({
  isOpen,
  startTime
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setProgress(0);
      setCurrentStepIndex(0);
      setElapsedTime(0);
      return;
    }

    // Calculate initial time if provided
    const initialElapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setElapsedTime(initialElapsedTime);

    // Timer interval
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // More realistic step progression
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prevStep => {
        let nextStep = prevStep;
        const totalElapsed = elapsedTime;
        
        // Calculate which step we should be at based on time
        let cumulativeWeight = 0;
        for (let i = 0; i < generationSteps.length; i++) {
          cumulativeWeight += generationSteps[i].weight;
          const stepThreshold = (cumulativeWeight / totalWeight) * estimatedTotalTime;
          
          if (totalElapsed < stepThreshold) {
            if (i > prevStep) {
              return i;
            }
            break;
          }
        }
        
        // If processing takes longer than estimated, cycle through the last few steps
        if (totalElapsed > estimatedTotalTime) {
          // Cycle between the last 3 steps to show activity
          const lastSteps = [generationSteps.length - 3, generationSteps.length - 2, generationSteps.length - 1];
          const cyclePosition = Math.floor(totalElapsed / 5) % 3; // Change every 5 seconds
          return lastSteps[cyclePosition];
        }
        
        return prevStep;
      });
    }, 4000); // Change steps slightly faster

    // Progressive progress bar increase
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const totalElapsed = elapsedTime;
        
        // Map time to progress, up to 95% maximum
        // So user can see something is happening
        let newProgress;
        
        if (totalElapsed < estimatedTotalTime) {
          // For the first 60 seconds aim for 95% progress
          newProgress = Math.min(95, (totalElapsed / estimatedTotalTime) * 95);
        } else {
          // After exceeding estimated time, progress slowly approaches 99%
          const extraTimeElapsed = totalElapsed - estimatedTotalTime;
          // Each additional 20 seconds gives +1% progress, up to 99%
          const extraProgress = Math.min(4, extraTimeElapsed / 20);
          newProgress = 95 + extraProgress;
        }
        
        return newProgress;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, elapsedTime, startTime]);

  if (!isOpen) return null;

  // Format time as MM:SS
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
          {generationSteps[currentStepIndex].message}
        </p>
      </div>
    </div>
  );
}
