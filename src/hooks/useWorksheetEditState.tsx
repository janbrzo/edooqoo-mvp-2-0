
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Worksheet } from "@/components/WorksheetDisplay";

export const useWorksheetEditState = (initialWorksheet: Worksheet) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(initialWorksheet);
  const { toast } = useToast();
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };
  
  return {
    viewMode,
    setViewMode,
    isEditing,
    editableWorksheet,
    setEditableWorksheet,
    handleEdit,
    handleSave
  };
};
