
import React from 'react';
import { AlertCircle, MessageCircle, BookOpen, Clock, FileText } from 'lucide-react';
import ExerciseMatching from '../worksheet/ExerciseMatching';
import ExerciseFillInBlanks from '../worksheet/ExerciseFillInBlanks';
import ExerciseMultipleChoice from '../worksheet/ExerciseMultipleChoice';
import ExerciseReading from '../worksheet/ExerciseReading';
import ExerciseDialogue from '../worksheet/ExerciseDialogue';
import { deepFixTextObjects } from '../../utils/textObjectFixer';
import { getIconComponent } from '../../utils/iconUtils';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
  };
}

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ worksheet }) => {
  console.log('🔧 SharedWorksheetContent: Starting data parsing...');
  console.log('🔧 ai_response length:', worksheet.ai_response?.length || 0);
  console.log('🔧 html_content length:', worksheet.html_content?.length || 0);

  let worksheetData = null;

  // Try ai_response first (contains complete data), then html_content as fallback
  if (worksheet.ai_response && worksheet.ai_response.trim()) {
    try {
      console.log('🔧 Attempting to parse ai_response...');
      const rawData = JSON.parse(worksheet.ai_response);
      console.log('✅ Successfully parsed ai_response, now fixing text objects:', rawData);
      
      // CRITICAL FIX: Apply deepFixTextObjects to fix {text: "..."} objects
      worksheetData = deepFixTextObjects(rawData, 'ai_response');
      console.log('✅ Text objects fixed:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing ai_response:', error);
    }
  }

  // Fallback to html_content if ai_response failed
  if (!worksheetData && worksheet.html_content && worksheet.html_content.trim()) {
    try {
      console.log('🔧 Fallback: Attempting to parse html_content...');
      const rawData = JSON.parse(worksheet.html_content);
      console.log('✅ Successfully parsed html_content, now fixing text objects:', rawData);
      
      // CRITICAL FIX: Apply deepFixTextObjects to fix {text: "..."} objects
      worksheetData = deepFixTextObjects(rawData, 'html_content');
      console.log('✅ Text objects fixed:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing html_content:', error);
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
          Failed to parse worksheet data from both ai_response and html_content
        </p>
      </div>
    );
  }

  console.log('✅ Using worksheet data:', {
    title: worksheetData.title,
    hasExercises: worksheetData.exercises?.length || 0,
    hasWarmup: worksheetData.warmup_questions?.length || 0,
    hasGrammar: !!worksheetData.grammar_rules
  });

  // Render using IDENTICAL structure to HTML export with WIDER container (60% smaller margins)
  return (
    <div className="worksheet-content mb-8" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }} id="shared-worksheet-content">
      <div className="page-number"></div>
      
      {/* Main header - identical to WorksheetContent.tsx */}
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        {/* Clickable edooqoo link - positioned in top right */}
        <div className="absolute top-4 right-4 hidden sm:block">
          <a 
            href="https://edooqoo.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-worksheet-purple transition-colors duration-200 hover:underline"
          >
            Shared worksheet from edooqoo.com
          </a>
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

      {/* Exercises - using proper React components with FIXED ICONS */}
      {worksheetData.exercises && worksheetData.exercises.map((exercise: any, index: number) => {
        console.log(`🔧 Rendering exercise ${index + 1}: ${exercise.type}`, exercise);
        
        return (
          <div key={index} className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-full mr-3">
                  {/* FIXED: Use getIconComponent instead of text */}
                  {getIconComponent(exercise.icon || 'fa-book-open')}
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
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line leading-snug">{exercise.content}</p>
                </div>
              )}
              
              {/* Type-aware exercise rendering using React components */}
              {exercise.type === 'reading' && exercise.questions && (
                <ExerciseReading
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}} // No-op for shared view
                />
              )}

              {exercise.type === 'matching' && exercise.items && (
                <ExerciseMatching
                  items={exercise.items}
                  isEditing={false}
                  viewMode="student"
                  getMatchedItems={() => exercise.items}
                  onItemChange={() => {}} // No-op for shared view
                />
              )}

              {exercise.type === 'fill-in-blanks' && exercise.sentences && (
                <ExerciseFillInBlanks
                  word_bank={exercise.word_bank}
                  sentences={exercise.sentences}
                  isEditing={false}
                  viewMode="student"
                  onWordBankChange={() => {}} // No-op for shared view
                  onSentenceChange={() => {}} // No-op for shared view
                />
              )}

              {exercise.type === 'multiple-choice' && exercise.questions && (
                <ExerciseMultipleChoice
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  onQuestionTextChange={() => {}} // No-op for shared view
                  onOptionTextChange={() => {}} // No-op for shared view
                />
              )}

              {exercise.type === 'dialogue' && exercise.dialogue && (
                <ExerciseDialogue
                  dialogue={exercise.dialogue}
                  expressions={exercise.expressions}
                  expression_instruction={exercise.expression_instruction}
                  isEditing={false}
                  viewMode="student"
                  onDialogueChange={() => {}} // No-op for shared view
                  onExpressionChange={() => {}} // No-op for shared view
                  onExpressionInstructionChange={() => {}} // No-op for shared view
                />
              )}

              {/* Discussion questions - simple rendering */}
              {exercise.type === 'discussion' && exercise.questions && (
                <div className="space-y-0.5">
                  <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
                  {exercise.questions.map((question: string, qIndex: number) => (
                    <div key={qIndex} className="p-1 border-b">
                      <p className="leading-snug">
                        {qIndex + 1}. {question}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Other exercise types - use existing simple rendering */}
              {(exercise.type === 'error-correction' || exercise.type === 'word-formation' || exercise.type === 'word-order') && 
                exercise.sentences && (
                  <div className="space-y-0.5">
                    {exercise.sentences.map((sentence: any, sIndex: number) => (
                      <div key={sIndex} className="border-b pb-1">
                        <p className="leading-snug">
                          {sIndex + 1}. {
                            exercise.type === 'word-formation' 
                              ? sentence.text.replace(/_+/g, "_______________") 
                              : sentence.text
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              {/* True/False exercise type */}
              {exercise.type === 'true-false' && exercise.statements && (
                <div className="space-y-2">
                  {exercise.statements.map((statement: any, sIndex: number) => (
                    <div key={sIndex} className="border-b pb-2">
                      <div className="flex flex-row items-start">
                        <div className="flex-grow">
                          <p className="leading-snug">
                            {sIndex + 1}. {statement.text}
                          </p>
                        </div>
                        <div className="ml-4 flex space-x-4">
                          <label className="inline-flex items-center">
                            <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled />
                            <span className="ml-2">True</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input type="radio" name={`statement-${sIndex}`} className="form-radio h-4 w-4" disabled />
                            <span className="ml-2">False</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

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
