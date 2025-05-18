
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
  startTime?: number; // Czas rozpoczęcia generowania
}

// Bardziej realistyczne etapy generowania z odpowiednimi wagami procentowymi
const generationSteps = [
  { message: "Analyzing your requirements...", weight: 5 },
  { message: "Researching industry-specific content...", weight: 15 },
  { message: "Creating exercise structure...", weight: 20 },
  { message: "Generating exercises...", weight: 35 },
  { message: "Polishing final content...", weight: 20 },
  { message: "Preparing your worksheet...", weight: 5 }
];

// Łączna suma wag
const totalWeight = generationSteps.reduce((sum, step) => sum + step.weight, 0);

// Szacowany całkowity czas generowania w sekundach (średnio 60 sekund)
const estimatedTotalTime = 60;

export default function GeneratingModal({
  isOpen,
  startTime
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepIndex(0);
      setElapsedTime(0);
      return;
    }

    // Obliczanie początkowego czasu jeśli został przekazany
    const initialElapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setElapsedTime(initialElapsedTime);

    // Interwał dla czasu
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Bardziej realistyczna progresja kroków
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prevStep => {
        // Oblicz kiedy powinien nastąpić kolejny krok na podstawie wag i szacowanego całkowitego czasu
        const totalElapsed = elapsedTime;
        let weightSum = 0;
        
        for (let i = 0; i < generationSteps.length; i++) {
          weightSum += generationSteps[i].weight;
          const stepThreshold = (weightSum / totalWeight) * estimatedTotalTime;
          
          if (totalElapsed < stepThreshold && i > prevStep) {
            return i;
          }
        }
        
        // Jeśli minęło więcej czasu niż szacowano, po prostu pokazuj ostatni etap
        return Math.min(prevStep + 1, generationSteps.length - 1);
      });
    }, 3000);

    // Progresywne zwiększanie paska postępu
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const totalElapsed = elapsedTime;
        
        // Wolniejszy postęp na podstawie upływu czasu
        // Dochodzimy do 95% postępu w szacowanym czasie, pozostałe 5% zostawiamy na końcową fazę
        let newProgress = Math.min(95, (totalElapsed / estimatedTotalTime) * 95);
        
        // Jeśli minęło więcej czasu niż szacowano, zwiększamy postęp powoli do 99%
        if (totalElapsed > estimatedTotalTime) {
          newProgress = 95 + Math.min(4, (totalElapsed - estimatedTotalTime) / 20);
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
