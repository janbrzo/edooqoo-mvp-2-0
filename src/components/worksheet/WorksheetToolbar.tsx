
import React from "react";
import ViewModeToggle from "./ViewModeToggle";
import ActionButtons from "./ActionButtons";

interface WorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadHTML: () => void;
  handleDownloadPDF: () => void;
}

const WorksheetToolbar = ({
  viewMode,
  setViewMode,
  isEditing,
  handleEdit,
  handleSave,
  handleDownloadHTML,
  handleDownloadPDF,
}: WorksheetToolbarProps) => (
  <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
    <div className="flex justify-between items-center max-w-[98%] mx-auto">
      <ViewModeToggle 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
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

export default WorksheetToolbar;
