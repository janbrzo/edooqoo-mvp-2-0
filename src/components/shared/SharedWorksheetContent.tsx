
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
  };
}

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ worksheet }) => {
  console.log('🔍 SharedWorksheetContent: Component started rendering');
  console.log('🔍 SharedWorksheetContent: Worksheet data:', {
    hasHtmlContent: !!worksheet.html_content,
    htmlContentLength: worksheet.html_content?.length || 0,
    hasAiResponse: !!worksheet.ai_response,
    aiResponseLength: worksheet.ai_response?.length || 0,
    title: worksheet.title
  });

  try {
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

    // Check if we should use HTML content directly (safest option)
    if (worksheet.html_content && worksheet.html_content.trim()) {
      if (isHtmlContent(worksheet.html_content)) {
        console.log('🔍 SharedWorksheetContent: Using HTML content (safest option)');
        return (
          <div 
            id="shared-worksheet-content"
            dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
            className="worksheet-content w-full max-w-none"
          />
        );
      }
    }

    // Try to parse AI response as JSON
    let worksheetData = null;
    if (worksheet.ai_response) {
      try {
        worksheetData = JSON.parse(worksheet.ai_response);
        console.log('🔍 SharedWorksheetContent: Successfully parsed AI response as JSON');
      } catch (error) {
        console.error('🔍 SharedWorksheetContent: Error parsing AI response as JSON:', error);
      }
    }

    // If we have JSON data, try to render a simple version
    if (worksheetData) {
      console.log('🔍 SharedWorksheetContent: Rendering simple JSON version');
      return (
        <div className="w-full max-w-none">
          <div className="worksheet-content" id="shared-worksheet-content">
            {/* Title */}
            <h1 className="text-3xl font-bold mb-2 text-purple-800">
              {worksheetData.title || 'English Worksheet'}
            </h1>
            
            {/* Subtitle */}
            {worksheetData.subtitle && (
              <h2 className="text-xl text-purple-600 mb-4">
                {worksheetData.subtitle}
              </h2>
            )}

            {/* Introduction */}
            {worksheetData.introduction && (
              <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
                <p>{worksheetData.introduction}</p>
              </div>
            )}

            {/* Warmup Questions */}
            {worksheetData.warmup_questions && worksheetData.warmup_questions.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg bg-purple-50">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">Warmup Questions</h3>
                <div className="space-y-2">
                  {worksheetData.warmup_questions.map((question: any, index: number) => {
                    const questionText = typeof question === 'string' ? question : question.text || `Question ${index + 1}`;
                    return (
                      <div key={index} className="flex">
                        <span className="text-purple-600 font-semibold mr-3">{index + 1}.</span>
                        <span>{questionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grammar Rules */}
            {worksheetData.grammar_rules && (
              <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">
                  {worksheetData.grammar_rules.title || 'Grammar Rules'}
                </h3>
                {worksheetData.grammar_rules.introduction && (
                  <p className="mb-4 text-blue-700">{worksheetData.grammar_rules.introduction}</p>
                )}
                {worksheetData.grammar_rules.rules && worksheetData.grammar_rules.rules.map((rule: any, index: number) => (
                  <div key={index} className="mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">{rule.title}</h4>
                    <p className="text-gray-700 mb-2">{rule.explanation}</p>
                    {rule.examples && rule.examples.length > 0 && (
                      <div className="pl-4">
                        <p className="text-sm font-medium mb-1">Examples:</p>
                        <ul className="text-sm text-gray-600">
                          {rule.examples.map((example: string, exIndex: number) => (
                            <li key={exIndex}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Exercises */}
            {worksheetData.exercises && worksheetData.exercises.length > 0 && (
              <div className="space-y-4">
                {worksheetData.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-purple-600 text-white p-3">
                      <h3 className="text-lg font-semibold">{exercise.title || `Exercise ${index + 1}`}</h3>
                    </div>
                    <div className="p-4">
                      {exercise.instructions && (
                        <p className="mb-3 font-medium">{exercise.instructions}</p>
                      )}
                      {exercise.content && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <pre className="whitespace-pre-wrap text-sm">{exercise.content}</pre>
                        </div>
                      )}
                      
                      {/* Exercise Questions */}
                      {exercise.questions && exercise.questions.length > 0 && (
                        <div className="space-y-2">
                          {exercise.questions.map((question: any, qIndex: number) => (
                            <div key={qIndex}>
                              <p className="font-medium">
                                {qIndex + 1}. {typeof question === 'string' ? question : question.text}
                              </p>
                              {question.answer && (
                                <p className="text-green-600 text-sm italic ml-4">
                                  ({question.answer})
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vocabulary Sheet */}
            {worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0 && (
              <div className="mt-6 p-4 border rounded-lg bg-green-50">
                <h3 className="text-lg font-semibold mb-3 text-green-800">Vocabulary Sheet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {worksheetData.vocabulary_sheet.map((item: any, index: number) => (
                    <div key={index} className="border rounded-md p-3 bg-white">
                      <p className="font-semibold text-purple-600">{item.term}</p>
                      <p className="text-sm text-gray-500 mt-1">_____________________</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Final fallback: render raw HTML if available
    if (worksheet.html_content && worksheet.html_content.trim()) {
      console.log('🔍 SharedWorksheetContent: Using HTML content as final fallback');
      return (
        <div 
          id="shared-worksheet-content"
          dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
          className="worksheet-content w-full max-w-none"
        />
      );
    }

    // No valid content found
    console.error('🔍 SharedWorksheetContent: No valid content found to render');
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">No valid data found in worksheet</p>
      </div>
    );

  } catch (error) {
    console.error('🔍 SharedWorksheetContent: Critical error in rendering:', error);
    
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Content Display Error</h3>
        <p className="text-gray-600 mb-4">There was an error displaying the worksheet content.</p>
        <details className="text-left bg-gray-50 p-4 rounded max-w-md mx-auto">
          <summary className="cursor-pointer font-medium">Error Details</summary>
          <pre className="text-xs mt-2 text-red-600 whitespace-pre-wrap">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </details>
        
        {/* Emergency fallback: raw HTML */}
        {worksheet.html_content && (
          <div className="mt-6">
            <button 
              onClick={() => {
                const container = document.getElementById('emergency-fallback');
                if (container) {
                  container.innerHTML = worksheet.html_content;
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Emergency Fallback
            </button>
            <div id="emergency-fallback" className="mt-4 text-left"></div>
          </div>
        )}
      </div>
    );
  }
};

export default SharedWorksheetContent;
