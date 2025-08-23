
import React from 'react';
import { AlertCircle, MessageCircle, BookOpen, Clock, FileText } from 'lucide-react';

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
      </div>
    );
  }

  const worksheetTitle = worksheet.title || worksheetData.title || 'English Worksheet';

  // Render using IDENTICAL structure and classes as WorksheetContent.tsx
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

      {/* Warmup Questions - identical structure to WarmupSection */}
      {worksheetData.warmup_questions && worksheetData.warmup_questions.length > 0 && (
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Warmup Questions</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">5 min</span>
            </div>
          </div>

          <div className="p-6">
            <p className="font-medium mb-4 leading-snug">
              Start the lesson with these conversation questions to engage the student and introduce the topic.
            </p>
            
            <div className="space-y-3">
              {worksheetData.warmup_questions.map((question: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="text-worksheet-purple font-semibold mr-3 mt-1">
                    {index + 1}.
                  </span>
                  <p className="flex-1 leading-relaxed">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grammar Rules - identical structure to GrammarRules */}
      {worksheetData.grammar_rules && (
        <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Grammar Rules</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">10 min</span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-worksheet-purpleDark">
                {worksheetData.grammar_rules.title}
              </h3>
            </div>
            
            {worksheetData.grammar_rules.introduction && (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                <p className="leading-snug text-blue-800">{worksheetData.grammar_rules.introduction}</p>
              </div>
            )}

            {worksheetData.grammar_rules.rules && (
              <div className="space-y-4">
                {worksheetData.grammar_rules.rules.map((rule: any, index: number) => (
                  <div key={index} className="border-l-2 border-worksheet-purple pl-4">
                    <h4 className="font-medium text-worksheet-purpleDark mb-2">
                      {rule.title}
                    </h4>
                    
                    <p className="text-gray-700 mb-3">
                      {rule.explanation}
                    </p>
                    
                    {rule.examples && rule.examples.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-600 mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {rule.examples.map((example: string, exIndex: number) => (
                            <li key={exIndex} className="text-sm text-gray-700">
                              <span>• {example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exercises - identical structure to ExerciseSection */}
      {worksheetData.exercises && worksheetData.exercises.map((exercise: any, index: number) => (
        <div key={index} className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <span className="text-lg">{exercise.icon || '📝'}</span>
              </div>
              <h3 className="text-lg font-semibold">
                {exercise.title || `Exercise ${index + 1}`}
              </h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{exercise.time || 10} min</span>
            </div>
          </div>
          
          <div className="p-5">
            {exercise.instructions && (
              <p className="font-medium mb-4 leading-snug">
                {exercise.instructions}
              </p>
            )}
            
            {exercise.content && (
              <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: exercise.content }} />
              </div>
            )}
            
            {exercise.questions && exercise.questions.map((question: any, qIndex: number) => (
              <div key={qIndex} className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="font-medium">
                  {qIndex + 1}. {question.question || question.text || question}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Vocabulary Sheet - identical structure to VocabularySheet */}
      {worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0 && (
        <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Vocabulary Sheet</h3>
            </div>
          </div>

          <div className="p-5">
            <p className="font-medium mb-4">
              Learn and practice these key vocabulary terms related to the topic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {worksheetData.vocabulary_sheet.map((item: any, index: number) => (
                <div key={index} className="border rounded-md p-4 vocabulary-card">
                  <p className="font-semibold text-worksheet-purple">
                    {item.term || ''}
                  </p>
                  <span className="vocabulary-definition-label">Definition or translation:</span>
                  <span className="text-sm text-gray-500">_____________________</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedWorksheetContent;
