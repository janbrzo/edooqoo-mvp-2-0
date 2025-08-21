
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

  // If we have valid HTML content, render it directly
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

  // Render using React components with improved styling to match HTML export
  return (
    <div id="shared-worksheet-content" className="worksheet-content">
      {/* Main header section */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          {worksheetData.title || 'English Worksheet'}
        </h1>
        {worksheetData.subtitle && (
          <h2 className="text-xl text-gray-600 mb-4">{worksheetData.subtitle}</h2>
        )}
        {worksheetData.introduction && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed">{worksheetData.introduction}</p>
          </div>
        )}
      </div>

      {/* Warmup Questions */}
      {worksheetData.warmup_questions && worksheetData.warmup_questions.length > 0 && (
        <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">🗣️ Warmup Questions</h3>
            <p className="text-sm text-blue-600">⏱️ 5 minutes</p>
          </div>
          <div className="space-y-3">
            {worksheetData.warmup_questions.map((question: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="font-semibold text-gray-700 mt-1">{index + 1}.</span>
                <p className="text-gray-700 leading-relaxed">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar Rules */}
      {worksheetData.grammar_rules && (
        <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2 text-green-800">📚 Grammar Focus</h3>
            <p className="text-sm text-green-600">⏱️ 10 minutes</p>
          </div>
          
          {worksheetData.grammar_rules.title && (
            <h4 className="text-xl font-semibold mb-3 text-gray-900">
              {worksheetData.grammar_rules.title}
            </h4>
          )}
          
          {worksheetData.grammar_rules.introduction && (
            <p className="mb-4 text-gray-700 leading-relaxed">
              {worksheetData.grammar_rules.introduction}
            </p>
          )}
          
          {worksheetData.grammar_rules.rules && worksheetData.grammar_rules.rules.map((rule: any, index: number) => (
            <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-lg mb-2 text-gray-800">{rule.title}</h5>
              <p className="mb-3 text-gray-700">{rule.explanation}</p>
              {rule.examples && rule.examples.length > 0 && (
                <div>
                  <p className="font-medium mb-2 text-gray-800">Examples:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {rule.examples.map((example: string, exIndex: number) => (
                      <li key={exIndex} className="text-gray-700">{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Exercises */}
      {worksheetData.exercises && worksheetData.exercises.map((exercise: any, index: number) => (
        <div key={index} className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
          <div className="bg-purple-50 p-4 rounded-lg mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-800">
                {exercise.icon || '📝'} {exercise.title || `Exercise ${index + 1}`}
              </h3>
            </div>
            <div className="text-sm text-purple-600">
              ⏱️ {exercise.time || 10} minutes
            </div>
          </div>
          
          {exercise.instructions && (
            <p className="mb-4 text-gray-700 font-medium">{exercise.instructions}</p>
          )}
          
          {exercise.content && (
            <div className="mb-4 text-gray-700 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: exercise.content }} />
            </div>
          )}
          
          {exercise.questions && exercise.questions.map((question: any, qIndex: number) => (
            <div key={qIndex} className="mb-3 p-3 bg-gray-50 rounded">
              <p className="text-gray-800">
                <span className="font-semibold">{qIndex + 1}.</span> {question.question || question.text || question}
              </p>
            </div>
          ))}
        </div>
      ))}

      {/* Vocabulary Sheet */}
      {worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0 && (
        <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
          <div className="bg-indigo-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-indigo-800">📖 Vocabulary</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    Term
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {worksheetData.vocabulary_sheet.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">
                      {item.term || ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">
                      {item.meaning || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedWorksheetContent;
