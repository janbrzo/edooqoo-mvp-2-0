
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface GeneratingModalProps {
  isOpen: boolean;
  progress?: number;
  timeoutSeconds?: number;
}

export default function GeneratingModal({ 
  isOpen, 
  progress = 0, 
  timeoutSeconds = 30 
}: GeneratingModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [progressValue, setProgressValue] = useState(progress);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(timeoutSeconds);
      setProgressValue(0);
      return;
    }

    // Set up countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate progress increase
    const progressTimer = setInterval(() => {
      setProgressValue((prev) => {
        const newValue = prev + Math.random() * 5;
        return newValue > 95 ? 95 : newValue;
      });
    }, 700);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [isOpen, timeoutSeconds]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 relative mb-4">
            <div className="animate-spin h-16 w-16 border-4 border-worksheet-purpleLight border-t-worksheet-purple rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-sm text-worksheet-purple font-medium">AI</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-worksheet-purple">Generowanie arkusza...</h2>
          
          <p className="text-gray-600 mt-2">
            Trwa generowanie spersonalizowanego arkusza na podstawie Twoich preferencji.
            Może to potrwać do {timeoutSeconds} sekund.
          </p>
          
          <div className="mt-4 flex flex-col items-center w-full">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 max-w-xs">
              <div 
                className="bg-worksheet-purple h-2 rounded-full" 
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {timeLeft > 0 ? (
                `Pozostało około ${timeLeft} sekund...`
              ) : (
                "Finalizowanie, proszę czekać..."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
