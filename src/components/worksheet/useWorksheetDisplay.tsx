
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { Worksheet } from '@/types/worksheet';

export const useWorksheetDisplay = (
  worksheet: Worksheet, 
  onDownload?: () => void,
  worksheetId?: string | null
) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
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
  
  const handleDownloadPDF = async () => {
    try {
      // Create current date format YYYY-MM-DD
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
      const filename = `${formattedDate}-${viewModeText}-${editableWorksheet.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      
      const result = await generatePDF('worksheet-content', filename, viewMode === 'teacher', editableWorksheet.title);
      if (result) {
        toast({
          title: "PDF Downloaded",
          description: "Your worksheet has been downloaded successfully."
        });
        if (onDownload) {
          onDownload();
        }
      } else {
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadHTML = async () => {
    try {
      // Create current date format YYYY-MM-DD
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
      const filename = `${formattedDate}-${viewModeText}-${editableWorksheet.title.replace(/\s+/g, '-').toLowerCase()}.html`;
      
      const result = await exportAsHTML('worksheet-content', filename, viewMode === 'teacher', editableWorksheet.title);
      if (result) {
        toast({
          title: "HTML Downloaded",
          description: "Your worksheet HTML has been downloaded successfully."
        });
        if (onDownload) {
          onDownload();
        }
      } else {
        toast({
          title: "HTML Generation Failed",
          description: "There was an error generating your HTML. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('HTML generation error:', error);
      toast({
        title: "HTML Generation Failed",
        description: "There was an error generating your HTML. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return {
    viewMode,
    setViewMode,
    isEditing,
    setIsEditing,
    editableWorksheet,
    setEditableWorksheet,
    handleEdit,
    handleSave,
    handleDownloadPDF,
    handleDownloadHTML
  };
};
