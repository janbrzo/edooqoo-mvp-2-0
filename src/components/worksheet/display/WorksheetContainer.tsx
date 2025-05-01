
import React, { useRef } from "react";
import WorksheetHeader from "../WorksheetHeader";
import InputParamsCard from "../InputParamsCard";
import WorksheetToolbar from "../WorksheetToolbar";
import WorksheetContent from "../WorksheetContent";
import TeacherNotes from "../TeacherNotes";
import { ArrowUp } from "lucide-react";
import WorksheetRating from "@/components/WorksheetRating";

interface WorksheetContainerProps {
  worksheet: any;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  viewMode: 'student' | 'teacher';
  isEditing: boolean;
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
  showScrollTop: boolean;
  scrollToTop: () => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadPDF: () => void;
  onSubmitRating?: (rating: number, feedback: string) => void;
}

const WorksheetContainer: React.FC<WorksheetContainerProps> = ({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  viewMode,
  isEditing,
  editableWorksheet,
  setEditableWorksheet,
  showScrollTop,
  scrollToTop,
  handleEdit,
  handleSave,
  handleDownloadPDF,
  onSubmitRating
}) => {
  const worksheetRef = useRef<HTMLDivElement>(null);

  return (
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
        setViewMode={viewMode => viewMode}
        isEditing={isEditing}
        handleEdit={handleEdit}
        handleSave={handleSave}
        handleDownloadPDF={handleDownloadPDF}
      />
      <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef}>
        <WorksheetContent 
          editableWorksheet={editableWorksheet}
          isEditing={isEditing}
          viewMode={viewMode}
          setEditableWorksheet={setEditableWorksheet}
        />
      </div>
      
      <div data-no-pdf="true" className="rating-section mb-8">
        {onSubmitRating && <WorksheetRating onSubmitRating={onSubmitRating} />}
      </div>
      
      <TeacherNotes />
      
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
};

export default WorksheetContainer;
