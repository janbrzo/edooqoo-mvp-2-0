
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DownloadActionsProps {
  isDownloadUnlocked: boolean;
  onDownloadClick: (type: 'html-student' | 'html-teacher') => void;
}

export default function DownloadActions({
  isDownloadUnlocked,
  onDownloadClick
}: DownloadActionsProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onDownloadClick('html-student')}
            className={`${isDownloadUnlocked 
              ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
              : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
            size="sm"
          >
            {isDownloadUnlocked ? (
              <Download className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {isMobile ? 'Student (HTML)' : 'Download STUDENT'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download as HTML file. Best quality, works offline. Double-click to open.</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onDownloadClick('html-teacher')}
            className={`${isDownloadUnlocked 
              ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
              : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
            size="sm"
          >
            {isDownloadUnlocked ? (
              <Download className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {isMobile ? 'Teacher (HTML)' : 'Download TEACHER'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download as HTML file. Best quality, works offline. Double-click to open.</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
