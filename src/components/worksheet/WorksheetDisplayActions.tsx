
import React from 'react';
import { useToast } from "@/hooks/use-toast";

interface WorksheetDisplayActionsProps {
  onEdit: () => void;
  onSave: () => void;
  isEditing: boolean;
}

export default function WorksheetDisplayActions({
  onEdit,
  onSave,
  isEditing
}: WorksheetDisplayActionsProps) {
  const { toast } = useToast();

  const handleEdit = () => {
    onEdit();
  };

  const handleSave = () => {
    onSave();
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };

  return {
    handleEdit,
    handleSave
  };
}
