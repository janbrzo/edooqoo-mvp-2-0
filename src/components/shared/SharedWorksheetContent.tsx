
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

  try {
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
  } catch (error) {
    console.error('Error in SharedWorksheetContent:', error);
  }

  // If we have valid HTML content, render it directly (this would be the ideal case)
  if (shouldUseHtml) {
    return (
      <div 
        id="shared-worksheet-content"
        dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
        className="worksheet-content"
      />
    );
  }

  // If no valid data found, show error
  if (!worksheetData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">
          Debug info: html_content={worksheet.html_content ? 'present' : 'missing'}, 
          ai_response={worksheet.ai_response ? 'present' : 'missing'}
        </p>
      </div>
    );
  }

  // Validate worksheetData structure
  if (!worksheetData || typeof worksheetData !== 'object') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Invalid worksheet data structure</p>
      </div>
    );
  }

  // Mock functions for read-only shared worksheet
  const mockSetEditableWorksheet = () => {};
  const viewMode = 'student';
  const isEditing = false;
  const isDownloadUnlocked = true;

  // Create input params from worksheet data for WarmupSection
  const inputParams = worksheetData.input_params || {
    lessonTopic: worksheetData.topic || 'General English',
    englishLevel: worksheetData.level || 'B1',
    lessonTime: worksheetData.lesson_time || '60min'
  };

  // Safe rendering with try-catch for each section
  const renderSection = (sectionName: string, renderFn: () => React.ReactNode) => {
    try {
      return renderFn();
    } catch (error) {
      console.error(`Error rendering ${sectionName}:`, error);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm">Error rendering {sectionName}</p>
        </div>
      );
    }
  };

  // Render using IDENTICAL components and structure as WorksheetContent.tsx
  return (
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
          {worksheetData.title || 'Untitled Worksheet'}
        </h1>
        
        <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
          {worksheetData.subtitle || ''}
        </h2>

        {worksheetData.introduction && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
            <p className="leading-snug">{worksheetData.introduction}</p>
          </div>
        )}
      </div>

      {/* Warmup Section - safely rendered */}
      {(worksheetData.warmup_questions || inputParams) && renderSection('WarmupSection', () => (
        <WarmupSection
          inputParams={inputParams}
          isEditing={isEditing}
          editableWorksheet={worksheetData}
          setEditableWorksheet={mockSetEditableWorksheet}
          isDownloadUnlocked={isDownloadUnlocked}
        />
      ))}

      {/* Grammar Rules - safely rendered */}
      {worksheetData.grammar_rules && renderSection('GrammarRules', () => (
        <GrammarRules
          grammarRules={worksheetData.grammar_rules}
          isEditing={isEditing}
          editableWorksheet={worksheetData}
          setEditableWorksheet={mockSetEditableWorksheet}
          inputParams={inputParams}
        />
      ))}

      {/* Exercises - safely rendered */}
      {worksheetData.exercises && Array.isArray(worksheetData.exercises) && 
        worksheetData.exercises.map((exercise: any, index: number) => (
          renderSection(`Exercise-${index}`, () => (
            <ExerciseSection
              key={index}
              exercise={exercise}
              index={index}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={worksheetData}
              setEditableWorksheet={mockSetEditableWorksheet}
            />
          ))
        ))
      }

      {/* Vocabulary Sheet - safely rendered */}
      {worksheetData.vocabulary_sheet && 
       Array.isArray(worksheetData.vocabulary_sheet) && 
       worksheetData.vocabulary_sheet.length > 0 && renderSection('VocabularySheet', () => (
        <VocabularySheet
          vocabularySheet={worksheetData.vocabulary_sheet}
          isEditing={isEditing}
          viewMode={viewMode}
          editableWorksheet={worksheetData}
          setEditableWorksheet={mockSetEditableWorksheet}
        />
      ))}

      {/* Teacher Notes - safely rendered */}
      {renderSection('TeacherNotes', () => (
        <TeacherNotes />
      ))}
    </div>
  );
};

export default SharedWorksheetContent;
