import { shuffleArray, createSampleVocabulary } from "./worksheetUtils";

export const processExercises = (exercises: any[]): any[] => {
  console.log('🔧 Processing exercises - Starting with:', exercises.length, 'exercises');
  
  const processedExercises = exercises.map((exercise: any, index: number) => {
    console.log(`🔧 Processing exercise ${index + 1}: ${exercise.type}`);
    
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
      console.log(`🔧 Processed matching exercise with ${exercise.items.length} items`);
    }
    
    // SIMPLIFIED: Fix multiple choice questions to avoid duplicates
    if (exercise.type === "multiple-choice" && exercise.questions) {
      exercise.questions = exercise.questions.map((question: any) => {
        if (question.options && question.options.length >= 2) {
          console.log('🔧 Processing multiple choice question options');
          
          // Get all unique option texts
          const uniqueTexts = new Set();
          const uniqueOptions = [];
          
          // First, collect all unique options
          question.options.forEach((opt: any) => {
            if (!uniqueTexts.has(opt.text)) {
              uniqueTexts.add(opt.text);
              uniqueOptions.push({
                text: opt.text,
                correct: opt.correct || false
              });
            }
          });
          
          // Ensure we have at least one correct answer
          const hasCorrectAnswer = uniqueOptions.some(opt => opt.correct);
          if (!hasCorrectAnswer && uniqueOptions.length > 0) {
            uniqueOptions[0].correct = true;
          }
          
          // Add generic options if we don't have enough unique ones
          while (uniqueOptions.length < 4) {
            const genericText = `Option ${uniqueOptions.length + 1}`;
            if (!uniqueTexts.has(genericText)) {
              uniqueOptions.push({
                text: genericText,
                correct: false
              });
            }
          }
          
          // Take only first 4 options and assign labels
          const finalOptions = uniqueOptions.slice(0, 4).map((opt, idx) => ({
            text: opt.text,
            correct: opt.correct,
            label: String.fromCharCode(65 + idx) // A, B, C, D
          }));
          
          question.options = finalOptions;
          console.log('🔧 Fixed multiple choice options:', question.options.map(o => `${o.label}: ${o.text} (${o.correct ? 'correct' : 'incorrect'})`));
        }
        return question;
      });
      console.log(`🔧 Processed multiple-choice exercise with ${exercise.questions.length} questions`);
    }
    
    if (exercise.type === 'reading' && exercise.content) {
      const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
      console.log(`🔧 Reading exercise word count: ${wordCount}`);
      
      if (!exercise.questions || exercise.questions.length < 5) {
        if (!exercise.questions) exercise.questions = [];
        while (exercise.questions.length < 5) {
          exercise.questions.push({
            text: `Additional question ${exercise.questions.length + 1} about the text.`,
            answer: "Answer would be based on the text content."
          });
        }
        console.log(`🔧 Added missing questions to reading exercise`);
      }
    }
    
    return exercise;
  });
  
  console.log('🔧 Processing exercises - Completed with:', processedExercises.length, 'exercises');
  return processedExercises;
};
