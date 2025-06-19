
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
    
    // FIXED: Multiple choice questions processing - minimal intervention
    if (exercise.type === "multiple-choice" && exercise.questions) {
      exercise.questions = exercise.questions.map((question: any) => {
        if (question.options && question.options.length > 0) {
          console.log('🔧 Processing multiple choice question - preserving original structure');
          
          // Only ensure we have labels A, B, C, D if they're missing
          question.options = question.options.map((opt: any, idx: number) => ({
            ...opt, // Preserve all original data including correct status
            label: opt.label || String.fromCharCode(65 + idx) // Only add label if missing
          }));
          
          console.log('🔧 Multiple choice options preserved:', question.options.map(o => `${o.label}: ${o.text} (${o.correct ? 'correct' : 'incorrect'})`));
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
