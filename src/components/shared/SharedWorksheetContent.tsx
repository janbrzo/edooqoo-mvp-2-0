
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

  // Try to parse worksheet data from JSON sources
  let worksheetData = null;
  let dataSource = '';

  // First try html_content (priority source)
  if (worksheet.html_content && worksheet.html_content.trim()) {
    try {
      worksheetData = JSON.parse(worksheet.html_content);
      dataSource = 'html_content';
      console.log('✅ Parsed worksheet data from html_content:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing html_content as JSON:', error);
    }
  }

  // Fallback to ai_response if html_content didn't work
  if (!worksheetData && worksheet.ai_response && worksheet.ai_response.trim()) {
    try {
      worksheetData = JSON.parse(worksheet.ai_response);
      dataSource = 'ai_response';
      console.log('✅ Parsed worksheet data from ai_response:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing ai_response as JSON:', error);
    }
  }

  // If no valid data found, show error
  if (!worksheetData) {
    console.error('❌ No valid worksheet data found');
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">
          No valid JSON data found in html_content or ai_response
        </p>
      </div>
    );
  }

  console.log(`🎨 Rendering React components with data from ${dataSource}:`, worksheetData);

  // Create safe worksheet data with fallbacks
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

  // Mock functions for read-only mode
  const setEditableWorksheet = () => {
    console.log('🚫 setEditableWorksheet called in read-only mode - ignoring');
  };

  const mockInputParams = {
    lessonTopic: 'English Lesson',
    englishLevel: 'B1',
    lessonGoal: 'Practice English skills'
  };

  // Safe component wrapper with error boundary
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

  // Main render - styled to match HTML export exactly
  return (
    <div className="container worksheet-content" id="shared-worksheet-content">
      <div className="page-number"></div>
      
      {/* Main header - matching HTML export structure */}
      <SafeComponent name="Header">
        <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
          <div className="absolute top-4 right-4 hidden sm:block">
            <span className="text-sm text-gray-500">
              Shared worksheet from edooqoo.com
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
            {safeWorksheetData.title}
          </h1>
          
          <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
            {safeWorksheetData.subtitle}
          </h2>

          {safeWorksheetData.introduction && (
            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
              <p className="leading-snug">{safeWorksheetData.introduction}</p>
            </div>
          )}
        </div>
      </SafeComponent>

      {/* Warmup Section - only if warmup questions exist */}
      {safeWorksheetData.warmup_questions && safeWorksheetData.warmup_questions.length > 0 && (
        <SafeComponent name="WarmupSection">
          <WarmupSection
            inputParams={mockInputParams}
            isEditing={false}
            editableWorksheet={safeWorksheetData}
            setEditableWorksheet={setEditableWorksheet}
            isDownloadUnlocked={true}
          />
        </SafeComponent>
      )}

      {/* Grammar Rules */}
      {safeWorksheetData.grammar_rules && (
        <SafeComponent name="GrammarRules">
          <GrammarRules
            grammarRules={safeWorksheetData.grammar_rules}
            isEditing={false}
            editableWorksheet={safeWorksheetData}
            setEditableWorksheet={setEditableWorksheet}
            inputParams={mockInputParams}
          />
        </SafeComponent>
      )}

      {/* Exercises */}
      {safeWorksheetData.exercises && safeWorksheetData.exercises.map((exercise: any, index: number) => (
        <SafeComponent key={index} name={`Exercise-${index}`}>
          <ExerciseSection
            exercise={exercise}
            index={index}
            isEditing={false}
            viewMode="student"
            editableWorksheet={safeWorksheetData}
            setEditableWorksheet={setEditableWorksheet}
          />
        </SafeComponent>
      ))}

      {/* Vocabulary Sheet */}
      {safeWorksheetData.vocabulary_sheet && safeWorksheetData.vocabulary_sheet.length > 0 && (
        <SafeComponent name="VocabularySheet">
          <VocabularySheet
            vocabularySheet={safeWorksheetData.vocabulary_sheet}
            isEditing={false}
            viewMode="student"
            editableWorksheet={safeWorksheetData}
            setEditableWorksheet={setEditableWorksheet}
          />
        </SafeComponent>
      )}

      {/* Teacher Notes */}
      <SafeComponent name="TeacherNotes">
        <TeacherNotes />
      </SafeComponent>
    </div>
  );
};

export default SharedWorksheetContent;
