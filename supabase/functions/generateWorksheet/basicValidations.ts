
// Basic exercise validations

export function validateMatchingExercise(exercise: any): void {
  if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 10) {
    console.error('Matching exercise missing items or has fewer than 10');
    if (!exercise.items) exercise.items = [];
    while (exercise.items.length < 10) {
      exercise.items.push({
        term: `Term ${exercise.items.length + 1}`,
        definition: `Definition ${exercise.items.length + 1}`
      });
    }
  }
}

export function validateMultipleChoiceExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 10) {
    console.error('Multiple choice exercise missing questions or has fewer than 10');
    if (!exercise.questions) exercise.questions = [];
    while (exercise.questions.length < 10) {
      const questionIndex = exercise.questions.length + 1;
      exercise.questions.push({
        text: `Question ${questionIndex}?`,
        options: [
          { label: "A", text: `Option A for question ${questionIndex}`, correct: false },
          { label: "B", text: `Option B for question ${questionIndex}`, correct: true },
          { label: "C", text: `Option C for question ${questionIndex}`, correct: false },
          { label: "D", text: `Option D for question ${questionIndex}`, correct: false }
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
            text: `Option ${labels[question.options.length]}`,
            correct: question.options.length === 1
          });
        }
      }
    }
  }
}

export function validateFillInBlanksExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.error('Fill in blanks exercise missing sentences or has fewer than 10');
    if (!exercise.sentences) exercise.sentences = [];
    while (exercise.sentences.length < 10) {
      exercise.sentences.push({
        text: `This is sentence ${exercise.sentences.length + 1} with a _____ to fill in.`,
        answer: `word${exercise.sentences.length + 1}`
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

export function validateTrueFalseExercise(exercise: any): void {
  if (!exercise.statements || !Array.isArray(exercise.statements) || exercise.statements.length < 10) {
    console.error('True-false exercise missing statements or has fewer than 10');
    if (!exercise.statements) exercise.statements = [];
    while (exercise.statements.length < 10) {
      const statementIndex = exercise.statements.length + 1;
      const isTrue = statementIndex % 2 === 0;
      exercise.statements.push({
        text: `Statement ${statementIndex} which is ${isTrue ? 'true' : 'false'}.`,
        isTrue: isTrue
      });
    }
  }
}
