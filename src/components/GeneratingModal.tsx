
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
  startTime?: number; // Czas rozpoczęcia generowania
}

// Bardziej realistyczne etapy generowania z odpowiednimi wagami procentowymi
const generationSteps = [
  { message: "Analizuję wymagania...", weight: 5 },
  { message: "Badam źródła treści specjalistycznych...", weight: 15 },
  { message: "Tworzę strukturę ćwiczeń...", weight: 15 },
  { message: "Generuję ćwiczenia 1-4...", weight: 25 },
  { message: "Generuję ćwiczenia 5-8...", weight: 25 },
  { message: "Dopracowuję końcową treść...", weight: 10 },
  { message: "Przygotowuję arkusz pracy...", weight: 5 }
];

// Łączna suma wag
const totalWeight = generationSteps.reduce((sum, step) => sum + step.weight, 0);

// Bardziej realistyczny szacowany całkowity czas generowania w sekundach
const estimatedTotalTime = 60; // średnio 60 sekund dla generowania

export default function GeneratingModal({
  isOpen,
  startTime
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isOpen) {
      // Resetuj stan gdy modal jest zamknięty
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
        const totalElapsed = elapsedTime;
        
        // Obliczamy, w którym kroku powinniśmy być na podstawie czasu
        let cumulativeWeight = 0;
        for (let i = 0; i < generationSteps.length; i++) {
          cumulativeWeight += generationSteps[i].weight;
          const stepThreshold = (cumulativeWeight / totalWeight) * estimatedTotalTime;
          
          if (totalElapsed < stepThreshold && i > prevStep) {
            return i;
          }
        }
        
        // Jeśli przetwarzanie trwa dłużej niż szacowano, zostajemy przy ostatnim kroku
        return Math.min(prevStep + 1, generationSteps.length - 1);
      });
    }, 5000); // Wolniejsze przejścia między krokami

    // Progresywne zwiększanie paska postępu
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const totalElapsed = elapsedTime;
        
        // Mapowanie czasu na postęp, maksymalnie do 95%
        // Tak aby użytkownik widział że coś się dzieje
        let newProgress;
        
        if (totalElapsed < estimatedTotalTime) {
          // Przez pierwsze 60 sekund dążymy do 95% postępu
          newProgress = Math.min(95, (totalElapsed / estimatedTotalTime) * 95);
        } else {
          // Po przekroczeniu szacowanego czasu, postęp powoli dochodzi do 99%
          const extraTimeElapsed = totalElapsed - estimatedTotalTime;
          // Każde dodatkowe 20 sekund daje +1% postępu, aż do 99%
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

  // Formatuje czas w postaci MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] space-y-6">
        <h2 className="text-2xl font-semibold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Generuję Twój Arkusz Pracy
        </h2>
        <Progress 
          value={progress} 
          className="h-3 bg-gray-200" 
          indicatorClassName="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" 
        />
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Czas: {formatTime(elapsedTime)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <p className="text-center min-h-[24px] animate-pulse font-normal text-sky-400">
          {generationSteps[currentStepIndex].message}
        </p>
      </div>
    </div>
  );
}
