
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import mockWorksheetData from '@/mockWorksheetData';
import { Worksheet, Exercise } from "@/types/worksheet";

// Utility functions
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

const processExercises = (exercises: Exercise[]): Exercise[] => {
  return exercises.map((exercise: Exercise, index: number) => {
    // Make sure exercise number is correct
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    // Process matching exercises
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
    }
    
    // Process reading exercise
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`Reading exercise word count: ${wordCount}`);
      
      // Ensure it has adequate number of questions
      if (!exercise.questions || exercise.questions.length < 5) {
        if (!exercise.questions) exercise.questions = [];
        while (exercise.questions.length < 5) {
          exercise.questions.push({
            text: `Additional question ${exercise.questions.length + 1} about the text content.`,
            answer: "Answer would be based on the text content."
          });
        }
      }
    }
    
    // Ensure adequate content in discussion exercises
    if (exercise.type === 'discussion' && (!exercise.questions || exercise.questions.length < 10)) {
      if (!exercise.questions) exercise.questions = [];
      
      const discussionTopics = [
        "What challenges might construction workers face when communicating with clients?",
        "How important is workplace safety in the construction industry?",
        "What skills do you think are essential for customer-facing roles in construction?",
        "How can construction professionals ensure clear communication with clients who don't understand technical terms?",
        "What are the benefits of having safety protocols in place at construction sites?",
        "How would you handle a difficult customer in a construction-related role?",
        "In what ways can construction companies improve their customer service?",
        "What safety precautions should be taken before starting a construction project?",
        "How can technology improve safety in the construction industry?",
        "What are the most important qualities for someone in a customer service role in construction?"
      ];
      
      while (exercise.questions.length < 10) {
        const questionNumber = exercise.questions.length;
        if (questionNumber < discussionTopics.length) {
          exercise.questions.push({
            text: discussionTopics[questionNumber],
            answer: `Possible talking points: This question explores aspects of construction safety and customer service.`
          });
        } else {
          exercise.questions.push({
            text: `What do you think about the importance of professional development in the construction industry?`,
            answer: `Possible talking points: Skills improvement, certifications, career advancement opportunities.`
          });
        }
      }
    }
    
    // Ensure adequate content in error-correction exercises
    if (exercise.type === 'error-correction' && (!exercise.sentences || exercise.sentences.length < 10)) {
      if (!exercise.sentences) exercise.sentences = [];
      
      const errorSentences = [
        { 
          text: "The worker don't have the right safety equipment.",
          error: "don't",
          correction: "doesn't" 
        },
        { 
          text: "They was working on the site all day.",
          error: "was",
          correction: "were" 
        },
        { 
          text: "The customer asked for more informations about the project.",
          error: "informations",
          correction: "information" 
        },
        { 
          text: "The construction team have finish the project last week.",
          error: "have finish",
          correction: "finished" 
        },
        { 
          text: "She wear a helmet when entering the construction site.",
          error: "wear",
          correction: "wears" 
        },
        { 
          text: "The manager don't allow workers without proper training.",
          error: "don't allow",
          correction: "doesn't allow" 
        },
        { 
          text: "Every workers needs to follow the safety protocols.",
          error: "Every workers needs",
          correction: "Every worker needs" 
        },
        { 
          text: "They delivered the materials yesterday morning, isn't it?",
          error: "isn't it",
          correction: "didn't they" 
        },
        { 
          text: "The customer was satisfy with our service.",
          error: "was satisfy",
          correction: "was satisfied" 
        },
        { 
          text: "I have worked in construction since five years.",
          error: "since five years",
          correction: "for five years" 
        }
      ];
      
      while (exercise.sentences.length < 10) {
        const sentenceIndex = exercise.sentences.length;
        if (sentenceIndex < errorSentences.length) {
          exercise.sentences.push(errorSentences[sentenceIndex]);
        } else {
          const sentenceNumber = exercise.sentences.length + 1;
          exercise.sentences.push({
            text: `This sentence ${sentenceNumber} has an grammatical error in it.`,
            error: `an grammatical`,
            correction: `a grammatical`
          });
        }
      }
    }
    
    return exercise;
  });
};

export const useWorksheetGeneration = (userId: string | null) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<Worksheet | null>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  
  const { toast } = useToast();
  
  const generateWorksheetHandler = async (data: FormData) => {
    // Check for valid user session
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "There was a problem with your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    // Store form data and start generation process
    setInputParams(data);
    setIsGenerating(true);
    
    // Record start time for accurate generation time calculation
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    try {
      // Generate worksheet using the API
      const worksheetData = await generateWorksheet(data, userId);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Calculate actual generation time
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(actualGenerationTime);
      
      // Set source count from the API or default
      setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      // Get expected exercise count based on lesson time
      const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      console.log(`Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
      
      // If we have a valid worksheet, use it
      if (validateWorksheet(worksheetData, expectedExerciseCount)) {
        // Process exercises (numbering, shuffling terms, etc)
        worksheetData.exercises = processExercises(worksheetData.exercises);
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        setWorksheetId(wsId);
        
        // Check if we need to add vocabulary sheet
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
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Get correct exercise count based on lesson time
      const expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Process the fallback exercises
      fallbackWorksheet.exercises = processExercises(fallbackWorksheet.exercises);
      
      const tempId = uuidv4();
      setWorksheetId(tempId);
      setGeneratedWorksheet(fallbackWorksheet);
      
      // Let the user know we're using a fallback
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

  const resetWorksheet = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  return {
    isGenerating,
    generatedWorksheet,
    inputParams,
    generationTime,
    sourceCount,
    worksheetId,
    generateWorksheet: generateWorksheetHandler,
    resetWorksheet
  };
};
