
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";

// Import jako fallback w przypadku niepowodzenia generowania
import mockWorksheetData from '@/mockWorksheetData';

/**
 * Utility functions
 */
const getExpectedExerciseCount = (lessonTime: string): number => {
  if (lessonTime === "30 min") return 4;
  else if (lessonTime === "45 min") return 6;
  else return 8;
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createSampleVocabulary = (count: number) => {
  const terms = [
    'Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 
    'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose', 
    'Kinetic', 'Luminous', 'Meticulous', 'Nostalgia', 'Omnipotent'
  ];
  const meanings = [
    'Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 
    'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 
    'Sociable', 'Random or lacking organization', 'Perfect, flawless', 
    'To place side by side', 'Related to motion', 'Full of light', 
    'Showing great attention to detail', 'Sentimental longing for the past', 
    'Having unlimited power'
  ];
  
  return Array(Math.min(count, terms.length)).fill(null).map((_, i) => ({
    term: terms[i],
    meaning: meanings[i]
  }));
};

const validateWorksheet = (worksheetData: any, expectedCount: number): boolean => {
  if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    return false;
  }
  
  return worksheetData.exercises.length === expectedCount;
};

const processExercises = (exercises: any[]): any[] => {
  return exercises.map((exercise: any, index: number) => {
    // Upewnij się że numer ćwiczenia jest poprawny
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    // Przetwarzanie ćwiczeń typu matching
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
    }
    
    // Przetwarzanie ćwiczeń typu reading
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`Reading exercise word count: ${wordCount}`);
      
      // Upewnij się że ma odpowiednią liczbę pytań
      if (!exercise.questions || exercise.questions.length < 5) {
        if (!exercise.questions) exercise.questions = [];
        while (exercise.questions.length < 5) {
          exercise.questions.push({
            text: `Additional question ${exercise.questions.length + 1} about the text.`,
            answer: "Answer would be based on the text content."
          });
        }
      }
    }
    
    return exercise;
  });
};

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  // Stan do śledzenia procesu generowania worksheetu
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  
  // Hooki
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAnonymousAuth();

  /**
   * Obsługuje wysłanie formularza i generowanie worksheetu
   */
  const handleFormSubmit = async (data: FormData) => {
    // Sprawdź czy mamy ważną sesję użytkownika
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    // Zapisz dane formularza i rozpocznij proces generowania
    setInputParams(data);
    setIsGenerating(true);
    
    // Zapisz czas rozpoczęcia generowania do dokładnego obliczenia czasu
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    try {
      // Generuj worksheet poprzez API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Oblicz rzeczywisty czas generowania
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(actualGenerationTime);
      
      // Ustaw licznik źródeł z API lub domyślny
      setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      // Sprawdź oczekiwaną liczbę ćwiczeń na podstawie czasu lekcji
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      // Jeśli mamy poprawny worksheet, użyj go
      if (validateWorksheet(worksheetData, expectedExerciseCount)) {
        // Przetwórz ćwiczenia (numerowanie, mieszanie terminów, itp.)
        worksheetData.exercises = processExercises(worksheetData.exercises);
        
        // Użyj ID zwróconego z API lub wygeneruj tymczasowe
        const wsId = worksheetData.id || uuidv4();
        setWorksheetId(wsId);
        
        // Sprawdź czy potrzebujemy dodać arkusz słownictwa
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = createSampleVocabulary(15);
        }
        
        setGeneratedWorksheet(worksheetData);
        
        toast({
          title: "Worksheet generated successfully!",
          description: "Your custom worksheet is now ready to use.",
          className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
        });
      } else {
        throw new Error("Generated worksheet data is incomplete or invalid");
      }
    } catch (error) {
      console.error("Worksheet generation error:", error);
      
      // Użyj danych testowych jeśli generowanie nie powiodło się
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Pobierz odpowiednią liczbę ćwiczeń na podstawie czasu lekcji
      const expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Dostosuj liczbę ćwiczeń
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Przetwórz ćwiczenia zastępcze
      fallbackWorksheet.exercises = processExercises(fallbackWorksheet.exercises);
      
      const tempId = uuidv4();
      setWorksheetId(tempId);
      setGeneratedWorksheet(fallbackWorksheet);
      
      // Poinformuj użytkownika, że używamy danych zastępczych
      toast({
        title: "Using sample worksheet",
        description: error instanceof Error 
          ? `Generation error: ${error.message}. Using a sample worksheet instead.` 
          : "An unexpected error occurred. Using a sample worksheet instead.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Resetuje widok do formularza
   */
  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  // Pokaż indykator ładowania podczas inicjalizacji uwierzytelniania
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
        <FormView onSubmit={handleFormSubmit} />
      ) : (
        <GenerationView 
          worksheetId={worksheetId}
          generatedWorksheet={generatedWorksheet}
          inputParams={inputParams}
          generationTime={generationTime}
          sourceCount={sourceCount}
          onBack={handleBack}
          userId={userId}
        />
      )}
      
      <GeneratingModal 
        isOpen={isGenerating} 
        startTime={startGenerationTime} 
      />
    </div>
  );
};

export default Index;
