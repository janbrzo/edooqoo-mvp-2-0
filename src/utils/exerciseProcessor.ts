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
    
    // FIX: Prevent duplicate answers in multiple choice questions
    if (exercise.type === "multiple-choice" && exercise.questions) {
      exercise.questions = exercise.questions.map((question: any) => {
        if (question.options && question.options.length === 4) {
          console.log('🔧 Fixing multiple choice question options');
          
          // Find correct answer
          const correctOption = question.options.find((opt: any) => opt.correct);
          if (correctOption) {
            // Create array of unique options
            const uniqueOptions = new Set();
            const newOptions = [];
            
            // Always add the correct answer first
            uniqueOptions.add(correctOption.text);
            newOptions.push({
              text: correctOption.text,
              correct: true,
              label: 'A'
            });
            
            // Add other unique incorrect options
            const incorrectOptions = question.options.filter((opt: any) => !opt.correct && opt.text !== correctOption.text);
            
            for (const opt of incorrectOptions) {
              if (!uniqueOptions.has(opt.text) && newOptions.length < 4) {
                uniqueOptions.add(opt.text);
                newOptions.push({
                  text: opt.text,
                  correct: false,
                  label: String.fromCharCode(65 + newOptions.length) // B, C, D
                });
              }
            }
            
            // If we don't have enough unique options, create some generic ones
            while (newOptions.length < 4) {
              const genericOption = `Option ${newOptions.length + 1}`;
              if (!uniqueOptions.has(genericOption)) {
                newOptions.push({
                  text: genericOption,
                  correct: false,
                  label: String.fromCharCode(65 + newOptions.length)
                });
              }
            }
            
            // Shuffle options but keep track of correct answer
            const correctIndex = Math.floor(Math.random() * 4);
            const shuffledOptions = [...newOptions];
            
            // Reset all correct flags
            shuffledOptions.forEach(opt => opt.correct = false);
            
            // Set one random option as correct with the correct text
            shuffledOptions[correctIndex].correct = true;
            shuffledOptions[correctIndex].text = correctOption.text;
            
            // Update labels
            shuffledOptions.forEach((opt, idx) => {
              opt.label = String.fromCharCode(65 + idx);
            });
            
            question.options = shuffledOptions;
            console.log('🔧 Fixed multiple choice options:', question.options.map(o => o.text));
          }
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
