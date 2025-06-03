
// Advanced exercise validations

export function validateDialogueExercise(exercise: any): void {
  if (!exercise.dialogue || !Array.isArray(exercise.dialogue) || exercise.dialogue.length < 10) {
    console.error('Dialogue exercise missing dialogue exchanges or has fewer than 10');
    if (!exercise.dialogue) exercise.dialogue = [];
    while (exercise.dialogue.length < 10) {
      const isEven = exercise.dialogue.length % 2 === 0;
      exercise.dialogue.push({
        speaker: isEven ? "Person A" : "Person B",
        text: `This is line ${exercise.dialogue.length + 1} of the dialogue.`
      });
    }
  }
  
  if (!exercise.expressions || !Array.isArray(exercise.expressions) || exercise.expressions.length < 10) {
    console.error('Dialogue exercise missing expressions or has fewer than 10');
    if (!exercise.expressions) exercise.expressions = [];
    const commonExpressions = [
      "Nice to meet you", "How are you?", "See you later", "Thank you", "You're welcome",
      "I'm sorry", "Excuse me", "Can you help me?", "I don't understand", "Could you repeat that?"
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

export function validateDiscussionExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Discussion exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      exercise.questions.push(`Discussion question ${exercise.questions.length + 1}?`);
    }
  }
}

export function validateSentencesExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error(`${exercise.type} exercise missing sentences or has fewer than 10`);
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      const sentenceIndex = exercise.sentences.length + 1;
      let sentenceObject;
      
      if (exercise.type === 'error-correction') {
        sentenceObject = {
          text: `This sentence ${sentenceIndex} has an error in it.`,
          correction: `This sentence ${sentenceIndex} has no error in it.`
        };
      } else if (exercise.type === 'word-formation') {
        sentenceObject = {
          text: `This is sentence ${sentenceIndex} with a _____ (form) to complete.`,
          answer: "formation"
        };
      } else { // word-order
        sentenceObject = {
          text: `is This sentence ${sentenceIndex} order wrong in.`,
          answer: `This sentence ${sentenceIndex} is in wrong order.`
        };
      }
      
      exercise.sentences.push(sentenceObject);
    }
  }
}
