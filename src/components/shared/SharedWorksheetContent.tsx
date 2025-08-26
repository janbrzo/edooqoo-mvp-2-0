
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
  console.log('🔍 SharedWorksheetContent received worksheet:', worksheet);

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

  console.log('🔍 Checking html_content:', worksheet.html_content?.substring(0, 100));
  console.log('🔍 Checking ai_response:', worksheet.ai_response?.substring(0, 100));

  // Check html_content first
  if (worksheet.html_content && worksheet.html_content.trim()) {
    if (isHtmlContent(worksheet.html_content)) {
      console.log('✅ HTML content detected, will use dangerouslySetInnerHTML');
      shouldUseHtml = true;
    } else if (isJsonContent(worksheet.html_content)) {
      try {
        worksheetData = JSON.parse(worksheet.html_content);
        console.log('✅ Parsed worksheet data from html_content (JSON):', worksheetData);
      } catch (error) {
        console.error('❌ Error parsing JSON from html_content:', error);
      }
    }
  }

  // Fallback to ai_response if html_content didn't work
  if (!worksheetData && !shouldUseHtml && worksheet.ai_response) {
    try {
      worksheetData = JSON.parse(worksheet.ai_response);
      console.log('✅ Parsed worksheet data from ai_response:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing ai_response:', error);
    }
  }

  // If we have valid HTML content, render it directly
  if (shouldUseHtml) {
    console.log('🎨 Rendering HTML content directly');
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
    console.error('❌ No valid worksheet data found');
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">Debug info: html_content present: {!!worksheet.html_content}, ai_response present: {!!worksheet.ai_response}</p>
      </div>
    );
  }

  console.log('🎨 Rendering React components with worksheetData:', worksheetData);

  // DEFENSIVE: Ensure all required data exists with fallbacks
  const safeWorksheetData = {
    title: worksheetData.title || worksheet.title || 'English Worksheet',
    subtitle: worksheetData.subtitle || '',
    introduction: worksheetData.introduction || '',
    warmup_questions: Array.isArray(worksheetData.warmup_questions) ? worksheetData.warmup_questions : [],
    grammar_rules: worksheetData.grammar_rules || null,
    exercises: Array.isArray(worksheetData.exercises) ? worksheetData.exercises : [],
    vocabulary_sheet: Array.isArray(worksheetData.vocabulary_sheet) ? worksheetData.vocabulary_sheet : []
  };

  console.log('🛡️ Safe worksheet data:', safeWorksheetData);

  // Convert to editableWorksheet format expected by components
  const editableWorksheet = {
    title: safeWorksheetData.title,
    subtitle: safeWorksheetData.subtitle,
    introduction: safeWorksheetData.introduction,
    warmup_questions: safeWorksheetData.warmup_questions,
    grammar_rules: safeWorksheetData.grammar_rules,
    exercises: safeWorksheetData.exercises,
    vocabulary_sheet: safeWorksheetData.vocabulary_sheet
  };

  // Mock setEditableWorksheet function for read-only mode (does nothing)
  const setEditableWorksheet = () => {
    console.log('🚫 setEditableWorksheet called in read-only mode - ignoring');
  };

  // Create mock inputParams for WarmupSection
  const mockInputParams = {
    lessonTopic: 'English Lesson',
    englishLevel: 'B1',
    lessonGoal: 'Practice English skills'
  };

  // Safe component wrapper
  const SafeComponent: React.FC<{ children: React.ReactNode; name: string }> = ({ children, name }) => {
    try {
      return <>{children}</>;
    } catch (error) {
      console.error(`❌ Error in ${name} component:`, error);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">Error loading {name} section</p>
        </div>
      );
    }
  };

  // Render using the same components as WorksheetContent.tsx but with error boundaries
  return (
    <div className="w-full max-w-none">
      <div className="worksheet-content mb-8" id="shared-worksheet-content">
        <div className="page-number"></div>
        
        {/* Main header */}
        <SafeComponent name="Header">
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
        </SafeComponent>

        {/* Warmup Section - only render if warmup questions exist */}
        {editableWorksheet.warmup_questions && editableWorksheet.warmup_questions.length > 0 && (
          <SafeComponent name="WarmupSection">
            <WarmupSection
              inputParams={mockInputParams}
              isEditing={false}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
              isDownloadUnlocked={true}
            />
          </SafeComponent>
        )}

        {/* Grammar Rules */}
        {editableWorksheet.grammar_rules && (
          <SafeComponent name="GrammarRules">
            <GrammarRules
              grammarRules={editableWorksheet.grammar_rules}
              isEditing={false}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
              inputParams={mockInputParams}
            />
          </SafeComponent>
        )}

        {/* Exercises */}
        {editableWorksheet.exercises && editableWorksheet.exercises.map((exercise: any, index: number) => (
          <SafeComponent key={index} name={`Exercise-${index}`}>
            <ExerciseSection
              exercise={exercise}
              index={index}
              isEditing={false}
              viewMode="student"
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          </SafeComponent>
        ))}

        {/* Vocabulary Sheet */}
        {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
          <SafeComponent name="VocabularySheet">
            <VocabularySheet
              vocabularySheet={editableWorksheet.vocabulary_sheet}
              isEditing={false}
              viewMode="student"
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          </SafeComponent>
        )}

        {/* Teacher Notes */}
        <SafeComponent name="TeacherNotes">
          <TeacherNotes />
        </SafeComponent>
      </div>
    </div>
  );
};

export default SharedWorksheetContent;
