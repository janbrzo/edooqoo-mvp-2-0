
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lightbulb, User, Download } from "lucide-react";

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
      <div className="flex space-x-2">
        <Button
          variant={viewMode === 'student' ? 'default' : 'outline'}
          onClick={() => setViewMode('student')}
          className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
          size="sm"
        >
          <User className="mr-2 h-4 w-4" />
          Student View
        </Button>
        <Button
          variant={viewMode === 'teacher' ? 'default' : 'outline'}
          onClick={() => setViewMode('teacher')}
          className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
          size="sm"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Teacher View
        </Button>
      </div>
      <div className="flex items-center">
        {!isEditing && (
          <Button
            variant="outline"
            onClick={handleEdit}
            className="border-worksheet-purple text-worksheet-purple mr-2"
            size="sm"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
          </Button>
        )}
        {isEditing && (
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 mr-2"
            size="sm"
          >
            Save Changes
          </Button>
        )}
        <Button
          id="download-html-btn"
          onClick={handleDownloadHTML}
          className="bg-worksheet-purple hover:bg-worksheet-purpleDark mr-2"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" /> Download HTML
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className="bg-worksheet-purple hover:bg-worksheet-purpleDark"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>
    </div>
  </div>
);

export default WorksheetToolbar;
