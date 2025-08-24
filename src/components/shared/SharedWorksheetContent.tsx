
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import ExerciseSection from '@/components/worksheet/ExerciseSection';
import WarmupSection from '@/components/worksheet/WarmupSection';
import GrammarRules from '@/components/worksheet/GrammarRules';
import VocabularySheet from '@/components/worksheet/VocabularySheet';
import TeacherNotes from '@/components/worksheet/TeacherNotes';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
  };
}

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ worksheet }) => {
  const [editableWorksheet, setEditableWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<any>(null);

  useEffect(() => {
    // Try to parse worksheet data from ai_response or html_content
    let worksheetData = null;
    
    // First try ai_response (should be JSON)
    if (worksheet.ai_response) {
      try {
        worksheetData = JSON.parse(worksheet.ai_response);
        console.log('📄 Parsed worksheet data from ai_response:', worksheetData);
      } catch (error) {
        console.error('Error parsing ai_response:', error);
      }
    }
    
    // Fallback to html_content if it contains JSON
    if (!worksheetData && worksheet.html_content) {
      try {
        const trimmed = worksheet.html_content.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          worksheetData = JSON.parse(worksheet.html_content);
          console.log('📄 Parsed worksheet data from html_content:', worksheetData);
        }
      } catch (error) {
        console.error('Error parsing html_content:', error);
      }
    }

    if (worksheetData) {
      // Convert to editableWorksheet format expected by components
      const convertedWorksheet = {
        title: worksheetData.title || worksheet.title || 'English Worksheet',
        subtitle: worksheetData.subtitle || '',
        introduction: worksheetData.introduction || '',
        exercises: worksheetData.exercises || [],
        vocabulary_sheet: worksheetData.vocabulary_sheet || [],
        warmup_questions: worksheetData.warmup_questions || [],
        grammar_rules: worksheetData.grammar_rules || null
      };

      // Create mock inputParams for WarmupSection compatibility
      const mockInputParams = {
        lessonTopic: worksheetData.topic || 'General English',
        englishLevel: worksheetData.level || 'B1',
        lessonTime: '60min',
        lessonGoal: worksheetData.goal || 'Practice English skills'
      };

      setEditableWorksheet(convertedWorksheet);
      setInputParams(mockInputParams);
      console.log('✅ Converted worksheet for component rendering');
    }
  }, [worksheet]);

  // If we have valid HTML content, render it directly
  if (worksheet.html_content && worksheet.html_content.trim()) {
    const trimmed = worksheet.html_content.trim();
    const isHtmlContent = trimmed.includes('<!DOCTYPE html') || 
                         trimmed.includes('<html') || 
                         trimmed.includes('<div') ||
                         trimmed.includes('<p>') ||
                         trimmed.includes('<h1>');
    
    if (isHtmlContent) {
      return (
        <div 
          id="shared-worksheet-content"
          dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
          className="worksheet-content"
        />
      );
    }
  }

  // If no valid data found, show error
  if (!editableWorksheet) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">
          Debug info: ai_response length: {worksheet.ai_response?.length || 0}, 
          html_content length: {worksheet.html_content?.length || 0}
        </p>
      </div>
    );
  }

  // Render using the EXACT SAME components as WorksheetContent.tsx
  return (
    <div className="worksheet-content mb-8" id="shared-worksheet-content">
      <div className="page-number"></div>
      
      {/* Main header - identical structure to WorksheetContent.tsx */}
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        <div className="absolute top-4 right-4 hidden sm:block">
          <span className="text-sm text-gray-500">
            Shared worksheet from edooqoo.com
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
          {editableWorksheet.title}
        </h1>
        
        {editableWorksheet.subtitle && (
          <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
            {editableWorksheet.subtitle}
          </h2>
        )}

        {editableWorksheet.introduction && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
            <p className="leading-snug">{editableWorksheet.introduction}</p>
          </div>
        )}
      </div>

      {/* Warmup Questions - using original WarmupSection component */}
      {editableWorksheet.warmup_questions && editableWorksheet.warmup_questions.length > 0 && (
        <WarmupSection
          inputParams={inputParams}
          isEditing={false}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
          isDownloadUnlocked={true}
        />
      )}

      {/* Grammar Rules - using original GrammarRules component */}
      {editableWorksheet.grammar_rules && (
        <GrammarRules
          grammarRules={editableWorksheet.grammar_rules}
          isEditing={false}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
          inputParams={inputParams}
        />
      )}

      {/* Exercises - using original ExerciseSection component */}
      {editableWorksheet.exercises && editableWorksheet.exercises.map((exercise: any, index: number) => (
        <ExerciseSection
          key={index}
          exercise={exercise}
          index={index}
          isEditing={false}
          viewMode="student"
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
        />
      ))}

      {/* Vocabulary Sheet - using original VocabularySheet component */}
      {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
        <VocabularySheet
          vocabularySheet={editableWorksheet.vocabulary_sheet}
          isEditing={false}
          viewMode="student"
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
        />
      )}

      {/* Teacher Notes - using original TeacherNotes component */}
      <TeacherNotes />
    </div>
  );
};

export default SharedWorksheetContent;
