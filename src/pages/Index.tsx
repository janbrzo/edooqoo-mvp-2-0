
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";

// Import just as a fallback in case generation fails
import mockWorksheetData from '@/mockWorksheetData';

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  // State for tracking worksheet generation process
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  
  // Hooks
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAnonymousAuth();

  /**
   * Handles form submission and worksheet generation
   */
  const handleFormSubmit = async (data: FormData) => {
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
      // Ustalamy oczekiwaną liczbę zadań na podstawie czasu trwania lekcji
      let expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
      
      // Generate worksheet using the API - przekazujemy oczekiwaną liczbę zadań
      const worksheetData = await generateWorksheet(data, userId, expectedExerciseCount);
      
      console.log("Generated worksheet data:", worksheetData);
      
      // Calculate actual generation time
      const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(actualGenerationTime);
      
      // Set source count from the API or default
      setSourceCount(worksheetData.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
      
      // If we have a valid worksheet, use it
      if (worksheetData && worksheetData.exercises && worksheetData.title) {
        // Handle shuffling for matching exercises
        worksheetData.exercises.forEach((exercise: any) => {
          if (exercise.type === "matching" && exercise.items) {
            exercise.originalItems = [...exercise.items];
            exercise.shuffledTerms = shuffleArray([...exercise.items]);
          }
        });
        
        // Use the ID returned from the API or generate a temporary one
        const wsId = worksheetData.id || uuidv4();
        setWorksheetId(wsId);
        
        // Log exercise count to verify
        console.log(`Generated worksheet with ${worksheetData.exercises.length} exercises`);
        
        // Ensure exercise count matches lesson time
        if (worksheetData.exercises.length < expectedExerciseCount) {
          console.warn(`Expected ${expectedExerciseCount} exercises but got ${worksheetData.exercises.length}`);
          // Add placeholder exercises to match expected count
          while (worksheetData.exercises.length < expectedExerciseCount) {
            const exerciseIndex = worksheetData.exercises.length + 1;
            const newExercise = createPlaceholderExercise(exerciseIndex);
            worksheetData.exercises.push(newExercise);
          }
        } else if (worksheetData.exercises.length > expectedExerciseCount) {
          // Trim extra exercises
          worksheetData.exercises = worksheetData.exercises.slice(0, expectedExerciseCount);
        }
        
        // Weryfikacja i uzupełnienie wszystkich ćwiczeń
        worksheetData.exercises = worksheetData.exercises.map((exercise: any, index: number) => {
          // Sprawdź, czy to ćwiczenie reading i czy ma odpowiednią ilość słów
          if (exercise.type === 'reading' && exercise.content) {
            const wordCount = exercise.content.split(/\s+/).length;
            
            if (wordCount < 280) {
              console.log(`Ćwiczenie reading ma tylko ${wordCount} słów, uzupełniamy do 280-320 słów`);
              
              // Uzupełnij tekst reading do wymogów
              const additionalText = getFillerText(280 - wordCount);
              exercise.content = exercise.content + " " + additionalText;
              
              // Sprawdź nową liczbę słów po uzupełnieniu
              const newWordCount = exercise.content.split(/\s+/).length;
              console.log(`Nowa liczba słów w ćwiczeniu reading: ${newWordCount}`);
            }
          }
          
          // Sprawdź, czy ćwiczenie ma pytania/elementy jeśli powinno je mieć
          if ((exercise.type === 'multiple-choice' || exercise.type === 'reading') && (!exercise.questions || exercise.questions.length === 0)) {
            exercise.questions = createSampleQuestions(exercise.type, 5);
          } else if (exercise.type === 'matching' && (!exercise.items || exercise.items.length === 0)) {
            exercise.items = createSampleItems(10);
          } else if (exercise.type === 'fill-in-blanks' && (!exercise.sentences || exercise.sentences.length === 0)) {
            exercise.sentences = createSampleSentences(10);
            exercise.word_bank = ['book', 'pen', 'computer', 'desk', 'teacher', 'student', 'school', 'classroom', 'language', 'learning'];
          } else if (exercise.type === 'dialogue' && (!exercise.dialogue || exercise.dialogue.length === 0)) {
            exercise.dialogue = createSampleDialogue(10);
            exercise.expressions = ["Nice to meet you", "How are you?", "See you later", "Thank you", "You're welcome", 
                                  "Could you help me?", "I don't understand", "Can you repeat that?", "What does that mean?", "Let me try"];
            exercise.expression_instruction = 'Practice using these expressions from the dialogue';
          } else if (exercise.type === 'writing-prompt' && (!exercise.prompts || exercise.prompts.length === 0)) {
            exercise.prompts = [
              "Describe how cultural differences affect business communication.",
              "Explain the importance of understanding cultural nuances in international negotiations.",
              "Write about a time when a cultural misunderstanding affected a business interaction.",
              "Discuss how companies can improve cross-cultural communication.",
              "Explain how technology has changed the way we navigate cultural differences in business."
            ];
          } else if (exercise.type === 'case-study' && (!exercise.content || exercise.content.trim() === '')) {
            exercise.content = "A multinational company faced challenges when expanding into a new market due to cultural differences. The marketing team created an advertising campaign that was considered offensive by the local population. This led to public backlash and declining sales in the region. The company needed to quickly address the situation to maintain their reputation and market position.";
            exercise.questions = [
              {text: "Identify the main cultural issue in this case.", answer: "Failure to understand local cultural sensitivities in marketing."},
              {text: "What immediate steps should the company take?", answer: "Issue an apology, withdraw the campaign, engage with local cultural consultants."},
              {text: "How could this situation have been prevented?", answer: "By conducting cultural research and involving local experts in the planning phase."},
              {text: "What long-term strategies should the company implement?", answer: "Create a cross-cultural communication policy, provide cultural training to staff."},
              {text: "How might this affect the company's future expansion plans?", answer: "They may need to slow expansion to focus on building better cultural understanding processes."}
            ];
          } else if (exercise.type === 'role-play' && (!exercise.content || exercise.content.trim() === '')) {
            exercise.content = "Practice the following role-play scenarios with a partner. Focus on using appropriate language and considering cultural differences in each situation.";
            exercise.scenarios = [
              {description: "You are a manager explaining to a team member from a different culture why their presentation style needs to change for local clients."},
              {description: "You are negotiating a business deal with a partner from a culture where direct refusals are considered impolite."},
              {description: "You need to give feedback to a colleague from a culture where criticism is typically delivered very indirectly."}
            ];
          }
          
          // Upewnij się, że każde ćwiczenie ma wskazówkę dla nauczyciela
          if (!exercise.teacher_tip) {
            exercise.teacher_tip = `Teacher's tip for Exercise ${index + 1}: Help students understand the task and give them time to complete it.`;
          }
          
          return exercise;
        });
        
        // Check if we need to add vocabulary sheet
        if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
          worksheetData.vocabulary_sheet = createSampleVocabulary(8);
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
      
      // Określamy oczekiwaną liczbę zadań na podstawie czasu trwania lekcji
      let expectedExerciseCount = getExpectedExerciseCount(data?.lessonTime || '60 min');
      
      // Fallback to mock data if generation fails
      const fallbackWorksheet = JSON.parse(JSON.stringify(mockWorksheetData));
      
      // Adjust mock exercises to match expected count
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.slice(0, expectedExerciseCount);
      
      // Ensure we have enough exercises
      while (fallbackWorksheet.exercises.length < expectedExerciseCount) {
        const exerciseIndex = fallbackWorksheet.exercises.length + 1;
        fallbackWorksheet.exercises.push(createPlaceholderExercise(exerciseIndex));
      }
      
      // Weryfikacja i uzupełnienie wszystkich ćwiczeń dla mockowych danych
      fallbackWorksheet.exercises = fallbackWorksheet.exercises.map((exercise: any, index: number) => {
        // Process matching exercises
        if (exercise.type === "matching" && exercise.items) {
          exercise.originalItems = [...exercise.items];
          exercise.shuffledTerms = shuffleArray([...exercise.items]);
        }
        
        // Sprawdź, czy to ćwiczenie reading i czy ma odpowiednią ilość słów
        if (exercise.type === "reading" && exercise.content) {
          const wordCount = exercise.content.split(/\s+/).length;
          console.log(`Fallback reading exercise word count: ${wordCount}`);
          
          if (wordCount < 280) {
            // Uzupełnij tekst do minimum 280 słów
            const additionalWordsNeeded = 280 - wordCount;
            const additionalContent = getFillerText(additionalWordsNeeded);
            exercise.content += " " + additionalContent;
            console.log(`Padded reading exercise to ${exercise.content.split(/\s+/).length} words`);
          }
        }
        
        return exercise;
      });
      
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

  // Funkcja pomocnicza do generowania tekstu wypełniającego określonej długości
  const getFillerText = (wordCount: number): string => {
    const fillerSentences = [
      "Learning a foreign language requires consistent practice and dedication.",
      "Students should focus on both speaking and listening skills to improve overall fluency.",
      "Regular vocabulary review helps to reinforce new words and phrases.",
      "Grammar exercises are important for building proper sentence structures.",
      "Reading comprehension improves with exposure to diverse texts and topics.",
      "Practicing writing helps students organize their thoughts in the target language.",
      "Cultural understanding enhances language learning and contextual usage.",
      "Listening to native speakers helps with pronunciation and intonation.",
      "Group activities encourage students to use the language in realistic scenarios.",
      "Technology can be a valuable tool for interactive language learning.",
      "Language games make the learning process more engaging and enjoyable.",
      "Watching films in the target language improves listening comprehension.",
      "Translation exercises help students understand nuances between languages.",
      "Language immersion accelerates the learning process significantly.",
      "Setting achievable goals motivates students to continue their language journey.",
    ];
    
    let resultText = "";
    let currentWordCount = 0;
    
    while (currentWordCount < wordCount) {
      const randomSentence = fillerSentences[Math.floor(Math.random() * fillerSentences.length)];
      resultText += " " + randomSentence;
      currentWordCount += randomSentence.split(/\s+/).length;
    }
    
    return resultText.trim();
  };

  /**
   * Funkcje do tworzenia przykładowych elementów zadań
   */
  const createSampleQuestions = (exerciseType: string, count: number) => {
    if (exerciseType === 'multiple-choice') {
      return Array(count).fill(null).map((_, i) => ({
        text: `Question ${i + 1}: Choose the correct option.`,
        options: [
          { label: "A", text: "Option A", correct: i % 4 === 0 },
          { label: "B", text: "Option B", correct: i % 4 === 1 },
          { label: "C", text: "Option C", correct: i % 4 === 2 },
          { label: "D", text: "Option D", correct: i % 4 === 3 }
        ]
      }));
    } else {
      // For reading comprehension
      return Array(count).fill(null).map((_, i) => ({
        text: `Question ${i + 1}: Answer based on the text above.`,
        answer: `Sample answer for question ${i + 1}.`
      }));
    }
  };
  
  const createSampleItems = (count: number) => {
    const terms = ['Apple', 'Book', 'Car', 'Dog', 'Earth', 'Family', 'Game', 'House', 'Internet', 'Job'];
    const definitions = ['A fruit', 'A reading material', 'A vehicle', 'A pet animal', 'Our planet', 'A group of related people', 'An activity for fun', 'A place to live', 'Global network', 'Work for money'];
    
    return Array(count).fill(null).map((_, i) => ({
      term: terms[i % terms.length],
      definition: definitions[i % definitions.length]
    }));
  };
  
  const createSampleSentences = (count: number) => {
    return Array(count).fill(null).map((_, i) => ({
      text: `This is the ${i + 1}th sample sentence with a ___ in it.`,
      answer: `sample word ${i + 1}`
    }));
  };
  
  const createSampleDialogue = (count: number) => {
    return Array(count).fill(null).map((_, i) => ({
      speaker: i % 2 === 0 ? 'Person A' : 'Person B',
      text: `This is line ${i + 1} of the sample dialogue.`
    }));
  };
  
  const createSampleVocabulary = (count: number) => {
    const terms = ['Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose'];
    const meanings = ['Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 'Sociable', 'Random or lacking organization', 'Perfect, flawless', 'To place side by side'];
    
    return Array(count).fill(null).map((_, i) => ({
      term: terms[i % terms.length],
      meaning: meanings[i % meanings.length]
    }));
  };

  /**
   * Resets the view to the form
   */
  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
    setWorksheetId(null);
  };

  /**
   * Create a placeholder exercise for when we need to pad exercise count
   */
  const createPlaceholderExercise = (index: number) => {
    // Utwórz różne typy ćwiczeń aby zapewnić różnorodność
    const exerciseTypes = [
      'multiple-choice',
      'fill-in-blanks',
      'matching',
      'reading',
      'dialogue',
      'discussion',
      'writing-prompt',
      'case-study',
      'role-play'
    ];
    
    const selectedType = exerciseTypes[index % exerciseTypes.length];
    
    // Poprawnie formatuj tytuł zadania, zawsze dodając numer Exercise
    let exercise: any = {
      type: selectedType,
      title: `Exercise ${index}: ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1).replace('-', ' ')}`,
      icon: getIconForType(selectedType),
      time: 5 + (index % 5),
      instructions: `Instructions for the ${selectedType} exercise. Complete the task according to the examples.`,
      teacher_tip: `Teacher's tip: Guide students through this ${selectedType} exercise and provide support as needed.`
    };
    
    // Dodaj specyficzne pola w zależności od typu
    switch(selectedType) {
      case 'multiple-choice':
        exercise.questions = createSampleQuestions('multiple-choice', 5);
        break;
      case 'reading':
        exercise.content = getFillerText(280); // Zapewniamy minimum 280 słów dla tekstu
        exercise.questions = createSampleQuestions('reading', 5);
        break;
      case 'matching':
        exercise.items = createSampleItems(10); // Zapewniamy dokładnie 10 elementów do dopasowania
        break;
      case 'fill-in-blanks':
        exercise.sentences = createSampleSentences(10); // Zapewniamy dokładnie 10 zdań
        exercise.word_bank = ['book', 'pen', 'computer', 'desk', 'teacher', 'student', 'school', 'classroom', 'language', 'learning'];
        break;
      case 'dialogue':
        exercise.dialogue = createSampleDialogue(10); // Zapewniamy minimum 10 wymian w dialogu
        exercise.expressions = ["Nice to meet you", "How are you?", "See you later", "Thank you", "You're welcome", 
                               "Could you help me?", "I don't understand", "Can you repeat that?", "What does that mean?", "Let me try"];
        exercise.expression_instruction = 'Practice using these expressions from the dialogue';
        break;
      case 'discussion':
        exercise.questions = [
          'What do you think about this topic?',
          'Have you ever experienced something similar?',
          'How would you solve this problem?',
          'What are the advantages and disadvantages?',
          'What is your personal opinion?',
          'Can you share an example from your own experience?',
          'How does this compare to other similar situations?',
          'What would be the best approach in this scenario?',
          'What are potential challenges one might face?',
          'How would you explain this concept to someone else?'
        ];
        break;
      case 'writing-prompt':
        exercise.prompts = [
          "Describe how cultural differences affect business communication.",
          "Explain the importance of understanding cultural nuances in international negotiations.",
          "Write about a time when a cultural misunderstanding affected a business interaction.",
          "Discuss how companies can improve cross-cultural communication.",
          "Explain how technology has changed the way we navigate cultural differences in business."
        ];
        break;
      case 'case-study':
        exercise.content = "A multinational company faced challenges when expanding into a new market due to cultural differences. The marketing team created an advertising campaign that was considered offensive by the local population. This led to public backlash and declining sales in the region. The company needed to quickly address the situation to maintain their reputation and market position.";
        exercise.questions = [
          {text: "Identify the main cultural issue in this case.", answer: "Failure to understand local cultural sensitivities in marketing."},
          {text: "What immediate steps should the company take?", answer: "Issue an apology, withdraw the campaign, engage with local cultural consultants."},
          {text: "How could this situation have been prevented?", answer: "By conducting cultural research and involving local experts in the planning phase."},
          {text: "What long-term strategies should the company implement?", answer: "Create a cross-cultural communication policy, provide cultural training to staff."},
          {text: "How might this affect the company's future expansion plans?", answer: "They may need to slow expansion to focus on building better cultural understanding processes."}
        ];
        break;
      case 'role-play':
        exercise.content = "Practice the following role-play scenarios with a partner. Focus on using appropriate language and considering cultural differences in each situation.";
        exercise.scenarios = [
          {description: "You are a manager explaining to a team member from a different culture why their presentation style needs to change for local clients."},
          {description: "You are negotiating a business deal with a partner from a culture where direct refusals are considered impolite."},
          {description: "You need to give feedback to a colleague from a culture where criticism is typically delivered very indirectly."}
        ];
        break;
      default:
        // Domyślna konfiguracja - upewnij się, że zawsze mamy jakąś zawartość
        exercise.questions = createSampleQuestions('multiple-choice', 5);
    }
    
    return exercise;
  };
  
  // Pomocnicza funkcja do przypisywania ikon
  const getIconForType = (type: string): string => {
    const iconMap: {[key: string]: string} = {
      'multiple-choice': 'fa-check-square',
      'reading': 'fa-book-open',
      'matching': 'fa-random',
      'fill-in-blanks': 'fa-pencil-alt',
      'dialogue': 'fa-comments',
      'discussion': 'fa-users',
      'error-correction': 'fa-exclamation-triangle',
      'word-formation': 'fa-font',
      'word-order': 'fa-sort',
      'writing-prompt': 'fa-pen-fancy',
      'case-study': 'fa-search',
      'role-play': 'fa-theater-masks'
    };
    
    return iconMap[type] || 'fa-tasks';
  };

  /**
   * Get expected exercise count based on lesson time
   */
  const getExpectedExerciseCount = (lessonTime: string): number => {
    if (lessonTime === "30 min") {
      return 4;  // 30 minutes = 4 exercises
    } else if (lessonTime === "45 min") {
      return 6;  // 45 minutes = 6 exercises
    } else {
      return 8;  // 60 minutes = 8 exercises
    }
  };

  // Show loading indicator while auth is initializing
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
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default Index;
