
import { useToast } from "@/hooks/use-toast";

interface UseWorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleDownloadHTML: () => void;
  handleDownloadPDF: () => void;
}

export const useWorksheetToolbar = ({
  viewMode,
  setViewMode,
  isEditing,
  handleEdit,
  handleSave,
  handleDownloadHTML,
  handleDownloadPDF,
}: UseWorksheetToolbarProps) => {
  const { toast } = useToast();
  
  const handleViewModeChange = (mode: "student" | "teacher") => {
    setViewMode(mode);
    toast({
      title: `Switched to ${mode} view`,
      description: mode === "student" ? "Now showing student view of the worksheet" : "Now showing teacher view with additional notes and answers",
    });
  };

  return {
    viewMode,
    isEditing,
    handleEdit,
    handleSave,
    handleDownloadHTML,
    handleDownloadPDF,
    handleViewModeChange,
  };
};
