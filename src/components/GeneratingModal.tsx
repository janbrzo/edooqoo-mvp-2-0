
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

interface GeneratingModalProps {
  isOpen: boolean;
  startGenerationTime?: number;
}

// Bardziej szczegółowe kroki generowania z większą liczbą szczegółów
const generationSteps = [
  "Analizuję twoje wymagania...",
  "Określam poziom trudności i typ zadań...",
  "Wybieram odpowiednie słownictwo dla poziomu...",
  "Tworzę plan struktury worksheetu...",
  "Przygotowuję tekst do czytania...",
  "Tworzę pytania na podstawie tekstu...",
  "Generuję zadanie z dopasowywaniem pojęć...",
  "Tworzę zadania typu uzupełnij luki...",
  "Generuję pytania wielokrotnego wyboru...",
  "Tworzę dialog z wyrażeniami do praktyki...",
  "Przygotowuję pytania do dyskusji...",
  "Dodaję zadanie z poprawianiem błędów...",
  "Generuję zadanie z tworzeniem słów...",
  "Tworzę zadanie z układaniem wyrazów...",
  "Generuję zadania prawda/fałsz...",
  "Tworzę arkusz słownictwa...",
  "Dodaję wskazówki dla nauczyciela...",
  "Walidacja i kontrola jakości treści...",
  "Formatuję zawartość worksheetu...",
  "Finalizuję generowanie..."
];

export default function GeneratingModal({
  isOpen,
  startGenerationTime = 0
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number | null>(null);

  // Estymacja całkowitego czasu generowania (w sekundach) - zazwyczaj od 30s do 80s
  const [totalEstimatedTime] = useState(() => {
    // Losowy czas między 45 a 75 sekund
    return Math.floor(Math.random() * (75 - 45 + 1)) + 45;
  });

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep(0);
      setElapsedTime(0);
      setEstimatedTimeLeft(null);
      return;
    }

    // Stopniowe zwiększanie progresu, ale wolniej niż wcześniej
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Bardziej realistyczna progresja - szybciej na początku, wolniej pod koniec
        if (prev >= 95) {
          return prev + 0.05; // Bardzo powoli na końcu
        } else if (prev >= 85) {
          return prev + 0.1; // Powoli zbliżając się do końca
        } else if (prev >= 70) {
          return prev + 0.2; // Średnie tempo w środkowej części
        } else {
          return prev + 0.5; // Szybciej na początku
        }
      });
    }, 300); // Wolniejsza aktualizacja

    // Zmieniaj kroki w tempie zależnym od progresu
    const stepInterval = setInterval(() => {
      setCurrentStep(prevStep => {
        // Oblicz następny krok na podstawie procentu progresji
        // Dostosuj tempo tak, aby ostatni krok pojawił się przy ok. 95% progress
        const nextStep = Math.min(
          Math.floor((progress / 95) * generationSteps.length),
          generationSteps.length - 1
        );
        
        // Jeśli progress jest niemal ukończony, pokazuj ostatni krok
        if (progress > 98) {
          return generationSteps.length - 1;
        }
        
        return nextStep;
      });
    }, 1000);

    // Timer odliczający rzeczywisty czas
    const timerInterval = setInterval(() => {
      const now = Date.now();
      
      // Jeśli mamy startGenerationTime, używamy go do obliczenia czasu
      if (startGenerationTime > 0) {
        const secondsElapsed = Math.floor((now - startGenerationTime) / 1000);
        setElapsedTime(secondsElapsed);
        
        // Obliczamy szacowany pozostały czas
        const remainingTime = Math.max(0, totalEstimatedTime - secondsElapsed);
        setEstimatedTimeLeft(remainingTime);
      } else {
        // Fallback, gdyby nie było startGenerationTime
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, progress, startGenerationTime, totalEstimatedTime]);

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
          Generowanie Twojego Worksheetu
        </h2>
        
        <Progress 
          value={progress} 
          className="h-3 bg-gray-200" 
          indicatorClassName="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" 
        />
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Czas: {formatTime(elapsedTime)}</span>
          <span>{Math.min(Math.round(progress), 100)}%</span>
        </div>
        
        {estimatedTimeLeft !== null && estimatedTimeLeft > 0 && (
          <div className="text-xs text-center text-gray-500">
            Szacowany pozostały czas: około {formatTime(estimatedTimeLeft)}
          </div>
        )}
        
        <p className="text-center min-h-[24px] animate-pulse font-normal text-sky-400">
          {generationSteps[currentStep]}
        </p>
      </div>
    </div>
  );
}
