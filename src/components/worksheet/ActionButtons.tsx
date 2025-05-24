
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Download } from "lucide-react";

interface ActionButtonsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDownloadHTML: () => void;
  onDownloadPDF: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isEditing,
  onEdit,
  onSave,
  onDownloadHTML,
  onDownloadPDF
}) => {
  return (
    <div className="flex items-center">
      {!isEditing && (
        <Button
          variant="outline"
          onClick={onEdit}
          className="border-worksheet-purple text-worksheet-purple mr-2"
          size="sm"
        >
          <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
        </Button>
      )}
      {isEditing && (
        <Button
          onClick={onSave}
          className="bg-green-600 hover:bg-green-700 mr-2"
          size="sm"
        >
          Save Changes
        </Button>
      )}
      <Button
        onClick={onDownloadHTML}
        className="bg-worksheet-purple hover:bg-worksheet-purpleDark mr-2"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" /> Download HTML
      </Button>
      <Button
        onClick={onDownloadPDF}
        className="bg-worksheet-purple hover:bg-worksheet-purpleDark"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button>
    </div>
  );
};

export default ActionButtons;
