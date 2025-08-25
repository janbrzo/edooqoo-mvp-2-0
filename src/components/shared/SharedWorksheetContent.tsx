
import React from 'react';
import { AlertCircle } from 'lucide-react';
import ExerciseSection from '../worksheet/ExerciseSection';
import VocabularySheet from '../worksheet/VocabularySheet';
import TeacherNotes from '../worksheet/TeacherNotes';
import GrammarRules from '../worksheet/GrammarRules';
import WarmupSection from '../worksheet/WarmupSection';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
  };
}

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ worksheet }) => {
  // Helper function to detect if content is JSON
  const isJsonContent = (content: string): boolean => {
    if (!content || !content.trim()) return false;
    const trimmed = content.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  };

  // Helper function to detect if content is HTML
  const isHtmlContent = (content: string): boolean => {
    if (!content || !content.trim()) return false;
    const trimmed = content.trim();
    return trimmed.includes('<!DOCTYPE html') || 
           trimmed.includes('<html') || 
           trimmed.includes('<div') ||
           trimmed.includes('<p>') ||
           trimmed.includes('<h1>');
  };

  // Try to get valid worksheet data
  let worksheetData = null;
  let shouldUseHtml = false;

  // Check html_content first
  if (worksheet.html_content && worksheet.html_content.trim()) {
    if (isHtmlContent(worksheet.html_content)) {
      // Valid HTML - use dangerouslySetInnerHTML
      shouldUseHtml = true;
    } else if (isJsonContent(worksheet.html_content)) {
      // HTML content contains JSON - parse it
      try {
        worksheetData = JSON.parse(worksheet.html_content);
        console.log('Parsed worksheet data from html_content (JSON):', worksheetData);
      } catch (error) {
        console.error('Error parsing JSON from html_content:', error);
      }
    }
  }

  // Fallback to ai_response if html_content didn't work
  if (!worksheetData && !shouldUseHtml && worksheet.ai_response) {
    try {
      worksheetData = JSON.parse(worksheet.ai_response);
      console.log('Parsed worksheet data from ai_response:', worksheetData);
    } catch (error) {
      console.error('Error parsing ai_response:', error);
    }
  }

  // If we have valid HTML content, render it directly (this would be the ideal case)
  if (shouldUseHtml) {
    return (
      <div 
        id="shared-worksheet-content"
        dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
        className="worksheet-content w-full"
      />
    );
  }

  // If no valid data found, show error
  if (!worksheetData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
      </div>
    );
  }

  // Convert worksheetData to editableWorksheet format expected by components
  const editableWorksheet = {
    title: worksheetData.title || 'Untitled Worksheet',
    subtitle: worksheetData.subtitle || '',
    introduction: worksheetData.introduction || '',
    warmup_questions: worksheetData.warmup_questions || [],
    grammar_rules: worksheetData.grammar_rules || null,
    exercises: worksheetData.exercises || [],
    vocabulary_sheet: worksheetData.vocabulary_sheet || []
  };

  // Mock setEditableWorksheet function for read-only mode
  const setEditableWorksheet = () => {
    // Do nothing in shared mode
  };

  // Create mock inputParams for WarmupSection
  const mockInputParams = {
    lessonTopic: 'English Lesson',
    englishLevel: 'B1',
    lessonGoal: 'Practice English skills'
  };

  // Render using the exact same components as WorksheetContent.tsx
  return (
    <div className="w-full">
      {/* Use full width container like in HTML export */}
      <div className="worksheet-content mb-8" id="shared-worksheet-content">
        <div className="page-number"></div>
        
        {/* Main header - identical to WorksheetContent.tsx */}
        <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
          {/* Simple edooqoo link - positioned in top right */}
          <div className="absolute top-4 right-4 hidden sm:block">
            <span className="text-sm text-gray-500">
              Shared worksheet from edooqoo.com
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
            {editableWorksheet.title}
          </h1>
          
          <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
            {editableWorksheet.subtitle}
          </h2>

          {editableWorksheet.introduction && (
            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
              <p className="leading-snug">{editableWorksheet.introduction}</p>
            </div>
          )}
        </div>

        {/* Warmup Section - using original component */}
        {editableWorksheet.warmup_questions && editableWorksheet.warmup_questions.length > 0 && (
          <WarmupSection
            inputParams={mockInputParams}
            isEditing={false}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            isDownloadUnlocked={true}
          />
        )}

        {/* Grammar Rules - using original component */}
        {editableWorksheet.grammar_rules && (
          <GrammarRules
            grammarRules={editableWorksheet.grammar_rules}
            isEditing={false}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            inputParams={mockInputParams}
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

        {/* Vocabulary Sheet - using original component */}
        {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
          <VocabularySheet
            vocabularySheet={editableWorksheet.vocabulary_sheet}
            isEditing={false}
            viewMode="student"
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
          />
        )}

        {/* Teacher Notes - using original component */}
        <TeacherNotes />
      </div>
    </div>
  );
};

export default SharedWorksheetContent;
