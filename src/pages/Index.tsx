
import React, { useState, useEffect } from "react";
import { FormData } from "@/components/WorksheetForm";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import WorksheetGeneration from "@/components/pages/Index/WorksheetGeneration";
import WorksheetDisplayWrapper from "@/components/pages/Index/WorksheetDisplayWrapper";

export default function Index() {
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const { userId, loading: authLoading } = useAnonymousAuth();

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

  const handleWorksheetGenerated = (
    worksheet: any,
    params: FormData,
    time: number,
    sources: number,
    id: string
  ) => {
    setGeneratedWorksheet(worksheet);
    setInputParams(params);
    setGenerationTime(time);
    setSourceCount(sources);
    setWorksheetId(id);
  };

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!generatedWorksheet ? (
        <WorksheetGeneration 
          userId={userId} 
          onWorksheetGenerated={handleWorksheetGenerated} 
        />
      ) : (
        <WorksheetDisplayWrapper
          worksheet={generatedWorksheet}
          inputParams={inputParams}
          generationTime={generationTime}
          sourceCount={sourceCount}
          worksheetId={worksheetId}
          userId={userId}
          onBack={handleBack}
          showScrollTop={showScrollTop}
          scrollToTop={scrollToTop}
        />
      )}
    </div>
  );
}
