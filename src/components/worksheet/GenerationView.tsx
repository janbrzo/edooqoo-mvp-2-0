
import React from "react";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { FormData } from "@/components/WorksheetForm";
import { Worksheet } from "@/types/worksheet";
import { useGenerationView } from "@/hooks/useGenerationView";

interface GenerationViewProps {
  worksheetId: string | null;
  generatedWorksheet: Worksheet;
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  userId: string | null;
}

const GenerationView: React.FC<GenerationViewProps> = ({
  worksheetId,
  generatedWorksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  userId
}) => {
  const { handleFeedbackSubmit, handleDownloadEvent } = useGenerationView({
    worksheetId,
    userId,
    generatedWorksheet
  });

  if (!generatedWorksheet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600">No worksheet data</h2>
          <p className="mt-2">There was a problem loading the worksheet. Please try again.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-worksheet-purple text-white rounded hover:bg-worksheet-purpleDark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorksheetDisplay 
      worksheet={generatedWorksheet} 
      inputParams={inputParams} 
      generationTime={generationTime} 
      sourceCount={sourceCount} 
      onBack={onBack}
      worksheetId={worksheetId}
      wordBankOrder={generatedWorksheet?.exercises?.find((ex: any) => ex.type === "matching")?.shuffledTerms?.map((item: any) => item.definition)}
      onDownload={handleDownloadEvent}
      onFeedbackSubmit={handleFeedbackSubmit}
    />
  );
};

export default GenerationView;
