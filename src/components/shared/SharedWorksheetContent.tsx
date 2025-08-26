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
  console.log('🔍 SharedWorksheetContent received worksheet:', worksheet);

  // Parse worksheet data from JSON sources
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

  console.log(`🎨 Rendering static HTML with data from ${dataSource}:`, worksheetData);

  // Create safe worksheet data with fallbacks
  const title = worksheetData.title || worksheet.title || 'English Worksheet';
  const subtitle = worksheetData.subtitle || '';
  const introduction = worksheetData.introduction || '';
  const warmupQuestions = Array.isArray(worksheetData.warmup_questions) ? worksheetData.warmup_questions : [];
  const grammarRules = worksheetData.grammar_rules || null;
  const exercises = Array.isArray(worksheetData.exercises) ? worksheetData.exercises : [];
  const vocabularySheet = Array.isArray(worksheetData.vocabulary_sheet) ? worksheetData.vocabulary_sheet : [];

  // Helper function to shuffle array (for matching exercises)
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  return (
    <div className="container worksheet-content" id="shared-worksheet-content">
      <div className="page-number"></div>
      
      {/* Main header - matching HTML export structure exactly */}
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        <div className="absolute top-4 right-4 hidden sm:block">
          <span className="text-sm text-gray-500">
            Shared worksheet from edooqoo.com
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
          {title}
        </h1>
        
        {subtitle && (
          <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
            {subtitle}
          </h2>
        )}

        {introduction && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
            <p className="leading-snug">{introduction}</p>
          </div>
        )}
      </div>

      {/* Warmup Section */}
      {warmupQuestions.length > 0 && (
        <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Warm-up Questions</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">5 min</span>
            </div>
          </div>
          <div className="p-5">
            <p className="font-medium mb-4">Start the lesson with these conversation questions to engage students and introduce the topic.</p>
            <div className="space-y-2">
              {warmupQuestions.map((question: string, index: number) => (
                <div key={index} className="border-b pb-1">
                  <p className="leading-snug">{index + 1}. {question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grammar Rules */}
      {grammarRules && (
        <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Grammar Rules</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">10 min</span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xl font-semibold text-worksheet-purpleDark mb-4">
              {grammarRules.title}
            </h3>
            
            {grammarRules.introduction && (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                <p className="leading-snug text-blue-800">{grammarRules.introduction}</p>
              </div>
            )}

            <div className="space-y-4">
              {grammarRules.rules && grammarRules.rules.map((rule: any, index: number) => (
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
                            • {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((exercise: any, index: number) => (
        <div key={index} className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{exercise.title}</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{exercise.time || 10} min</span>
            </div>
          </div>

          <div className="p-5">
            <p className="font-medium mb-4 leading-snug">{exercise.instructions}</p>
            
            {exercise.content && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="leading-snug whitespace-pre-line">{exercise.content}</p>
              </div>
            )}

            {/* Reading Exercise */}
            {exercise.type === 'reading' && exercise.questions && (
              <div className="space-y-0.5">
                {exercise.questions.map((question: any, qIndex: number) => (
                  <div key={qIndex} className="border-b pb-1">
                    <p className="font-medium leading-snug">
                      {qIndex + 1}. {question.text || question}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Multiple Choice Exercise */}
            {exercise.type === 'multiple-choice' && exercise.questions && (
              <div className="space-y-2">
                {exercise.questions.map((question: any, qIndex: number) => (
                  <div key={qIndex} className="border-b pb-2 multiple-choice-question">
                    <p className="font-medium mb-1 leading-snug">
                      {qIndex + 1}. {question.text}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {question.options?.map((option: any, oIndex: number) => (
                        <div key={oIndex} className="p-2 border rounded-md flex items-center gap-2 multiple-choice-option bg-white">
                          <div className="w-5 h-5 rounded-md border flex items-center justify-center option-icon border-gray-300">
                          </div>
                          <span>{option.label}. {option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fill in Blanks Exercise */}
            {exercise.type === 'fill-in-blanks' && exercise.sentences && (
              <div>
                {exercise.word_bank && (
                  <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
                    <p className="font-medium mb-2">Word Bank:</p>
                    <div className="flex flex-wrap gap-2">
                      {shuffleArray(exercise.word_bank).map((word: string, wIndex: number) => (
                        <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-0.5">
                  {exercise.sentences.map((sentence: any, sIndex: number) => (
                    <div key={sIndex} className="border-b pb-1">
                      <p className="leading-snug">
                        {sIndex + 1}. {(sentence.text || sentence).replace(/_+/g, "_______________")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Exercise */}
            {exercise.type === 'matching' && exercise.items && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
                <div className="md:col-span-5 space-y-2">
                  <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Terms</h4>
                  {exercise.items.map((item: any, iIndex: number) => (
                    <div key={iIndex} className="p-2 border rounded-md bg-white">
                      <span className="text-worksheet-purple font-medium mr-2">{iIndex + 1}.</span>
                      <span className="student-answer-blank"></span>
                      {item.term}
                    </div>
                  ))}
                </div>

                <div className="md:col-span-7 space-y-2">
                  <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Definitions</h4>
                  {shuffleArray(exercise.items).map((item: any, iIndex: number) => (
                    <div key={iIndex} className="p-2 border rounded-md bg-white">
                      <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
                      {item.definition}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion Exercise */}
            {exercise.type === 'discussion' && exercise.questions && (
              <div className="space-y-0.5">
                <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
                {exercise.questions.map((question: string, qIndex: number) => (
                  <div key={qIndex} className="p-1 border-b">
                    <p className="leading-snug">{qIndex + 1}. {question}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Dialogue Exercise */}
            {exercise.type === 'dialogue' && exercise.dialogue && (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded-md dialogue-section">
                  {exercise.dialogue.map((line: any, lIndex: number) => (
                    <div key={lIndex} className="mb-1 dialogue-line">
                      <span className="font-semibold">{line.speaker}:</span>
                      <span className="leading-snug"> {line.text}</span>
                    </div>
                  ))}
                </div>

                {exercise.expressions && (
                  <div>
                    <p className="font-medium mb-2">
                      {exercise.expression_instruction || "Useful expressions:"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {exercise.expressions.map((expr: string, eIndex: number) => (
                        <div key={eIndex} className="p-2 border rounded-md bg-white">
                          <span className="text-worksheet-purple font-medium mr-2">{eIndex + 1}.</span>
                          {expr}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other exercise types */}
            {(exercise.type === 'error-correction' || exercise.type === 'word-formation' || exercise.type === 'word-order') && exercise.sentences && (
              <div className="space-y-0.5">
                {exercise.sentences.map((sentence: any, sIndex: number) => (
                  <div key={sIndex} className="border-b pb-1">
                    <p className="leading-snug">
                      {sIndex + 1}. {sentence.text || sentence}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* True/False Exercise */}
            {exercise.type === 'true-false' && exercise.statements && (
              <div className="space-y-2">
                {exercise.statements.map((statement: any, sIndex: number) => (
                  <div key={sIndex} className="p-3 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <p className="leading-snug flex-1">{statement.text}</p>
                      <div className="flex gap-4 ml-4">
                        <label className="flex items-center">
                          <input type="radio" name={`statement-${index}-${sIndex}`} className="mr-1" />
                          <span className="text-sm">True</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name={`statement-${index}-${sIndex}`} className="mr-1" />
                          <span className="text-sm">False</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Vocabulary Sheet */}
      {vocabularySheet.length > 0 && (
        <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm" style={{ breakBefore: "page" }} id="vocabulary-sheet">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Vocabulary Sheet</h3>
            </div>
          </div>

          <div className="p-5">
            <p className="font-medium mb-4">
              Learn and practice these key vocabulary terms related to the topic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabularySheet.map((item: any, index: number) => (
                <div key={index} className="border rounded-md p-4 vocabulary-card">
                  <p className="font-semibold text-worksheet-purple">
                    {item.term}
                  </p>
                  <span className="vocabulary-definition-label">Definition or translation:</span>
                  <span className="text-sm text-gray-500">_____________________</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
        <h3 className="font-semibold text-amber-800 mb-2">Teacher Notes</h3>
        <div className="text-amber-700 text-sm space-y-2">
          <p>• Encourage students to participate actively in discussions</p>
          <p>• Provide feedback on pronunciation and grammar</p>
          <p>• Adapt the difficulty level based on student responses</p>
          <p>• Use additional examples if students need more practice</p>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheetContent;
