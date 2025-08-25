
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
  console.log('SharedWorksheetContent: Starting render with worksheet:', {
    hasHtmlContent: !!worksheet.html_content,
    hasAiResponse: !!worksheet.ai_response,
    title: worksheet.title
  });

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

  // Try to get valid worksheet data with comprehensive error handling
  let worksheetData = null;
  let shouldUseHtml = false;
  let renderError = null;

  try {
    // Check html_content first
    if (worksheet.html_content && worksheet.html_content.trim()) {
      if (isHtmlContent(worksheet.html_content)) {
        console.log('SharedWorksheetContent: Using HTML content');
        shouldUseHtml = true;
      } else {
        try {
          worksheetData = JSON.parse(worksheet.html_content);
          console.log('SharedWorksheetContent: Parsed JSON from html_content:', worksheetData);
        } catch (error) {
          console.error('Error parsing JSON from html_content:', error);
        }
      }
    }

    // Fallback to ai_response if html_content didn't work
    if (!worksheetData && !shouldUseHtml && worksheet.ai_response) {
      try {
        worksheetData = JSON.parse(worksheet.ai_response);
        console.log('SharedWorksheetContent: Parsed JSON from ai_response:', worksheetData);
      } catch (error) {
        console.error('Error parsing ai_response:', error);
      }
    }
  } catch (error) {
    console.error('Error in data processing:', error);
    renderError = error;
  }

  // If we have valid HTML content, render it directly (safest option)
  if (shouldUseHtml) {
    console.log('SharedWorksheetContent: Rendering HTML content');
    return (
      <div 
        id="shared-worksheet-content"
        dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
        className="worksheet-content w-full max-w-none"
      />
    );
  }

  // If no valid data found, show error
  if (!worksheetData) {
    console.error('SharedWorksheetContent: No valid worksheet data found');
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        {renderError && (
          <p className="text-sm text-red-500 mt-2">Error: {renderError.message}</p>
        )}
      </div>
    );
  }

  // Safely convert worksheetData to editableWorksheet format with validation
  let editableWorksheet;
  try {
    editableWorksheet = {
      title: worksheetData.title || 'Untitled Worksheet',
      subtitle: worksheetData.subtitle || '',
      introduction: worksheetData.introduction || '',
      warmup_questions: Array.isArray(worksheetData.warmup_questions) ? worksheetData.warmup_questions : [],
      grammar_rules: worksheetData.grammar_rules || null,
      exercises: Array.isArray(worksheetData.exercises) ? worksheetData.exercises : [],
      vocabulary_sheet: Array.isArray(worksheetData.vocabulary_sheet) ? worksheetData.vocabulary_sheet : []
    };
    console.log('SharedWorksheetContent: Created editableWorksheet:', editableWorksheet);
  } catch (error) {
    console.error('Error creating editableWorksheet:', error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Error processing worksheet data</p>
      </div>
    );
  }

  // Mock setEditableWorksheet function for read-only mode
  const setEditableWorksheet = () => {
    // Do nothing in shared mode
  };

  // Create mock inputParams for components that need it
  const mockInputParams = {
    lessonTopic: 'English Lesson',
    englishLevel: 'B1',
    lessonGoal: 'Practice English skills'
  };

  // Safe component render function
  const SafeComponent = ({ children, fallback = null }: { children: () => React.ReactNode, fallback?: React.ReactNode }) => {
    try {
      return <>{children()}</>;
    } catch (error) {
      console.error('Component render error:', error);
      return fallback;
    }
  };

  // Render using the same components as WorksheetContent.tsx but with error boundaries
  return (
    <div className="w-full">
      <div className="worksheet-content mb-8 max-w-none" id="shared-worksheet-content">
        <div className="page-number"></div>
        
        {/* Main header */}
        <SafeComponent fallback={<div>Error loading header</div>}>
          {() => (
            <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
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
          )}
        </SafeComponent>

        {/* Warmup Section */}
        {editableWorksheet.warmup_questions && editableWorksheet.warmup_questions.length > 0 && (
          <SafeComponent fallback={<div>Error loading warmup section</div>}>
            {() => (
              <WarmupSection
                inputParams={mockInputParams}
                isEditing={false}
                editableWorksheet={editableWorksheet}
                setEditableWorksheet={setEditableWorksheet}
                isDownloadUnlocked={true}
              />
            )}
          </SafeComponent>
        )}

        {/* Grammar Rules */}
        {editableWorksheet.grammar_rules && (
          <SafeComponent fallback={<div>Error loading grammar rules</div>}>
            {() => (
              <GrammarRules
                grammarRules={editableWorksheet.grammar_rules}
                isEditing={false}
                editableWorksheet={editableWorksheet}
                setEditableWorksheet={setEditableWorksheet}
                inputParams={mockInputParams}
              />
            )}
          </SafeComponent>
        )}

        {/* Exercises */}
        {editableWorksheet.exercises && editableWorksheet.exercises.map((exercise: any, index: number) => (
          <SafeComponent key={index} fallback={<div>Error loading exercise {index + 1}</div>}>
            {() => (
              <ExerciseSection
                exercise={exercise}
                index={index}
                isEditing={false}
                viewMode="student"
                editableWorksheet={editableWorksheet}
                setEditableWorksheet={setEditableWorksheet}
              />
            )}
          </SafeComponent>
        ))}

        {/* Vocabulary Sheet */}
        {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
          <SafeComponent fallback={<div>Error loading vocabulary sheet</div>}>
            {() => (
              <VocabularySheet
                vocabularySheet={editableWorksheet.vocabulary_sheet}
                isEditing={false}
                viewMode="student"
                editableWorksheet={editableWorksheet}
                setEditableWorksheet={setEditableWorksheet}
              />
            )}
          </SafeComponent>
        )}

        {/* Teacher Notes */}
        <SafeComponent fallback={null}>
          {() => <TeacherNotes />}
        </SafeComponent>
      </div>
    </div>
  );
};

export default SharedWorksheetContent;
