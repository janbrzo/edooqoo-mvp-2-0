
import { shuffleArray, createSampleVocabulary } from "./worksheetUtils";
import { getExerciseTimeByType, validateWorksheetTimes } from "./timeCalculator";

export const processExercises = (exercises: any[], lessonTime: string = '45min'): any[] => {
  console.log('🔧 Processing exercises - Starting with:', exercises.length, 'exercises');
  
  const processedExercises = exercises.map((exercise: any, index: number) => {
    console.log(`🔧 Processing exercise ${index + 1}: ${exercise.type}`);
    
    const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
    exercise.title = `Exercise ${index + 1}: ${exerciseType}`;
    
    // Assign optimized time based on exercise type and lesson duration
    exercise.time = getExerciseTimeByType(exercise.type, lessonTime);
    console.log(`🔧 Assigned ${exercise.time} minutes to ${exercise.type} exercise`);
    
    if (exercise.type === "matching" && exercise.items) {
      exercise.originalItems = [...exercise.items];
      exercise.shuffledTerms = shuffleArray([...exercise.items]);
      console.log(`🔧 Processed matching exercise with ${exercise.items.length} items`);
    }
    
    // FIXED: Multiple choice questions processing with randomized correct answer positions
    if (exercise.type === "multiple-choice" && exercise.questions) {
      exercise.questions = exercise.questions.map((question: any) => {
        if (question.options && question.options.length >= 2) {
          console.log('🔧 Processing multiple choice question options');
          
          // Get all unique option texts while preserving their correct status
          const uniqueTexts = new Set();
          const uniqueOptions = [];
          
          // First, collect all unique options with their original correct status
          question.options.forEach((opt: any) => {
            if (!uniqueTexts.has(opt.text)) {
              uniqueTexts.add(opt.text);
              uniqueOptions.push({
                text: opt.text,
                correct: opt.correct || false // Preserve original correct status
              });
            }
          });
          
          // Add generic options if we don't have enough unique ones
          while (uniqueOptions.length < 4) {
            const genericText = `Option ${uniqueOptions.length + 1}`;
            if (!uniqueTexts.has(genericText)) {
              uniqueOptions.push({
                text: genericText,
                correct: false // Generic options are never correct
              });
            }
          }
          
          // Take only first 4 options
          const fourOptions = uniqueOptions.slice(0, 4);
          
          // FIXED: Randomize the position of the correct answer for equal ABCD distribution
          const correctAnswerIndex = fourOptions.findIndex(opt => opt.correct);
          
          // If we have a correct answer, randomize its position
          if (correctAnswerIndex !== -1) {
            const correctAnswer = fourOptions[correctAnswerIndex];
            
            // Remove the correct answer from its current position
            fourOptions.splice(correctAnswerIndex, 1);
            
            // Generate a random position (0-3) for the correct answer
            const randomPosition = Math.floor(Math.random() * 4);
            
            // Insert the correct answer at the random position
            fourOptions.splice(randomPosition, 0, correctAnswer);
            
            console.log(`🔧 Moved correct answer to position ${randomPosition + 1} (${String.fromCharCode(65 + randomPosition)})`);
          } else {
            // If no correct answer exists, make the first option correct and randomize its position
            fourOptions[0].correct = true;
            const correctAnswer = fourOptions[0];
            fourOptions.splice(0, 1);
            
            const randomPosition = Math.floor(Math.random() * 4);
            fourOptions.splice(randomPosition, 0, correctAnswer);
            
            console.log(`🔧 Set first option as correct and moved to position ${randomPosition + 1} (${String.fromCharCode(65 + randomPosition)})`);
          }
          
          // Ensure only one option is marked as correct
          fourOptions.forEach((opt, idx) => {
            if (idx === fourOptions.findIndex(o => o.correct)) {
              opt.correct = true;
            } else {
              opt.correct = false;
            }
          });
          
          // Assign labels A, B, C, D to the final options
          const finalOptions = fourOptions.map((opt, idx) => ({
            text: opt.text,
            correct: opt.correct,
            label: String.fromCharCode(65 + idx) // A, B, C, D
          }));
          
          question.options = finalOptions;
          console.log('🔧 Fixed multiple choice options:', question.options.map(o => `${o.label}: ${o.text} (${o.correct ? 'CORRECT' : 'incorrect'})`));
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
  
  // Validate total exercise times
  const exerciseTimes = processedExercises.map(ex => ex.time || 0);
  const targetTime = lessonTime === '45min' ? 45 : 60;
  const warmupTime = 5;
  const grammarTime = lessonTime === '45min' ? 10 : 15;
  
  const validation = validateWorksheetTimes(warmupTime, grammarTime, exerciseTimes, targetTime);
  
  if (!validation.isValid) {
    console.warn(`⚠️ Worksheet time validation failed:`, {
      target: targetTime,
      actual: validation.actualTime,
      difference: validation.difference
    });
  } else {
    console.log(`✅ Worksheet times validated successfully: ${validation.actualTime}/${targetTime} minutes`);
  }
  
  console.log('🔧 Processing exercises - Completed with:', processedExercises.length, 'exercises');
  return processedExercises;
};
