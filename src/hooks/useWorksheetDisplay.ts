
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Worksheet } from "@/types/worksheet";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";

export const useWorksheetDisplay = (worksheet: Worksheet, onDownload?: () => void) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    validateWorksheetStructure();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateWorksheetStructure = () => {
    // Check if worksheet has all the required components
    if (!worksheet) {
      toast.error("Nieprawidłowe dane worksheetu - brak danych");
      return;
    }
    
    // Check for exercises
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast.error("Worksheet nie zawiera żadnych ćwiczeń");
      return;
    }
    
    // Check for reading exercises and word count
    const readingExercise = worksheet.exercises.find(ex => ex.type === 'reading');
    if (readingExercise && readingExercise.content) {
      const wordCount = readingExercise.content.split(/\s+/).filter(Boolean).length;
      if (wordCount < 280) {
        toast.warning(`Tekst do czytania ma tylko ${wordCount} słów (powinno być 280-320)`);
      }
    }
    
    // Sprawdź czy w jakimkolwiek ćwiczeniu nie ma brakujących danych
    worksheet.exercises.forEach((exercise, index) => {
      // Sprawdź braki w pytaniach do dyskusji
      if (exercise.type === 'discussion' && Array.isArray(exercise.questions)) {
        const invalidQuestions = exercise.questions.filter(q => 
          typeof q.text === 'string' && (q.text.includes('Discussion question') || q.text.includes('?')));
        
        if (invalidQuestions.length > 0) {
          toast.warning(`Ćwiczenie ${index + 1}: Niektóre pytania do dyskusji mogą być niekompletne`);
        }
      }
      
      // Sprawdź braki w zdaniach do poprawy
      if (exercise.type === 'error-correction' && Array.isArray(exercise.sentences)) {
        const genericSentences = exercise.sentences.filter(s => 
          typeof s.text === 'string' && s.text.includes('This sentence'));
        
        if (genericSentences.length > 0) {
          toast.warning(`Ćwiczenie ${index + 1}: Niektóre zdania do poprawy mogą być niekompletne`);
        }
      }
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Zmiany zostały zapisane");
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
        toast.success("PDF został pobrany");
        if (onDownload) {
          onDownload();
        }
      } else {
        toast.error("Wystąpił błąd podczas generowania PDF. Spróbuj ponownie.");
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Wystąpił błąd podczas generowania PDF. Spróbuj ponownie.");
    }
  };

  const handleDownloadHTML = async () => {
    try {
      // Create current date format YYYY-MM-DD
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
      const filename = `${formattedDate}-${viewModeText}-${editableWorksheet.title.replace(/\s+/g, '-').toLowerCase()}.html`;
      
      const result = await exportAsHTML('worksheet-content', filename, viewMode, editableWorksheet.title);
      if (result) {
        toast.success("Plik HTML został pobrany");
        if (onDownload) {
          onDownload();
        }
      } else {
        toast.error("Wystąpił błąd podczas generowania pliku HTML. Spróbuj ponownie.");
      }
    } catch (error) {
      console.error('HTML generation error:', error);
      toast.error("Wystąpił błąd podczas generowania pliku HTML. Spróbuj ponownie.");
    }
  };

  return {
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
  };
};
