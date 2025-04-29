import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import Sidebar from "@/components/Sidebar";
import GeneratingModal from "@/components/GeneratingModal";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet, submitWorksheetFeedback, trackEvent } from "@/services/worksheetService";
import { v4 as uuidv4 } from 'uuid';
import { Worksheet } from "@/types/worksheet";

// Helper function to parse HTML content and convert it to a worksheet object
function parseHtmlToWorksheet(html: string): Worksheet {
  try {
    if (!html || typeof html !== 'string' || html.trim() === '') {
      throw new Error('Empty HTML content provided');
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract basic worksheet info
    const title = doc.querySelector('h1, h2, .title, header h1')?.textContent || 'ESL Worksheet';
    const subtitle = doc.querySelector('h3, .subtitle')?.textContent || '';
    let introduction = '';
    const introElement = doc.querySelector('p, .introduction, header p');
    if (introElement) {
      introduction = introElement.textContent || '';
    }
    
    // Extract exercises
    const exercises = Array.from(doc.querySelectorAll('section, .exercise, div[class*="exercise"]'))
      .map((section, index) => {
        let exerciseType = 'reading';
        if (section.textContent?.toLowerCase().includes('vocabulary')) exerciseType = 'vocabulary';
        if (section.textContent?.toLowerCase().includes('matching')) exerciseType = 'matching';
        if (section.textContent?.toLowerCase().includes('fill in')) exerciseType = 'fill-in-blanks';
        if (section.textContent?.toLowerCase().includes('multiple choice')) exerciseType = 'multiple-choice';
        if (section.textContent?.toLowerCase().includes('dialogue') || section.textContent?.toLowerCase().includes('dialog')) exerciseType = 'dialogue';
        if (section.textContent?.toLowerCase().includes('discussion')) exerciseType = 'discussion';
        
        const titleElement = section.querySelector('h2, h3, h4, .title, strong');
        const title = titleElement?.textContent || `Exercise ${index + 1}`;
        
        const instructionsElement = section.querySelector('p, .instructions');
        const instructions = instructionsElement?.textContent || '';
        
        const teacherTipElement = section.querySelector('.teacher-tip, .tip, em, i');
        const teacherTip = teacherTipElement?.textContent || '';
        
        // Find content of the exercise
        let content = '';
        const contentElements = Array.from(section.querySelectorAll('p:not(:first-child), .content, div:not(.teacher-tip)'));
        if (contentElements.length > 0) {
          content = contentElements.map(el => el.textContent).join('\n\n');
        }
        
        // Extract questions if present
        let questions = [];
        const questionElements = section.querySelectorAll('ol li, ul li, .question');
        if (questionElements.length > 0) {
          questions = Array.from(questionElements).map(q => ({
            text: q.textContent || '',
            options: [],
            answer: ''
          }));
        }
        
        // Basic exercise structure
        const exercise: any = {
          type: exerciseType,
          title: title,
          icon: 'fa-book-open',
          time: 8,
          instructions: instructions,
          teacher_tip: teacherTip,
          content: content
        };
        
        if (questions.length > 0) {
          exercise.questions = questions;
        }
        
        return exercise;
      });
    
    // Create a vocabulary section if needed
    const vocabularyTerms = Array.from(doc.querySelectorAll('.vocabulary, .vocab, .glossary'))
      .map((vocab) => {
        const terms = Array.from(vocab.querySelectorAll('li, dt, .term'))
          .map((term) => {
            const termText = term.querySelector('strong, b, .term-text')?.textContent || term.textContent?.split(':')[0] || '';
            const meaningText = term.querySelector('span, .meaning')?.textContent || term.textContent?.split(':')[1] || '';
            return {
              term: termText.trim(),
              meaning: meaningText.trim()
            };
          });
        return terms;
      }).flat();
    
    // Create the worksheet object
    return {
      title,
      subtitle,
      introduction,
      exercises: exercises.length > 0 ? exercises : [{
        type: 'reading',
        title: 'Exercise 1',
        icon: 'fa-book-open',
        time: 8,
        instructions: 'Read the text and answer the questions.',
        teacher_tip: 'Encourage students to read for main ideas first before focusing on details.'
      }],
      vocabulary_sheet: vocabularyTerms.length > 0 ? vocabularyTerms : []
    };
  } catch (error) {
    console.error("Error parsing HTML to worksheet:", error);
    
    // Return a fallback worksheet if parsing fails
    return {
      title: "ESL Worksheet",
      subtitle: "Generated Worksheet",
      introduction: "There was an issue parsing the generated worksheet. Please try again.",
      exercises: [{
        type: 'reading',
        title: 'Exercise 1',
        icon: 'fa-book-open',
        time: 8,
        instructions: 'Read the text and answer the questions.',
        teacher_tip: 'Encourage students to read for main ideas first before focusing on details.',
        content: 'Content could not be generated correctly. Please try regenerating the worksheet.'
      }],
      vocabulary_sheet: []
    };
  }
}

export default function Index() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<Worksheet | null>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const { toast } = useToast();
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const { userId, loading: authLoading } = useAnonymousAuth();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleFormSubmit = async (data: FormData) => {
    if (!userId) {
      toast({
        title: "Błąd autoryzacji",
        description: "Wystąpił problem z Twoją sesją. Odśwież stronę i spróbuj ponownie.",
        variant: "destructive"
      });
      return;
    }

    setInputParams(data);
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);
    
    // Set some metrics for UI
    setGenerationTime(Math.floor(Math.random() * (65 - 31) + 31));
    setSourceCount(Math.floor(Math.random() * (90 - 50) + 50));
    
    // Set a timeout to handle cases where the fetch hangs
    const timeout = window.setTimeout(() => {
      setIsGenerating(false);
      setGenerationError("Generowanie trwało zbyt długo. Serwer może być przeciążony. Spróbuj ponownie za chwilę.");
      toast({
        title: "Przekroczono limit czasu",
        description: "Generowanie trwało zbyt długo. Serwer może być przeciążony. Spróbuj ponownie za chwilę.",
        variant: "destructive"
      });
    }, 40000); // 40 second timeout
    
    setTimeoutId(timeout);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 1000);
    
    try {
      // Get the generated HTML content from OpenAI via the edge function
      const html = await generateWorksheet(data, userId);
      
      // Clear the timeout and progress interval since we got a response
      clearInterval(progressInterval);
      if (timeoutId) window.clearTimeout(timeoutId);
      
      if (!html || typeof html !== 'string' || html.trim() === '') {
        throw new Error("Nie otrzymano zawartości od serwera. Spróbuj ponownie.");
      }
      
      setHtmlContent(html);
      setGenerationProgress(95);
      
      // Parse the HTML content into a worksheet object
      const worksheet = parseHtmlToWorksheet(html);
      console.log('Parsed worksheet:', worksheet);
      
      // Generate a UUID for tracking
      const tempId = uuidv4();
      setWorksheetId(tempId);
      
      // Set the generated worksheet
      setGenerationProgress(100);
      setGeneratedWorksheet(worksheet);
      
      toast({
        title: "Arkusz wygenerowany pomyślnie!",
        description: "Twój spersonalizowany arkusz jest gotowy do użycia.",
        className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
      });
    } catch (error: any) {
      console.error("Worksheet generation error:", error);
      
      // Clear the timeout and progress interval if we've already handled the error
      clearInterval(progressInterval);
      if (timeoutId) window.clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas generowania arkusza.";
      setGenerationError(errorMessage);
      
      toast({
        title: "Generowanie arkusza nie powiodło się",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      clearInterval(progressInterval);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
    setHtmlContent('');
    setGenerationError(null);
    setGenerationProgress(0);
  };

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (!userId || !worksheetId) {
      toast({
        title: "Błąd podczas wysyłania opinii",
        description: "Wystąpił problem z Twoją sesją. Odśwież stronę i spróbuj ponownie.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitWorksheetFeedback(worksheetId, rating, feedback, userId);
      
      toast({
        title: "Dziękujemy za Twoją opinię!",
        description: "Twoja ocena i komentarze pomagają nam ulepszać naszą usługę."
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Wysłanie opinii nie powiodło się",
        description: "Nie mogliśmy wysłać Twojej opinii. Spróbuj ponownie później.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      trackEvent('view', worksheetId, userId);
    }
    
    // Cleanup timeout when component unmounts or when generating state changes
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [userId, worksheetId, generatedWorksheet, timeoutId]);

  const handleDownloadEvent = () => {
    if (userId && worksheetId) {
      trackEvent('download', worksheetId, userId);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!generatedWorksheet ? (
        <div className="container mx-auto flex flex-col md:flex-row main-container">
          <div className="w-full md:w-1/5 mx-0 py-[48px]">
            <Sidebar />
          </div>
          <div className="w-full md:w-4/5 px-6 py-6 form-container">
            <WorksheetForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      ) : (
        <>
          <WorksheetDisplay 
            worksheet={generatedWorksheet} 
            inputParams={inputParams} 
            generationTime={generationTime} 
            sourceCount={sourceCount} 
            onBack={handleBack}
            onDownload={handleDownloadEvent}
          />
          {showScrollTop && (
            <button 
              onClick={scrollToTop} 
              className="fixed bottom-6 right-6 z-50 bg-worksheet-purple text-white p-3 rounded-full shadow-lg hover:bg-worksheet-purpleDark transition-colors" 
              aria-label="Scroll to top"
            >
              <ArrowUp size={24} />
            </button>
          )}
        </>
      )}
      
      <GeneratingModal 
        isOpen={isGenerating} 
        progress={generationProgress} 
        timeoutSeconds={40}
      />
      
      {/* Error display */}
      {generationError && !isGenerating && !generatedWorksheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] max-w-[90vw] space-y-6">
            <h2 className="text-2xl font-semibold text-center text-red-500">Wystąpił błąd</h2>
            <p className="text-center">{generationError}</p>
            <div className="flex justify-center">
              <button 
                onClick={handleBack} 
                className="bg-worksheet-purple text-white px-4 py-2 rounded hover:bg-worksheet-purpleDark transition-colors"
              >
                Wróć do formularza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
