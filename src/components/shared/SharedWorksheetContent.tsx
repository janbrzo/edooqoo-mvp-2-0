
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

  const worksheetTitle = worksheet.title || worksheetData.title || 'English Worksheet';

  // Render with identical styling to HTML export
  return (
    <div id="shared-worksheet-content">
      {/* Add comprehensive styling that matches htmlExport.ts */}
      <style>{`
        /* Complete CSS styles matching htmlExport.ts */
        .worksheet-container {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        
        .worksheet-inner-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .version-header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #3d348b;
          margin-bottom: 20px;
          color: #3d348b;
          font-size: 18px;
          font-weight: bold;
        }
        
        /* Main header section */
        .main-header {
          text-center: true;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #d1d5db;
        }
        
        .main-title {
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #111827;
        }
        
        .main-subtitle {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .intro-box {
          background-color: #fef7cd;
          border-left: 4px solid #fbbf24;
          padding: 16px;
          border-radius: 6px;
          max-width: 1024px;
          margin: 0 auto;
        }
        
        .intro-text {
          color: #374151;
          line-height: 1.625;
        }
        
        /* Section styling */
        .section-container {
          margin-bottom: 32px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .section-header {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .section-header.warmup {
          background-color: #dbeafe;
        }
        
        .section-header.grammar {
          background-color: #d1fae5;
        }
        
        .section-header.exercise {
          background-color: #e0e7ff;
        }
        
        .section-header.vocabulary {
          background-color: #e0e7ff;
        }
        
        .section-title {
          font-size: 1.125rem;
          line-height: 1.75rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .section-title.warmup {
          color: #1e40af;
        }
        
        .section-title.grammar {
          color: #065f46;
        }
        
        .section-title.exercise {
          color: #3730a3;
        }
        
        .section-title.vocabulary {
          color: #3730a3;
        }
        
        .section-time {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        .section-time.warmup {
          color: #2563eb;
        }
        
        .section-time.grammar {
          color: #059669;
        }
        
        .section-time.exercise {
          color: #5b21b6;
        }
        
        .section-time.vocabulary {
          color: #5b21b6;
        }
        
        /* Questions and content */
        .question-list {
          space-y: 12px;
        }
        
        .question-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .question-number {
          font-weight: 600;
          color: #374151;
          margin-top: 4px;
        }
        
        .question-text {
          color: #374151;
          line-height: 1.625;
        }
        
        /* Grammar rules */
        .grammar-rule {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        
        .grammar-rule-title {
          font-weight: 600;
          font-size: 1.125rem;
          line-height: 1.75rem;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .grammar-rule-explanation {
          margin-bottom: 12px;
          color: #374151;
        }
        
        .grammar-examples {
          margin-top: 12px;
        }
        
        .grammar-examples-title {
          font-weight: 500;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .grammar-examples-list {
          list-style: disc;
          list-style-position: inside;
          space-y: 4px;
        }
        
        .grammar-example-item {
          color: #374151;
        }
        
        /* Exercise content */
        .exercise-instructions {
          margin-bottom: 16px;
          color: #374151;
          font-weight: 500;
        }
        
        .exercise-content {
          margin-bottom: 16px;
          color: #374151;
          line-height: 1.625;
        }
        
        .exercise-question {
          margin-bottom: 12px;
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        
        .exercise-question-text {
          color: #1f2937;
        }
        
        /* Vocabulary table */
        .vocabulary-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #d1d5db;
        }
        
        .vocabulary-table thead {
          background-color: #f3f4f6;
        }
        
        .vocabulary-table th {
          border: 1px solid #d1d5db;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
        }
        
        .vocabulary-table td {
          border: 1px solid #d1d5db;
          padding: 12px;
          color: #374151;
        }
        
        .vocabulary-table tbody tr:hover {
          background-color: #f9fafb;
        }
        
        .vocabulary-term {
          font-weight: 500;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .worksheet-container {
            padding: 10px;
          }
          
          .worksheet-inner-container {
            padding: 15px;
          }
          
          .section-container {
            padding: 16px;
          }
        }
      `}</style>

      <div className="worksheet-container">
        <div className="worksheet-inner-container">
          {/* Version header identical to HTML export */}
          <div className="version-header">
            {worksheetTitle} - Student Version
          </div>

          {/* Main header section */}
          <div className="main-header">
            <h1 className="main-title">
              {worksheetData.title || 'English Worksheet'}
            </h1>
            {worksheetData.subtitle && (
              <h2 className="main-subtitle">{worksheetData.subtitle}</h2>
            )}
            {worksheetData.introduction && (
              <div className="intro-box">
                <p className="intro-text">{worksheetData.introduction}</p>
              </div>
            )}
          </div>

          {/* Warmup Questions */}
          {worksheetData.warmup_questions && worksheetData.warmup_questions.length > 0 && (
            <div className="section-container">
              <div className="section-header warmup">
                <div>
                  <h3 className="section-title warmup">🗣️ Warmup Questions</h3>
                </div>
                <div className="section-time warmup">⏱️ 5 minutes</div>
              </div>
              <div className="question-list">
                {worksheetData.warmup_questions.map((question: string, index: number) => (
                  <div key={index} className="question-item">
                    <span className="question-number">{index + 1}.</span>
                    <p className="question-text">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Rules */}
          {worksheetData.grammar_rules && (
            <div className="section-container">
              <div className="section-header grammar">
                <div>
                  <h3 className="section-title grammar">📚 Grammar Focus</h3>
                </div>
                <div className="section-time grammar">⏱️ 10 minutes</div>
              </div>
              
              {worksheetData.grammar_rules.title && (
                <h4 className="grammar-rule-title">
                  {worksheetData.grammar_rules.title}
                </h4>
              )}
              
              {worksheetData.grammar_rules.introduction && (
                <p className="grammar-rule-explanation">
                  {worksheetData.grammar_rules.introduction}
                </p>
              )}
              
              {worksheetData.grammar_rules.rules && worksheetData.grammar_rules.rules.map((rule: any, index: number) => (
                <div key={index} className="grammar-rule">
                  <h5 className="grammar-rule-title">{rule.title}</h5>
                  <p className="grammar-rule-explanation">{rule.explanation}</p>
                  {rule.examples && rule.examples.length > 0 && (
                    <div className="grammar-examples">
                      <p className="grammar-examples-title">Examples:</p>
                      <ul className="grammar-examples-list">
                        {rule.examples.map((example: string, exIndex: number) => (
                          <li key={exIndex} className="grammar-example-item">{example}</li>
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
            <div key={index} className="section-container">
              <div className="section-header exercise">
                <div>
                  <h3 className="section-title exercise">
                    {exercise.icon || '📝'} {exercise.title || `Exercise ${index + 1}`}
                  </h3>
                </div>
                <div className="section-time exercise">
                  ⏱️ {exercise.time || 10} minutes
                </div>
              </div>
              
              {exercise.instructions && (
                <p className="exercise-instructions">{exercise.instructions}</p>
              )}
              
              {exercise.content && (
                <div className="exercise-content">
                  <div dangerouslySetInnerHTML={{ __html: exercise.content }} />
                </div>
              )}
              
              {exercise.questions && exercise.questions.map((question: any, qIndex: number) => (
                <div key={qIndex} className="exercise-question">
                  <p className="exercise-question-text">
                    <span className="question-number">{qIndex + 1}.</span> {question.question || question.text || question}
                  </p>
                </div>
              ))}
            </div>
          ))}

          {/* Vocabulary Sheet */}
          {worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0 && (
            <div className="section-container">
              <div className="section-header vocabulary">
                <h3 className="section-title vocabulary">📖 Vocabulary</h3>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="vocabulary-table">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worksheetData.vocabulary_sheet.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="vocabulary-term">
                          {item.term || ''}
                        </td>
                        <td>
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
      </div>
    </div>
  );
};

export default SharedWorksheetContent;
