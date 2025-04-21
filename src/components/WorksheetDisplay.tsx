import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faLink, faPencilAlt, faCheckSquare, faComments, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import RatingSection from "./RatingSection";
import TeacherTipBox from "./TeacherTipBox";

interface WorksheetDisplayProps {
  worksheet: any;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "reading":
      return faBookOpen;
    case "matching":
      return faLink;
    case "fill-in-blanks":
      return faPencilAlt;
    case "multiple-choice":
      return faCheckSquare;
    case "dialogue":
      return faComments;
    case "discussion":
      return faQuestionCircle;
    default:
      return faQuestionCircle;
  }
};

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack
}: WorksheetDisplayProps) {
  const { toast } = useToast();

  const handleDownloadPDF = async (isTeacherView: boolean) => {
    try {
      const success = await generatePDF('worksheet-content', 'worksheet.pdf', isTeacherView, worksheet.title);
      if (success) {
        toast({
          title: "PDF generated successfully!",
          description: "Your worksheet has been saved as a PDF file.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        toast({
          title: "Failed to generate PDF",
          description: "There was an error generating the PDF. Please try again.",
          variant: "destructive",
          className: "bg-white border-l-4 border-l-red-500 shadow-lg rounded-xl"
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Failed to generate PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
        className: "bg-white border-l-4 border-l-red-500 shadow-lg rounded-xl"
      });
    }
  };

  const handleExportHTML = async () => {
    try {
      const success = await exportAsHTML('worksheet-content', 'worksheet.html', worksheet.title);
      if (success) {
        toast({
          title: "HTML exported successfully!",
          description: "Your worksheet has been saved as an HTML file.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        toast({
          title: "Failed to export HTML",
          description: "There was an error exporting the HTML. Please try again.",
          variant: "destructive",
          className: "bg-white border-l-4 border-l-red-500 shadow-lg rounded-xl"
        });
      }
    } catch (error) {
      console.error("Error exporting HTML:", error);
      toast({
        title: "Failed to export HTML",
        description: "There was an error exporting the HTML. Please try again.",
        variant: "destructive",
        className: "bg-white border-l-4 border-l-red-500 shadow-lg rounded-xl"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 worksheet-result-page">
      <div className="py-10 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-4 text-white bg-worksheet-purple rounded-t-xl px-7 py-4 text-center shadow" style={{letterSpacing: "-1px"}}>Your Generated Worksheet</h1>
        <RatingSection />
        <div className="bg-white shadow rounded-md p-8 mb-6">
          <div className="worksheet-header mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{worksheet.title}</h2>
            <p className="text-gray-600">{worksheet.subtitle}</p>
          </div>
          <div className="input-params mb-4">
            <p className="text-gray-700">
              <strong>Topic:</strong> {inputParams?.topic}, <strong>Level:</strong> {inputParams?.studentLevel}, <strong>Time:</strong> {inputParams?.lessonTime}
            </p>
          </div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              Generated in {generationTime} seconds using {sourceCount} sources.
            </p>
            <div className="flex gap-2">
              <CopyToClipboard text={JSON.stringify(worksheet, null, 2)}
                onCopy={() => toast({
                  title: "Worksheet copied to clipboard!",
                  description: "You can now paste the worksheet data.",
                  className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
                })}>
                <Button variant="outline">Copy JSON</Button>
              </CopyToClipboard>
              <Button onClick={handleExportHTML}>Export HTML</Button>
              <Button onClick={() => handleDownloadPDF(false)}>Download PDF (Student)</Button>
              <Button onClick={() => handleDownloadPDF(true)}>Download PDF (Teacher)</Button>
              <Button variant="secondary" onClick={onBack}>Back to Form</Button>
            </div>
          </div>
          <p className="text-gray-700 mb-6">{worksheet.introduction}</p>
          <div id="worksheet-content">
            {worksheet.exercises.map((ex: any, i: number) => (
              <div key={i} className="mb-10">
                <div className="exercise-header flex items-center gap-3 bg-worksheet-purple text-white rounded-t-md px-4 py-3 mb-0" style={{height: "48px", minHeight: "48px", maxHeight: "48px"}}>
                  <FontAwesomeIcon icon={getIconForType(ex.type)} className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">{ex.title}</h3>
                  <span className="ml-auto text-sm">Time: {ex.time} minutes</span>
                </div>
                <div className="bg-white rounded-b-md px-5 py-5 shadow exercise-content">
                  <p className="mb-4"><strong>Instructions:</strong> {ex.instructions}</p>
                  {ex.type === "reading" && (
                    <div>
                      <p className="mb-4">{ex.content}</p>
                      {ex.questions && ex.questions.map((question: any, index: number) => (
                        <div key={index} className="mb-4 exercise-question">
                          <p><strong>Question:</strong> {question.text}</p>
                          <div className="flex items-center">
                            Student Answer:
                            <span className="student-answer-blank mx-2"></span>
                            <span className="teacher-answer">({question.answer})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.type === "matching" && (
                    <div className="vocabulary-matching-container">
                      <div className="terms-column">
                        <h4 className="font-semibold mb-2">Terms</h4>
                        {ex.shuffledTerms && ex.shuffledTerms.map((item: any, index: number) => (
                          <div key={index} className="mb-2 exercise-item">
                            {item.term}
                          </div>
                        ))}
                      </div>
                      <div className="definitions-column">
                        <h4 className="font-semibold mb-2">Definitions</h4>
                        {ex.shuffledDefinitions && ex.shuffledDefinitions.map((item: any, index: number) => {
                          const originalIndex = ex.originalItems.findIndex((originalItem: any) => originalItem.definition === item.definition);
                          const originalTerm = ex.originalItems[originalIndex].term;
                          return (
                            <div key={index} className="mb-2 exercise-item">
                              {item.definition}
                              <span className="teacher-answer">({originalTerm})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {ex.type === "fill-in-blanks" && (
                    <div>
                      {ex.sentences && ex.sentences.map((sentence: any, index: number) => (
                        <div key={index} className="mb-3 sentence-item">
                          {sentence.text.split('_____').map((part: string, i: number, parts: string[]) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < parts.length - 1 && (
                                <>
                                  <span className="fill-blank"></span>
                                  <span className="teacher-answer">({sentence.answer})</span>
                                </>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                      {ex.word_bank && (
                        <div className="word-bank-container">
                          <div className="word-bank">
                            <strong>Word Bank:</strong> {ex.word_bank.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {ex.type === "multiple-choice" && (
                    <div>
                      {ex.questions && ex.questions.map((question: any, index: number) => (
                        <div key={index} className="mb-4 multiple-choice-question">
                          <p className="mb-2">{question.text}</p>
                          {question.options && question.options.map((option: any, optionIndex: number) => (
                            <div key={optionIndex} className="multiple-choice-option">
                              <span className="option-icon">{option.correct ? '✓' : '☐'}</span>
                              {option.label}. {option.text}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.type === "dialogue" && (
                    <div>
                      {ex.dialogue && ex.dialogue.map((line: any, index: number) => (
                        <div key={index} className="mb-2 dialogue-line">
                          <strong>{line.speaker}:</strong> {line.text}
                        </div>
                      ))}
                      {ex.expression_instruction && (
                        <p className="mt-4"><strong>{ex.expression_instruction}</strong></p>
                      )}
                      {ex.expressions && (
                        <ul className="list-disc pl-5 mt-2">
                          {ex.expressions.map((expression: string, index: number) => (
                            <li key={index}>{expression}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {ex.type === "discussion" && (
                    <div>
                      {ex.questions && ex.questions.map((question: string, index: number) => (
                        <div key={index} className="mb-4 exercise-question">
                          <p>{index + 1}. {question}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.type === "error-correction" && (
                    <div>
                      {ex.sentences && ex.sentences.map((sentence: any, index: number) => (
                        <div key={index} className="mb-3 sentence-item">
                          <p>
                            {sentence.text}
                            <span className="teacher-answer">({sentence.correction})</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.type === "word-formation" && (
                    <div>
                      {ex.sentences && ex.sentences.map((sentence: any, index: number) => (
                        <div key={index} className="mb-3 sentence-item">
                          {sentence.text.split('_____').map((part: string, i: number, parts: string[]) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < parts.length - 1 && (
                                <>
                                  <span className="word-formation-blank"></span>
                                  <span className="teacher-answer">({sentence.answer})</span>
                                </>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.type === "word-order" && (
                    <div>
                      {ex.sentences && ex.sentences.map((sentence: any, index: number) => (
                        <div key={index} className="mb-3 sentence-item">
                          <p>
                            {sentence.words.join(' ')}
                            <span className="teacher-answer">({sentence.answer})</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.teacher_tip && (
                    <TeacherTipBox>{ex.teacher_tip}</TeacherTipBox>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
