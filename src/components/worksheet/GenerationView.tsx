
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { FormData } from '@/components/WorksheetForm';
import InputParamsCard from './InputParamsCard';
import { WorksheetDisplay } from '@/components/WorksheetDisplay';

interface GenerationViewProps {
  inputParams: FormData;
  isGenerating: boolean;
  generationTime: number;
  sourceCount: number;
  generatedWorksheet: any;
  onStartEditing: () => void;
  onToggleView: () => void;
  viewMode: "student" | "teacher";
  onDownload: () => void;
  onSave: () => void;
  onReset: () => void;
  downloadStatus: string;
  isDownloadUnlocked: boolean;
}

export const GenerationView: React.FC<GenerationViewProps> = ({
  inputParams,
  isGenerating,
  generationTime,
  sourceCount,
  generatedWorksheet,
  onStartEditing,
  onToggleView,
  viewMode,
  onDownload,
  onSave,
  onReset,
  downloadStatus,
  isDownloadUnlocked
}) => {
  const getDownloadStatusMessage = () => {
    switch (downloadStatus) {
      case 'generating':
        return 'Generating download link...';
      case 'ready':
        return 'Download ready!';
      case 'failed':
        return 'Download failed. Please try again.';
      default:
        return 'Download Worksheet';
    }
  };

  const getDownloadIcon = () => {
    if (downloadStatus === 'generating') {
      return <Clock className="h-4 w-4 animate-spin mr-2" />;
    } else if (downloadStatus === 'ready') {
      return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
    } else if (downloadStatus === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500 mr-2" />;
    } else {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <InputParamsCard
        inputParams={inputParams}
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={onStartEditing} disabled={isGenerating}>
            Start Editing
          </Button>
          <Button variant="outline" onClick={onToggleView}>
            View as {viewMode === "student" ? "Teacher" : "Student"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} disabled={isGenerating}>
            Save to Dashboard
          </Button>
          <Button
            onClick={onDownload}
            disabled={isGenerating || downloadStatus === 'generating'}
          >
            {getDownloadIcon()}
            {getDownloadStatusMessage()}
          </Button>
          <Button variant="destructive" onClick={onReset} disabled={isGenerating}>
            Generate New
          </Button>
        </div>
      </div>
      
      {generatedWorksheet && (
        <WorksheetDisplay viewMode={viewMode} />
      )}
    </div>
  );
};
