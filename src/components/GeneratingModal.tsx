
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Status messages that will rotate during generation
const statusMessages = [
  "Analyzing your requirements...",
  "Researching relevant materials...",
  "Designing appropriate exercises...",
  "Generating vocabulary content...",
  "Creating reading passages...",
  "Formulating discussion questions...",
  "Constructing matching exercises...",
  "Building multiple choice questions...",
  "Preparing teacher notes...",
  "Finalizing worksheet layout...",
  "Applying quality checks..."
];

interface GeneratingModalProps {
  isOpen: boolean;
}

export default function GeneratingModal({ isOpen }: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(statusMessages[0]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setSeconds(0);
      return;
    }

    // Timer for progress
    const timer = setInterval(() => {
      setProgress(prev => {
        // Progress goes from 0-100 over about 45 seconds
        const newProgress = prev + 100/45;
        return newProgress > 100 ? 100 : newProgress;
      });
      
      setSeconds(prev => prev + 1);
    }, 1000);

    // Timer for changing status messages
    const statusTimer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * statusMessages.length);
      setCurrentStatus(statusMessages[randomIndex]);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-6">
          <h2 className="text-xl font-bold mb-6">Generating your worksheet...</h2>
          
          <div className="mb-6">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-worksheet-purple to-purple-400 rounded-full"
                style={{ width: `${progress}%`, transition: 'width 1s linear' }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-mono">
              {seconds < 10 ? `00:0${seconds}` : `00:${seconds}`}
            </p>
          </div>
          
          <p className="text-sm text-gray-600">{currentStatus}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
