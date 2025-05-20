
import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContent from "./worksheet/WorksheetContent";
import { useWorksheetDisplay } from "@/hooks/useWorksheetDisplay";
import { WorksheetDisplayProps } from "@/types/worksheet";

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload,
  worksheetId,
  onFeedbackSubmit
}: WorksheetDisplayProps) {
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast: shadowToast } = useToast();
  
  const {
    viewMode,
    setViewMode,
    isEditing,
    editableWorksheet,
    setEditableWorksheet,
    showScrollTop,
    scrollToTop,
    handleEdit,
    handleSave,
    handleDownloadPDF,
    handleDownloadHTML
  } = useWorksheetDisplay(worksheet, onDownload);

  return (
    <div className="container mx-auto py-6" data-worksheet-id={worksheetId || undefined}>
      <div className="mb-6">
        <WorksheetHeader
          onBack={onBack}
          generationTime={generationTime}
          sourceCount={sourceCount}
          inputParams={inputParams}
        />
        <InputParamsCard inputParams={inputParams} />
        <WorksheetToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleDownloadHTML={handleDownloadHTML}
          handleDownloadPDF={handleDownloadPDF}
          title={editableWorksheet.title}
        />

        <WorksheetContent
          editableWorksheet={editableWorksheet}
          isEditing={isEditing}
          viewMode={viewMode}
          setEditableWorksheet={setEditableWorksheet}
          worksheetId={worksheetId || null}
          onFeedbackSubmit={onFeedbackSubmit}
          onDownload={onDownload}
        />
      </div>
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
