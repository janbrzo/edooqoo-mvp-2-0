
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Database, Download, Edit, Eye, Star, Zap, FileText, Info, Lightbulb, Pencil, User, UserCog, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { generatePDF, exportAsHTML } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: any[];
  items?: any[];
  sentences?: any[];
  dialogue?: any[];
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
}

export interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: Exercise[];
  vocabulary_sheet: {
    term: string;
    meaning: string;
  }[];
}

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorksheet, setEditableWorksheet] = useState<Worksheet>(worksheet);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Handle scroll event to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getMatchedItems = (items: any[]) => {
    return viewMode === 'teacher' ? items : shuffleArray([...items]);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your worksheet has been updated successfully."
    });
  };
  
  const handleDownloadPDF = async () => {
    if (worksheetRef.current) {
      toast({
        title: "Preparing PDF",
        description: "Your worksheet is being converted to PDF..."
      });
      try {
        const result = await generatePDF('worksheet-content', `${editableWorksheet.title.replace(/\s+/g, '_')}.pdf`, viewMode === 'teacher', editableWorksheet.title);
        if (result) {
          toast({
            title: "PDF Downloaded",
            description: "Your worksheet has been downloaded successfully."
          });
        } else {
          toast({
            title: "PDF Generation Failed",
            description: "There was an error generating your PDF. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDownloadHTML = async () => {
    if (worksheetRef.current) {
      toast({
        title: "Preparing HTML",
        description: "Your worksheet is being converted to HTML..."
      });
      try {
        const result = await exportAsHTML('worksheet-content', `${editableWorksheet.title.replace(/\s+/g, '_')}.html`, editableWorksheet.title);
        if (result) {
          toast({
            title: "HTML Downloaded",
            description: "Your worksheet has been downloaded successfully.",
            variant: "success"
          });
        }
      } catch (error) {
        console.error('HTML generation error:', error);
        toast({
          title: "HTML Generation Failed",
          description: "There was an error generating your HTML. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "fa-book-open":
        return <Eye className="h-5 w-5" />;
      case "fa-link":
        return <Database className="h-5 w-5" />;
      case "fa-pencil-alt":
        return <Pencil className="h-5 w-5" />;
      case "fa-check-square":
        return <Star className="h-5 w-5" />;
      case "fa-comments":
        return <User className="h-5 w-5" />;
      case "fa-question-circle":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };
  
  const handleExerciseChange = (index: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };
  
  const handleQuestionChange = (exerciseIndex: number, questionIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.questions) {
      exercise.questions[questionIndex] = {
        ...exercise.questions[questionIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleSentenceChange = (exerciseIndex: number, sentenceIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.sentences) {
      exercise.sentences[sentenceIndex] = {
        ...exercise.sentences[sentenceIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleItemChange = (exerciseIndex: number, itemIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.items) {
      exercise.items[itemIndex] = {
        ...exercise.items[itemIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleDialogueChange = (exerciseIndex: number, dialogueIndex: number, field: string, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.dialogue) {
      exercise.dialogue[dialogueIndex] = {
        ...exercise.dialogue[dialogueIndex],
        [field]: value
      };
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleExpressionChange = (exerciseIndex: number, expressionIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.expressions) {
      exercise.expressions[expressionIndex] = value;
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: updatedExercises
      });
    }
  };
  
  const handleTeacherTipChange = (exerciseIndex: number, value: string) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[exerciseIndex].teacher_tip = value;
    setEditableWorksheet({
      ...editableWorksheet,
      exercises: updatedExercises
    });
  };
  
  const getExercisesByTime = (exercises: Exercise[], time: string) => {
    if (time === "30 min") return exercises.slice(0, 4);
    if (time === "45 min") return exercises.slice(0, 6);
    return exercises.slice(0, 8); // 60 min gets 8 exercises
  };

  const handleSubmitRating = () => {
    console.log("Submitted rating:", rating, "with feedback:", feedback);
    setRatingDialogOpen(false);
    toast({
      title: "Thank you for your feedback!",
      description: "Your rating and comments help us improve our service."
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Create New Worksheet
        </Button>
        
        <div className="bg-worksheet-purple text-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1 rainbow-text">Your Generated Worksheet</h1>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm">Generated in {generationTime}s</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
                <Database className="h-4 w-4 text-blue-300" />
                <span className="text-sm">Based on {sourceCount} sources</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
                <Clock className="h-4 w-4 text-green-300" />
                <span className="text-sm">{inputParams.lessonTime} lesson</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-worksheet-purple" />
              Your Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-worksheet-purpleLight rounded-full p-2">
                  <Clock className="h-4 w-4 text-worksheet-purple" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lesson Duration</p>
                  <p className="font-medium text-sm">
                    {inputParams.lessonTime}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-worksheet-purpleLight rounded-full p-2">
                  <Database className="h-4 w-4 text-worksheet-purple" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lesson Topic</p>
                  <p className="font-medium text-sm">
                    {inputParams.lessonTopic}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-worksheet-purpleLight rounded-full p-2">
                  <Star className="h-4 w-4 text-worksheet-purple" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lesson Goal</p>
                  <p className="font-medium text-sm">
                    {inputParams.lessonGoal}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-worksheet-purpleLight rounded-full p-2">
                  <User className="h-4 w-4 text-worksheet-purple" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teaching Preferences</p>
                  <p className="font-medium text-sm">
                    {inputParams.teachingPreferences}
                  </p>
                </div>
              </div>
              
              {inputParams.studentProfile && (
                <div className="flex items-center gap-3">
                  <div className="bg-worksheet-purpleLight rounded-full p-2">
                    <UserCog className="h-4 w-4 text-worksheet-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student Profile</p>
                    <p className="font-medium text-sm">
                      {inputParams.studentProfile}
                    </p>
                  </div>
                </div>
              )}
              
              {inputParams.studentStruggles && (
                <div className="flex items-center gap-3">
                  <div className="bg-worksheet-purpleLight rounded-full p-2">
                    <Edit className="h-4 w-4 text-worksheet-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Main Struggles</p>
                    <p className="font-medium text-sm">
                      {inputParams.studentStruggles}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
          <div className="flex justify-between items-center max-w-[98%] mx-auto">
            <div className="flex space-x-2">
              <Button variant={viewMode === 'student' ? 'default' : 'outline'} onClick={() => setViewMode('student')} className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''} size="sm">
                <User className="mr-2 h-4 w-4" />
                Student View
              </Button>
              <Button variant={viewMode === 'teacher' ? 'default' : 'outline'} onClick={() => setViewMode('teacher')} className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''} size="sm">
                <Lightbulb className="mr-2 h-4 w-4" />
                Teacher View
              </Button>
            </div>
            
            <div className="flex items-center">
              {!isEditing && (
                <>
                  <div className="text-amber-600 flex items-center mr-4 text-sm italic px-3 py-1.5 bg-amber-50 rounded">
                    Click the Edit button to modify the worksheet →
                  </div>
                  <Button variant="outline" onClick={handleEdit} className="border-worksheet-purple text-worksheet-purple mr-2" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
                  </Button>
                </>
              )}
              
              {isEditing && (
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 mr-2" size="sm">
                  Save Changes
                </Button>
              )}
              
              <Button onClick={handleDownloadHTML} className="bg-worksheet-purple hover:bg-worksheet-purpleDark mr-2" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download HTML
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-worksheet-purple hover:bg-worksheet-purpleDark" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="worksheet-content mb-8" id="worksheet-content" ref={worksheetRef}>
          <div className="bg-white p-6 border rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableWorksheet.title} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    title: e.target.value
                  })} 
                  className="w-full border p-2 editable-content" 
                />
              ) : editableWorksheet.title}
            </h1>
            
            <h2 className="text-xl text-worksheet-purple mb-3 leading-tight">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableWorksheet.subtitle} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    subtitle: e.target.value
                  })} 
                  className="w-full border p-2 editable-content" 
                />
              ) : editableWorksheet.subtitle}
            </h2>
            
            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
              {isEditing ? (
                <textarea 
                  value={editableWorksheet.introduction} 
                  onChange={e => setEditableWorksheet({
                    ...editableWorksheet,
                    introduction: e.target.value
                  })} 
                  className="w-full h-20 border p-2 editable-content" 
                />
              ) : (
                <p className="leading-snug">{editableWorksheet.introduction}</p>
              )}
            </div>
          </div>

          {editableWorksheet.exercises.map((exercise, index) => (
            <div key={index} className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    {getIconComponent(exercise.icon)}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={exercise.title} 
                        onChange={e => handleExerciseChange(index, 'title', e.target.value)} 
                        className="bg-transparent border-b border-white/30 text-white w-full p-1" 
                      />
                    ) : exercise.title}
                  </h3>
                </div>
                <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{exercise.time} min</span>
                </div>
              </div>
              
              <div className="p-5">
                <p className="font-medium mb-3 leading-snug">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={exercise.instructions} 
                      onChange={e => handleExerciseChange(index, 'instructions', e.target.value)} 
                      className="w-full border p-2 editable-content" 
                    />
                  ) : exercise.instructions}
                </p>
                
                {exercise.content && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-md">
                    {isEditing ? (
                      <textarea 
                        value={exercise.content} 
                        onChange={e => handleExerciseChange(index, 'content', e.target.value)} 
                        className="w-full h-32 border p-2 editable-content" 
                      />
                    ) : (
                      <p className="whitespace-pre-line leading-snug">{exercise.content}</p>
                    )}
                  </div>
                )}
                
                {exercise.type === 'reading' && exercise.questions && (
                  <div className="space-y-0.5">
                    {exercise.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border-b pb-1">
                        <div className="flex flex-row items-start">
                          <div className="flex-grow">
                            <p className="font-medium leading-snug">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={question.text} 
                                  onChange={e => handleQuestionChange(index, qIndex, 'text', e.target.value)} 
                                  className="w-full border p-1 editable-content" 
                                />
                              ) : (
                                <>{qIndex + 1}. {question.text}</>
                              )}
                            </p>
                          </div>
                          {viewMode === 'teacher' && (
                            <div className="text-green-600 italic ml-3 text-sm">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={question.answer} 
                                  onChange={e => handleQuestionChange(index, qIndex, 'answer', e.target.value)} 
                                  className="border p-1 editable-content w-full" 
                                />
                              ) : (
                                <span>({question.answer})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {exercise.type === 'matching' && exercise.items && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
                    <div className="md:col-span-5 space-y-2">
                      <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Terms</h4>
                      {exercise.items.map((item, iIndex) => (
                        <div key={iIndex} className="p-2 border rounded-md bg-white">
                          <span className="text-worksheet-purple font-medium mr-2">{iIndex + 1}.</span> 
                          {viewMode === 'teacher' ? (
                            <span className="teacher-answer">{String.fromCharCode(65 + getMatchedItems(exercise.items).findIndex(i => i.term === item.term))}</span>
                          ) : (
                            <span className="student-answer-blank"></span>
                          )}
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={item.term} 
                              onChange={e => handleItemChange(index, iIndex, 'term', e.target.value)} 
                              className="border p-1 editable-content w-full" 
                            />
                          ) : item.term}
                        </div>
                      ))}
                    </div>
                    
                    <div className="md:col-span-7 space-y-2">
                      <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Definitions</h4>
                      {getMatchedItems(exercise.items).map((item, iIndex) => (
                        <div key={iIndex} className="p-2 border rounded-md bg-white">
                          <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span> 
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={item.definition} 
                              onChange={e => {
                                const originalIndex = exercise.items.findIndex(i => i.term === item.term);
                                if (originalIndex !== -1) {
                                  handleItemChange(index, originalIndex, 'definition', e.target.value);
                                }
                              }} 
                              className="border p-1 editable-content w-full" 
                            />
                          ) : item.definition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {exercise.type === 'fill-in-blanks' && exercise.sentences && (
                  <div>
                    {exercise.word_bank && (
                      <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
                        <p className="font-medium mb-2">Word Bank:</p>
                        <div className="flex flex-wrap gap-2">
                          {exercise.word_bank.map((word, wIndex) => (
                            <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={word} 
                                  onChange={e => {
                                    const newWordBank = [...exercise.word_bank!];
                                    newWordBank[wIndex] = e.target.value;
                                    const updatedExercises = [...editableWorksheet.exercises];
                                    updatedExercises[index] = {
                                      ...updatedExercises[index],
                                      word_bank: newWordBank
                                    };
                                    setEditableWorksheet({
                                      ...editableWorksheet,
                                      exercises: updatedExercises
                                    });
                                  }} 
                                  className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0" 
                                />
                              ) : word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-0.5">
                      {exercise.sentences.map((sentence, sIndex) => (
                        <div key={sIndex} className="border-b pb-1">
                          <div className="flex flex-row items-start">
                            <div className="flex-grow">
                              <p className="leading-snug">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.text} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)} 
                                    className="w-full border p-1 editable-content" 
                                  />
                                ) : (
                                  <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                                )}
                              </p>
                            </div>
                            {viewMode === 'teacher' && (
                              <div className="text-green-600 italic ml-3 text-sm">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.answer} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'answer', e.target.value)} 
                                    className="border p-1 editable-content w-full" 
                                  />
                                ) : (
                                  <span>({sentence.answer})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {exercise.type === 'multiple-choice' && exercise.questions && (
                  <div className="space-y-2">
                    {exercise.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border-b pb-2 multiple-choice-question">
                        <p className="font-medium mb-1 leading-snug">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={question.text} 
                              onChange={e => handleQuestionChange(index, qIndex, 'text', e.target.value)} 
                              className="w-full border p-1 editable-content" 
                            />
                          ) : (
                            <>{qIndex + 1}. {question.text}</>
                          )}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {question.options.map((option: any, oIndex: number) => (
                            <div 
                              key={oIndex} 
                              className={`
                                p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                                ${viewMode === 'teacher' && option.correct ? 'bg-green-50 border-green-200' : 'bg-white'}
                              `}
                            >
                              <div 
                                className={`
                                  w-5 h-5 rounded-md border flex items-center justify-center option-icon
                                  ${viewMode === 'teacher' && option.correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}
                                `}
                              >
                                {viewMode === 'teacher' && option.correct && <span>✓</span>}
                              </div>
                              <span>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={option.text} 
                                    onChange={e => {
                                      const updatedExercises = [...editableWorksheet.exercises];
                                      const newOptions = [...question.options];
                                      newOptions[oIndex] = {
                                        ...newOptions[oIndex],
                                        text: e.target.value
                                      };
                                      if (updatedExercises[index].questions) {
                                        updatedExercises[index].questions![qIndex] = {
                                          ...updatedExercises[index].questions![qIndex],
                                          options: newOptions
                                        };
                                        setEditableWorksheet({
                                          ...editableWorksheet,
                                          exercises: updatedExercises
                                        });
                                      }
                                    }} 
                                    className="border p-1 editable-content ml-1" 
                                  />
                                ) : (
                                  <>{option.label}. {option.text}</>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {exercise.type === 'dialogue' && exercise.dialogue && (
                  <div>
                    <div className="mb-4 p-4 bg-gray-50 rounded-md dialogue-section">
                      {exercise.dialogue.map((line, lIndex) => (
                        <div key={lIndex} className="mb-1 dialogue-line">
                          <span className="font-semibold">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={line.speaker} 
                                onChange={e => handleDialogueChange(index, lIndex, 'speaker', e.target.value)} 
                                className="border p-1 editable-content w-32" 
                              />
                            ) : (
                              <>{line.speaker}:</>
                            )}
                          </span>
                          <span className="leading-snug">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={line.text} 
                                onChange={e => handleDialogueChange(index, lIndex, 'text', e.target.value)} 
                                className="border p-1 editable-content ml-1 w-full" 
                              />
                            ) : (
                              <> {line.text}</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {exercise.expressions && (
                      <div>
                        <p className="font-medium mb-2">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={exercise.expression_instruction || ""} 
                              onChange={e => {
                                const updatedExercises = [...editableWorksheet.exercises];
                                updatedExercises[index] = {
                                  ...updatedExercises[index],
                                  expression_instruction: e.target.value
                                };
                                setEditableWorksheet({
                                  ...editableWorksheet,
                                  exercises: updatedExercises
                                });
                              }} 
                              className="w-full border p-1 editable-content" 
                            />
                          ) : exercise.expression_instruction}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {exercise.expressions.map((expr, eIndex) => (
                            <div key={eIndex} className="p-2 border rounded-md bg-white">
                              <span className="text-worksheet-purple font-medium mr-2">{eIndex + 1}.</span> 
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={expr} 
                                  onChange={e => handleExpressionChange(index, eIndex, e.target.value)} 
                                  className="border p-1 editable-content w-full" 
                                />
                              ) : expr}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {exercise.type === 'discussion' && exercise.questions && (
                  <div className="space-y-0.5">
                    {exercise.questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-1 border-b">
                        <p className="leading-snug">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={question} 
                              onChange={e => {
                                const updatedExercises = [...editableWorksheet.exercises];
                                const newQuestions = [...exercise.questions!];
                                newQuestions[qIndex] = e.target.value;
                                updatedExercises[index] = {
                                  ...updatedExercises[index],
                                  questions: newQuestions
                                };
                                setEditableWorksheet({
                                  ...editableWorksheet,
                                  exercises: updatedExercises
                                });
                              }} 
                              className="w-full border p-1 editable-content" 
                            />
                          ) : (
                            <>{qIndex + 1}. {question}</>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {exercise.type === 'error-correction' && exercise.sentences && (
                  <div>
                    <div className="space-y-0.5">
                      {exercise.sentences.map((sentence, sIndex) => (
                        <div key={sIndex} className="border-b pb-1">
                          <div className="flex flex-row items-start">
                            <div className="flex-grow">
                              <p className="leading-snug">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.text} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)} 
                                    className="w-full border p-1 editable-content" 
                                  />
                                ) : (
                                  <>{sIndex + 1}. {sentence.text}</>
                                )}
                              </p>
                            </div>
                            {viewMode === 'teacher' && (
                              <div className="text-green-600 italic ml-3 text-sm">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.correction} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'correction', e.target.value)} 
                                    className="border p-1 editable-content w-full" 
                                  />
                                ) : (
                                  <span>({sentence.correction})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.type === 'word-formation' && exercise.sentences && (
                  <div>
                    <div className="space-y-0.5">
                      {exercise.sentences.map((sentence, sIndex) => (
                        <div key={sIndex} className="border-b pb-1">
                          <div className="flex flex-row items-start">
                            <div className="flex-grow">
                              <p className="leading-snug">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.text} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)} 
                                    className="w-full border p-1 editable-content" 
                                  />
                                ) : (
                                  <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                                )}
                              </p>
                            </div>
                            {viewMode === 'teacher' && (
                              <div className="text-green-600 italic ml-3 text-sm">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.answer} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'answer', e.target.value)} 
                                    className="border p-1 editable-content w-full" 
                                  />
                                ) : (
                                  <span>({sentence.answer})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.type === 'word-order' && exercise.sentences && (
                  <div>
                    <div className="space-y-0.5">
                      {exercise.sentences.map((sentence, sIndex) => (
                        <div key={sIndex} className="border-b pb-1">
                          <div className="flex flex-row items-start">
                            <div className="flex-grow">
                              <p className="leading-snug">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.text} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'text', e.target.value)} 
                                    className="w-full border p-1 editable-content" 
                                  />
                                ) : (
                                  <>{sIndex + 1}. {sentence.text}</>
                                )}
                              </p>
                            </div>
                            {viewMode === 'teacher' && (
                              <div className="text-green-600 italic ml-3 text-sm">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={sentence.answer} 
                                    onChange={e => handleSentenceChange(index, sIndex, 'answer', e.target.value)} 
                                    className="border p-1 editable-content w-full" 
                                  />
                                ) : (
                                  <span>({sentence.answer})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === 'teacher' && (
                  <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md teacher-tip">
                    <p className="font-medium mb-1 text-gray-700">Teacher's Tip:</p>
                    <p className="text-gray-600 text-sm">
                      {isEditing ? (
                        <textarea 
                          value={exercise.teacher_tip} 
                          onChange={e => handleTeacherTipChange(index, e.target.value)} 
                          className="w-full border p-2 editable-content h-16" 
                        />
                      ) : exercise.teacher_tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Vocabulary sheet display */}
          {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
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
                <p className="font-medium mb-4">Learn and practice these key vocabulary terms related to the topic.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editableWorksheet.vocabulary_sheet.map((item, index) => (
                    <div key={index} className="border rounded-md p-4 vocabulary-card">
                      <p className="font-semibold text-worksheet-purple">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={item.term} 
                            onChange={e => {
                              const updatedVocab = [...editableWorksheet.vocabulary_sheet];
                              updatedVocab[index] = {
                                ...updatedVocab[index],
                                term: e.target.value
                              };
                              setEditableWorksheet({
                                ...editableWorksheet,
                                vocabulary_sheet: updatedVocab
                              });
                            }} 
                            className="w-full border p-1 editable-content" 
                          />
                        ) : item.term}
                      </p>
                      
                      {viewMode === 'teacher' ? (
                        <p className="text-sm text-gray-600 mt-2">
                          {isEditing ? (
                            <textarea 
                              value={item.meaning} 
                              onChange={e => {
                                const updatedVocab = [...editableWorksheet.vocabulary_sheet];
                                updatedVocab[index] = {
                                  ...updatedVocab[index],
                                  meaning: e.target.value
                                };
                                setEditableWorksheet({
                                  ...editableWorksheet,
                                  vocabulary_sheet: updatedVocab
                                });
                              }} 
                              className="w-full border p-1 editable-content h-12" 
                            />
                          ) : item.meaning}
                        </p>
                      ) : (
                        <>
                          <span className="vocabulary-definition-label">Definition:</span>
                          <span className="text-sm text-gray-500">_____________________</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rating section */}
          <div className="rating-section mb-4">
            <h2>How would you rate this worksheet?</h2>
            <p>Your feedback helps us improve our AI-generated worksheets</p>
            <div className="rating-stars mb-4">
              {[1, 2, 3, 4, 5].map(value => (
                <button 
                  key={value}
                  onClick={() => setRating(value)}
                  className={`
                    p-2 h-10 w-10 rounded-full flex items-center justify-center transition-colors
                    ${rating >= value ? 'bg-worksheet-purple text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
                  `}
                >
                  {value}
                </button>
              ))}
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Share your feedback or suggestions:
              </label>
              <Textarea 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="What did you like or what could be improved?"
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={handleSubmitRating} 
              className="bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              Submit Feedback
            </Button>
          </div>
          
          {/* Teacher notes section */}
          <div className="teacher-notes">
            <h3>Tips for teachers</h3>
            <ul>
              <li>This worksheet is a general template you can customize for your student.</li>
              <li>Verify the industry-specific terminology for accuracy.</li>
              <li>Adjust the difficulty level as needed for your student.</li>
              <li>Consider adding more visual elements for visual learners.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
