
import React from "react";
import { useWorksheetToolbar } from "@/hooks/useWorksheetToolbar";
import ViewToggleButtons from "./toolbar/ViewToggleButtons";
import ActionButtons from "./toolbar/ActionButtons";

interface WorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadHTML: () => void;
  handleDownloadPDF: () => void;
}

const WorksheetToolbar = (props: WorksheetToolbarProps) => {
  const {
    viewMode,
    isEditing,
    handleEdit,
    handleSave,
    handleDownloadHTML,
    handleDownloadPDF,
    handleViewModeChange,
  } = useWorksheetToolbar(props);

  return (
    <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
      <div className="flex justify-between items-center max-w-[98%] mx-auto">
        <ViewToggleButtons 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange} 
        />
        <ActionButtons 
          isEditing={isEditing}
          onEdit={handleEdit}
          onSave={handleSave}
          onDownloadHTML={handleDownloadHTML}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    </div>
  );
};

export default WorksheetToolbar;
