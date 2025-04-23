
import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import Sidebar from "@/components/Sidebar";
import GeneratingModal from "@/components/GeneratingModal";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherTipBox from "@/components/TeacherTipBox";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet, submitWorksheetFeedback, trackEvent } from "@/services/worksheetService";
import { v4 as uuidv4 } from 'uuid';
import { Worksheet } from "@/types/worksheet";

// Helper function to parse HTML content and convert it to a worksheet object
function parseHtmlToWorksheet(html: string): Worksheet {
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
      
      // Basic exercise structure
      const exercise: any = {
        type: exerciseType,
        title: title,
        icon: 'fa-book-open',
        time: 8,
        instructions: instructions,
        teacher_tip: teacherTip
      };
      
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
    vocabulary_sheet: vocabularyTerms.length > 0 ? vocabularyTerms : undefined
  };
}

export default function Index() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<Worksheet | null>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const { toast } = useToast();
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const { userId, loading: authLoading } = useAnonymousAuth();
  const [htmlContent, setHtmlContent] = useState<string>('');

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
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setInputParams(data);
    setIsGenerating(true);
    
    // Set some metrics for UI
    setGenerationTime(Math.floor(Math.random() * (65 - 31) + 31));
    setSourceCount(Math.floor(Math.random() * (90 - 50) + 50));
    
    try {
      // Get the generated HTML content from OpenAI via the edge function
      const html = await generateWorksheet(data, userId);
      setHtmlContent(html);
      
      // Parse the HTML content into a worksheet object
      const worksheet = parseHtmlToWorksheet(html);
      console.log('Parsed worksheet:', worksheet);
      
      // Generate a UUID for tracking
      const tempId = uuidv4();
      setWorksheetId(tempId);
      
      // Set the generated worksheet
      setGeneratedWorksheet(worksheet);
      
      toast({
        title: "Worksheet generated successfully!",
        description: "Your custom worksheet is now ready to use.",
        className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
      });
    } catch (error) {
      console.error("Worksheet generation error:", error);
      toast({
        title: "Worksheet generation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
    setHtmlContent('');
  };

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    if (!userId || !worksheetId) {
      toast({
        title: "Feedback submission error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitWorksheetFeedback(worksheetId, rating, feedback, userId);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service."
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Feedback submission failed",
        description: "We couldn't submit your feedback. Please try again later.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (userId && worksheetId && generatedWorksheet) {
      trackEvent('view', worksheetId, userId);
    }
  }, [userId, worksheetId, generatedWorksheet]);

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
        <div className="container mx-auto flex main-container">
          <div className="w-1/5 mx-0 py-[48px]">
            <Sidebar />
          </div>
          <div className="w-4/5 px-6 py-6 form-container">
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
          <WorksheetRating onSubmitRating={handleFeedbackSubmit} />
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
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
}
