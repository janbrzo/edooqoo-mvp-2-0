
import React, { useState, useEffect } from "react";
import { ArrowLeft, FileDown, Printer, Copy, CheckCircle, XCircle, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { useMobile } from "@/hooks/use-mobile";

const WorksheetDisplay = ({ 
  worksheet, 
  inputParams, 
  generationTime, 
  sourceCount, 
  onBack 
}) => {
  const [isTeacherView, setIsTeacherView] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingHTML, setIsGeneratingHTML] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const isMobile = useMobile();

  useEffect(() => {
    // Reset copied state after 2 seconds
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const result = await generatePDF(
        "worksheet-content", 
        "worksheet.pdf", 
        isTeacherView, 
        worksheet.title
      );
      
      if (result) {
        toast.success("PDF Generated Successfully", {
          description: "Your worksheet has been downloaded as a PDF file.",
          icon: <CheckCircle className="h-5 w-5" />,
          duration: 4000
        });
      } else {
        toast.error("PDF Generation Failed", {
          description: "There was an error generating your PDF. Please try again.",
          icon: <XCircle className="h-5 w-5" />,
          duration: 4000
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("PDF Generation Failed", {
        description: "There was an error generating your PDF. Please try again.",
        icon: <XCircle className="h-5 w-5" />,
        duration: 4000
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportHTML = async () => {
    setIsGeneratingHTML(true);
    try {
      const result = await exportAsHTML(
        "worksheet-content", 
        "worksheet.html", 
        worksheet.title
      );
      
      if (result) {
        toast.success("HTML Exported Successfully", {
          description: "Your worksheet has been exported as an HTML file.",
          icon: <CheckCircle className="h-5 w-5" />,
          duration: 4000
        });
      } else {
        toast.error("HTML Export Failed", {
          description: "There was an error exporting your HTML. Please try again.",
          icon: <XCircle className="h-5 w-5" />,
          duration: 4000
        });
      }
    } catch (error) {
      console.error("Error exporting HTML:", error);
      toast.error("HTML Export Failed", {
        description: "There was an error exporting your HTML. Please try again.",
        icon: <XCircle className="h-5 w-5" />,
        duration: 4000
      });
    } finally {
      setIsGeneratingHTML(false);
    }
  };

  const handleCopyContent = () => {
    const contentElement = document.getElementById("worksheet-content");
    if (contentElement) {
      const range = document.createRange();
      range.selectNode(contentElement);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
      setCopied(true);
      toast.success("Content Copied", {
        description: "Worksheet content has been copied to clipboard.",
        icon: <CheckCircle className="h-5 w-5" />,
        duration: 2000
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    toast.success("Thank you for your feedback!", {
      description: `You rated this worksheet ${newRating} stars.`,
      icon: <Star className="h-5 w-5" />,
      duration: 3000
    });
  };

  const toggleView = () => {
    setIsTeacherView(!isTeacherView);
  };

  // Helper function to render stars for the rating
  const renderStars = () => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={28}
        className={`cursor-pointer ${index < rating ? "fill-worksheet-purple text-worksheet-purple" : "text-gray-300"}`}
        onClick={() => handleRatingChange(index + 1)}
      />
    ));
  };

  // Helper to render reading comprehension exercise
  const renderReadingExercise = (exercise) => (
    <div className="mb-6">
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-line">{exercise.content}</p>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-gray-800 mb-2">Answer the questions:</h3>
        {exercise.questions.map((question, index) => (
          <div key={index} className="mb-4 exercise-item">
            <div className="exercise-item-question">
              <p className="leading-snug">{index + 1}. {question.text}</p>
            </div>
            <div className="exercise-item-answer">
              {isTeacherView && (
                <span className="text-gray-700">({question.answer})</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render matching exercise
  const renderMatchingExercise = (exercise) => (
    <div className="mb-6">
      <div className="vocabulary-matching-container grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Terms:</h3>
          {exercise.items.map((item, index) => (
            <div key={index} className="mb-2 flex items-start">
              <div className="mr-2">
                {index + 1}.
                {!isTeacherView && (
                  <span className="matching-term-answer">____</span>
                )}
                {isTeacherView && (
                  <span className="matching-term-answer">
                    {String.fromCharCode(65 + exercise.shuffledDefinitions.findIndex(def => def.term === item.term))}
                  </span>
                )}
              </div>
              <div>{item.term}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Definitions:</h3>
          {exercise.shuffledDefinitions.map((item, index) => (
            <div key={index} className="mb-2 flex items-start">
              <div className="mr-2">{String.fromCharCode(65 + index)}.</div>
              <div>{item.definition}</div>
            </div>
          ))}
        </div>
      </div>
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render fill-in-blanks exercise
  const renderFillBlanksExercise = (exercise) => (
    <div className="mb-6">
      <div className="word-bank-container bg-gray-100 p-3 rounded-md mb-4">
        <div className="word-bank flex flex-wrap gap-2 items-center">
          {exercise.word_bank.map((word, i) => (
            <span key={i} className="inline-block bg-white px-2 py-1 rounded border border-gray-300 text-gray-700">
              {word}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {exercise.sentences.map((sentence, index) => (
          <div key={index} className="mb-3 exercise-item">
            <div className="exercise-item-question">
              <p className="leading-snug">
                {index + 1}. {sentence.text.replace('_____', 
                  <span className="fill-blank inline-block mx-1 border-b border-gray-400 text-center">
                    {isTeacherView ? sentence.answer : ""}
                  </span>
                )}
              </p>
            </div>
            <div className="exercise-item-answer">
              {isTeacherView && (
                <span className="text-gray-700">({sentence.answer})</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render multiple choice exercise
  const renderMultipleChoiceExercise = (exercise) => (
    <div className="mb-6">
      {exercise.questions.map((question, qIndex) => (
        <div key={qIndex} className="mb-4 multiple-choice-question">
          <p className="font-medium text-gray-800 mb-2">{qIndex + 1}. {question.text}</p>
          <div className="pl-4">
            {question.options.map((option, oIndex) => (
              <div key={oIndex} className="mb-2 multiple-choice-option">
                <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 mr-2">
                  {option.label}
                </span>
                <span>{option.text}</span>
                {isTeacherView && option.correct && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render dialogue exercise
  const renderDialogueExercise = (exercise) => (
    <div className="mb-6">
      <div className="border border-gray-300 rounded-md p-4 bg-white">
        {exercise.dialogue.map((line, index) => (
          <div key={index} className="mb-3 dialogue-line">
            <p className="leading-snug">
              <strong>{line.speaker}:</strong> {line.text}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-gray-800 mb-2">{exercise.expression_instruction}</h3>
        <div className="flex flex-wrap gap-2">
          {exercise.expressions.map((expr, i) => (
            <span key={i} className="inline-block bg-gray-100 px-2 py-1 rounded text-gray-700 text-sm">
              {expr}
            </span>
          ))}
        </div>
      </div>
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render discussion exercise
  const renderDiscussionExercise = (exercise) => (
    <div className="mb-6">
      <ol className="list-decimal pl-5 space-y-2">
        {exercise.questions.map((question, index) => (
          <li key={index} className="text-gray-800">{question}</li>
        ))}
      </ol>
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render error correction exercise
  const renderErrorCorrectionExercise = (exercise) => (
    <div className="mb-6">
      {exercise.sentences.map((sentence, index) => (
        <div key={index} className="mb-4 exercise-item">
          <div className="exercise-item-question">
            <p className="leading-snug">{index + 1}. {sentence.text}</p>
          </div>
          <div className="exercise-item-answer">
            {isTeacherView && (
              <span className="text-gray-700">({sentence.correction})</span>
            )}
          </div>
        </div>
      ))}
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render word formation exercise
  const renderWordFormationExercise = (exercise) => (
    <div className="mb-6">
      {exercise.sentences.map((sentence, index) => (
        <div key={index} className="mb-4 exercise-item">
          <div className="exercise-item-question">
            <p className="leading-snug">{index + 1}. {sentence.text}</p>
          </div>
          <div className="exercise-item-answer">
            {isTeacherView && (
              <span className="text-gray-700">({sentence.answer})</span>
            )}
          </div>
        </div>
      ))}
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render word order exercise
  const renderWordOrderExercise = (exercise) => (
    <div className="mb-6">
      {exercise.sentences.map((sentence, index) => (
        <div key={index} className="mb-4 exercise-item">
          <div className="exercise-item-question">
            <p className="leading-snug">
              {index + 1}. {sentence.words.join(" / ")}
            </p>
          </div>
          <div className="exercise-item-answer">
            {isTeacherView && (
              <span className="text-gray-700">({sentence.answer})</span>
            )}
          </div>
        </div>
      ))}
      {isTeacherView && exercise.teacher_tip && (
        <div className="bg-worksheet-purpleLight p-3 rounded-md mt-4 teacher-tip-box">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold">Teacher's Tip:</span> {exercise.teacher_tip}
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render exercise based on type
  const renderExercise = (exercise) => {
    const exerciseIcon = getExerciseIcon(exercise.type);
    
    return (
      <div className="mb-8 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="exercise-header flex items-center justify-between bg-worksheet-purple text-white px-4 py-3 h-12">
          <div className="flex items-center">
            <span className="mr-2">{exerciseIcon}</span>
            <h3 className="font-semibold">{exercise.title}</h3>
          </div>
          <div className="text-sm">
            {exercise.time && <span>{exercise.time} min</span>}
          </div>
        </div>
        <div className="p-4 exercise-content">
          <p className="text-gray-600 mb-4">{exercise.instructions}</p>
          
          {exercise.type === "reading" && renderReadingExercise(exercise)}
          {exercise.type === "matching" && renderMatchingExercise(exercise)}
          {exercise.type === "fill-in-blanks" && renderFillBlanksExercise(exercise)}
          {exercise.type === "multiple-choice" && renderMultipleChoiceExercise(exercise)}
          {exercise.type === "dialogue" && renderDialogueExercise(exercise)}
          {exercise.type === "discussion" && renderDiscussionExercise(exercise)}
          {exercise.type === "error-correction" && renderErrorCorrectionExercise(exercise)}
          {exercise.type === "word-formation" && renderWordFormationExercise(exercise)}
          {exercise.type === "word-order" && renderWordOrderExercise(exercise)}
        </div>
      </div>
    );
  };

  // Helper to render vocabulary sheet
  const renderVocabularySheet = () => (
    <div className="mb-8 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <div className="exercise-header flex items-center justify-between bg-worksheet-purple text-white px-4 py-3 h-12">
        <div className="flex items-center">
          <h3 className="font-semibold">Vocabulary Sheet</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {worksheet.vocabulary_sheet.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 vocabulary-card">
              <h4 className="font-semibold text-gray-800">{item.term}</h4>
              <p className="vocabulary-definition-label">Definition:</p>
              <p className="text-gray-700">{item.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Helper to get icon for exercise type
  const getExerciseIcon = (type) => {
    // This would be replaced with actual icons if needed
    return <span className="text-lg">📝</span>;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center worksheet-actions">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold rainbow-text">Your Generated Worksheet</h1>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
              className="flex items-center"
            >
              {isTeacherView ? "Student View" : "Teacher View"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center"
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="flex items-center"
            >
              <FileDown className="mr-2 h-4 w-4" /> 
              {isGeneratingPDF ? "Generating..." : "PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHTML}
              disabled={isGeneratingHTML}
              className="flex items-center"
            >
              <FileDown className="mr-2 h-4 w-4" /> 
              {isGeneratingHTML ? "Exporting..." : "HTML"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              className="flex items-center"
            >
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
        
        {inputParams && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 input-params">
            <h2 className="text-lg font-semibold mb-2">Your Input Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">Topic: <span className="font-medium text-gray-800">{inputParams.topic}</span></p>
              </div>
              <div>
                <p className="text-gray-600">English Level: <span className="font-medium text-gray-800">{inputParams.englishLevel}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Lesson Time: <span className="font-medium text-gray-800">{inputParams.lessonTime}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Exercise Types: <span className="font-medium text-gray-800">{inputParams.exerciseTypes.join(", ")}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Focus Area: <span className="font-medium text-gray-800">{inputParams.focusArea}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Student Age: <span className="font-medium text-gray-800">{inputParams.studentAge}</span></p>
              </div>
              {inputParams.additionalInstructions && (
                <div className="col-span-full">
                  <p className="text-gray-600">Additional Instructions: <span className="font-medium text-gray-800">{inputParams.additionalInstructions}</span></p>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span>Generation time: {generationTime} seconds, {sourceCount} sources processed</span>
              </div>
            </div>
          </div>
        )}
        
        <div id="worksheet-content" className="mb-8 worksheet-content">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-800">{worksheet.title}</h1>
            {worksheet.subtitle && (
              <h2 className="text-xl text-center text-gray-600 mt-2">{worksheet.subtitle}</h2>
            )}
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{worksheet.introduction}</p>
            </div>
          </div>
          
          {worksheet.exercises.map((exercise, index) => (
            <div key={index}>
              {renderExercise(exercise)}
            </div>
          ))}
          
          {renderVocabularySheet()}
          
          <div className="rating-section bg-blue-50 rounded-lg p-6 mb-6 text-center">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">How would you rate this worksheet?</h3>
            <p className="text-blue-600 mb-4">Your feedback helps us improve our AI-generated worksheets</p>
            <div className="flex justify-center space-x-2">
              {renderStars()}
            </div>
          </div>
          
          <div className="teacher-notes bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Tips for teachers</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-worksheet-purple rounded-full mt-2 mr-2"></span>
                <span>This worksheet is a general template you can customize for your student.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-worksheet-purple rounded-full mt-2 mr-2"></span>
                <span>Verify the industry-specific terminology for accuracy.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-worksheet-purple rounded-full mt-2 mr-2"></span>
                <span>Adjust the difficulty level as needed for your student.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-worksheet-purple rounded-full mt-2 mr-2"></span>
                <span>Consider adding more visual elements for visual learners.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorksheetDisplay;
