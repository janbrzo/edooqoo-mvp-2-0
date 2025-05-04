
/**
 * Walidatory dla różnych typów zadań
 */

import { getIconForType } from "../utils/exerciseUtils";
import { generateFakeText } from "../utils/promptUtils";

/**
 * Główny walidator zadań
 */
export function validateExercise(exercise: any): void {
  if (!exercise.type) {
    console.error('Exercise missing type field');
    exercise.type = 'multiple-choice';
  }
  
  if (!exercise.title) {
    console.error('Exercise missing title field');
    exercise.title = "Exercise: " + (exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' '));
  }
  
  if (!exercise.icon) {
    console.error('Exercise missing icon field');
    exercise.icon = getIconForType(exercise.type);
  }
  
  if (!exercise.time) {
    console.error('Exercise missing time field');
    exercise.time = 5;
  }
  
  if (!exercise.instructions) {
    console.error('Exercise missing instructions field');
    exercise.instructions = "Complete this " + exercise.type + " exercise.";
  }
  
  if (!exercise.teacher_tip) {
    console.error('Exercise missing teacher_tip field');
    exercise.teacher_tip = "Help students with this " + exercise.type + " exercise as needed.";
  }
  
  // Type-specific validations
  switch(exercise.type) {
    case 'reading':
      validateReadingExercise(exercise);
      break;
    case 'matching':
      validateMatchingExercise(exercise);
      break;
    case 'multiple-choice':
      validateMultipleChoiceExercise(exercise);
      break;
    case 'fill-in-blanks':
      validateFillInBlanksExercise(exercise);
      break;
    case 'dialogue':
      validateDialogueExercise(exercise);
      break;
    case 'discussion':
      validateDiscussionExercise(exercise);
      break;
    case 'true-false':
      validateTrueFalseExercise(exercise);
      break;
    case 'error-correction':
    case 'word-formation':
    case 'word-order':
      validateSentencesExercise(exercise);
      break;
  }
}

/**
 * Walidator zadania typu reading
 */
export function validateReadingExercise(exercise: any): void {
  // Validate content
  if (!exercise.content) {
    console.error('Reading exercise missing content');
    exercise.content = generateFakeText(300);
  } else {
    const wordCount = exercise.content.split(/\s+/).length;
    if (wordCount < 280 || wordCount > 320) {
      console.warn("Reading exercise word count (" + wordCount + ") is outside target range of 280-320 words");
    }
  }
  
  // Validate questions
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    console.error('Reading exercise missing questions or has fewer than 5');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 5) {
      exercise.questions.push({
        text: "Question " + (exercise.questions.length + 1) + " about the reading?",
        answer: "Answer to question " + (exercise.questions.length + 1) + "."
      });
    }
  }
}

/**
 * Walidator zadania typu matching
 */
export function validateMatchingExercise(exercise: any): void {
  if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 10) {
    console.error('Matching exercise missing items or has fewer than 10');
    if (!exercise.items) exercise.items = [];
    while (exercise.items.length < 10) {
      exercise.items.push({
        term: "Term " + (exercise.items.length + 1),
        definition: "Definition " + (exercise.items.length + 1)
      });
    }
  }
}

/**
 * Walidator zadania typu multiple-choice
 */
export function validateMultipleChoiceExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Multiple choice exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      const questionIndex = exercise.questions.length + 1;
      exercise.questions.push({
        text: "Question " + questionIndex + "?",
        options: [
          { label: "A", text: "Option A for question " + questionIndex, correct: false },
          { label: "B", text: "Option B for question " + questionIndex, correct: true },
          { label: "C", text: "Option C for question " + questionIndex, correct: false },
          { label: "D", text: "Option D for question " + questionIndex, correct: false }
        ]
      });
    }
  } else {
    // Validate that each question has 4 options
    for (const question of exercise.questions) {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 4) {
        console.error('Multiple choice question missing options or has fewer than 4');
        if (!question.options) question.options = [];
        while (question.options.length < 4) {
          const labels = ["A", "B", "C", "D"];
          question.options.push({
            label: labels[question.options.length],
            text: "Option " + labels[question.options.length],
            correct: question.options.length === 1 // Make the second option correct by default
          });
        }
      }
    }
  }
}

/**
 * Walidator zadania typu fill-in-blanks
 */
export function validateFillInBlanksExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error('Fill in blanks exercise missing sentences or has fewer than 10');
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      exercise.sentences.push({
        text: "This is sentence " + (exercise.sentences.length + 1) + " with a _____ to fill in.",
        answer: "word" + (exercise.sentences.length + 1)
      });
    }
  }
  
  if (!exercise.word_bank || !Array.isArray(exercise.word_bank) || exercise.word_bank.length < 10) {
    console.error('Fill in blanks exercise missing word bank or has fewer than 10 words');
    if (!exercise.word_bank) exercise.word_bank = [];
    const words = [
      "apple", "banana", "computer", "desk", "elephant", 
      "father", "guitar", "hospital", "internet", "jungle",
      "kitchen", "library", "mountain", "newspaper", "ocean"
    ];
    while (exercise.word_bank.length < 10) {
      exercise.word_bank.push(words[exercise.word_bank.length % words.length]);
    }
  }
}

/**
 * Walidator zadania typu dialogue
 */
export function validateDialogueExercise(exercise: any): void {
  if (!exercise.dialogue || !Array.isArray(exercise.dialogue) || exercise.dialogue.length < 10) {
    console.error('Dialogue exercise missing dialogue exchanges or has fewer than 10');
    if (!exercise.dialogue) exercise.dialogue = [];
    while (exercise.dialogue.length < 10) {
      const isEven = exercise.dialogue.length % 2 === 0;
      exercise.dialogue.push({
        speaker: isEven ? "Person A" : "Person B",
        text: "This is line " + (exercise.dialogue.length + 1) + " of the dialogue."
      });
    }
  }
  
  if (!exercise.expressions || !Array.isArray(exercise.expressions) || exercise.expressions.length < 10) {
    console.error('Dialogue exercise missing expressions or has fewer than 10');
    if (!exercise.expressions) exercise.expressions = [];
    const commonExpressions = [
      "Nice to meet you", 
      "How are you?", 
      "See you later", 
      "Thank you", 
      "You're welcome",
      "I'm sorry", 
      "Excuse me", 
      "Can you help me?", 
      "I don't understand", 
      "Could you repeat that?"
    ];
    while (exercise.expressions.length < 10) {
      exercise.expressions.push(commonExpressions[exercise.expressions.length % commonExpressions.length]);
    }
  }
  
  if (!exercise.expression_instruction) {
    console.error('Dialogue exercise missing expression instruction');
    exercise.expression_instruction = "Practice using these expressions from the dialogue in your own conversations.";
  }
}

/**
 * Walidator zadania typu discussion
 */
export function validateDiscussionExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Discussion exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      exercise.questions.push("Discussion question " + (exercise.questions.length + 1) + "?");
    }
  }
}

/**
 * Walidator zadania typu true-false
 */
export function validateTrueFalseExercise(exercise: any): void {
  if (!exercise.statements || !Array.isArray(exercise.statements) || exercise.statements.length < 10) {
    console.error('True-false exercise missing statements or has fewer than 10');
    if (!exercise.statements) exercise.statements = [];
    while (exercise.statements.length < 10) {
      const statementIndex = exercise.statements.length + 1;
      const isTrue = statementIndex % 2 === 0;
      exercise.statements.push({
        text: "Statement " + statementIndex + " which is " + (isTrue ? 'true' : 'false') + ".",
        isTrue: isTrue
      });
    }
  }
}

/**
 * Walidator zadania typu sentences (error-correction, word-formation, word-order)
 */
export function validateSentencesExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error(exercise.type + " exercise missing sentences or has fewer than 10");
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      const sentenceIndex = exercise.sentences.length + 1;
      let sentenceObject;
      
      if (exercise.type === 'error-correction') {
        sentenceObject = {
          text: "This sentence " + sentenceIndex + " has an error in it.",
          correction: "This sentence " + sentenceIndex + " has no error in it."
        };
      } else if (exercise.type === 'word-formation') {
        sentenceObject = {
          text: "This is sentence " + sentenceIndex + " with a _____ (form) to complete.",
          answer: "formation"
        };
      } else { // word-order
        sentenceObject = {
          text: "is This sentence " + sentenceIndex + " order wrong in.",
          answer: "This sentence " + sentenceIndex + " is in wrong order."
        };
      }
      
      exercise.sentences.push(sentenceObject);
    }
  }
}
