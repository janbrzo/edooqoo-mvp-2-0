
/**
 * Validates the structure of a worksheet
 * Returns an array of issues if any are found, empty array if valid
 */
export const validateWorksheet = (worksheet: any): string[] => {
  const issues: string[] = [];
  
  if (!worksheet) {
    issues.push("Invalid worksheet data");
    return issues;
  }
  
  // Check for exercises
  if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
    issues.push("The worksheet doesn't contain any exercises");
    return issues;
  }
  
  // Check for reading exercises and word count
  const readingExercise = worksheet.exercises.find((ex: any) => ex.type === 'reading');
  if (readingExercise && readingExercise.content) {
    const wordCount = readingExercise.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 280 || wordCount > 320) {
      issues.push(`Reading content has ${wordCount} words (target: 280-320)`);
    }
  }
  
  // Check for template content in exercises
  const templatePattern = /This is (sentence|question) \d+ with/i;
  worksheet.exercises.forEach((exercise: any, index: number) => {
    // Check for minimum number of items
    if (exercise.sentences && Array.isArray(exercise.sentences) && exercise.sentences.length < 10) {
      issues.push(`Exercise ${index + 1} (${exercise.type}) has only ${exercise.sentences.length} sentences (minimum 10 required)`);
    }
    
    if (exercise.questions && Array.isArray(exercise.questions) && 
        (exercise.type === 'reading' || exercise.type === 'multiple-choice') && 
        exercise.questions.length < 5) {
      issues.push(`Exercise ${index + 1} (${exercise.type}) has only ${exercise.questions.length} questions (minimum 5 recommended)`);
    }
    
    if (exercise.statements && Array.isArray(exercise.statements) && exercise.statements.length < 10) {
      issues.push(`Exercise ${index + 1} (${exercise.type}) has only ${exercise.statements.length} statements (minimum 10 required)`);
    }
    
    // Check for template-like content
    if (exercise.sentences && Array.isArray(exercise.sentences)) {
      const templateSentences = exercise.sentences.filter((s: any) => 
        templatePattern.test(s.text || '')
      );
      
      if (templateSentences.length > 0) {
        issues.push(`Exercise ${index + 1} (${exercise.type}) contains ${templateSentences.length} template sentences`);
      }
    }
    
    if (exercise.questions && Array.isArray(exercise.questions)) {
      // For discussion exercises, questions are strings not objects
      if (exercise.type === 'discussion') {
        const templateQuestions = exercise.questions.filter((q: string) => 
          templatePattern.test(q || '')
        );
        
        if (templateQuestions.length > 0) {
          issues.push(`Exercise ${index + 1} (${exercise.type}) contains ${templateQuestions.length} template questions`);
        }
      } else {
        const templateQuestions = exercise.questions.filter((q: any) => 
          templatePattern.test(q.text || '')
        );
        
        if (templateQuestions.length > 0) {
          issues.push(`Exercise ${index + 1} (${exercise.type}) contains ${templateQuestions.length} template questions`);
        }
      }
    }
    
    // Check dialogue for templates
    if (exercise.dialogue && Array.isArray(exercise.dialogue)) {
      const templateDialogues = exercise.dialogue.filter((d: any) => 
        templatePattern.test(d.text || '') || d.speaker.includes('Speaker')
      );
      
      if (templateDialogues.length > 0) {
        issues.push(`Exercise ${index + 1} (${exercise.type}) contains ${templateDialogues.length} generic dialogue lines`);
      }
    }
  });
  
  // Check vocabulary sheet
  if (worksheet.vocabulary_sheet && Array.isArray(worksheet.vocabulary_sheet)) {
    if (worksheet.vocabulary_sheet.length < 10) {
      issues.push(`Vocabulary sheet has only ${worksheet.vocabulary_sheet.length} items (minimum 10 recommended)`);
    }
  }
  
  return issues;
};

/**
 * Detects if the worksheet contains template-like content
 */
export const detectTemplateContent = (worksheet: any): boolean => {
  if (!worksheet || !worksheet.exercises) return false;
  
  const templatePattern = /This is (sentence|question) \d+ with/i;
  
  for (const exercise of worksheet.exercises) {
    // Check sentences
    if (exercise.sentences && Array.isArray(exercise.sentences)) {
      for (const sentence of exercise.sentences) {
        if (templatePattern.test(sentence.text || '')) {
          return true;
        }
      }
    }
    
    // Check questions
    if (exercise.questions && Array.isArray(exercise.questions)) {
      if (exercise.type === 'discussion') {
        // For discussion, questions are strings
        for (const question of exercise.questions) {
          if (typeof question === 'string' && templatePattern.test(question)) {
            return true;
          }
        }
      } else {
        // For other types, questions are objects
        for (const question of exercise.questions) {
          if (question.text && templatePattern.test(question.text)) {
            return true;
          }
        }
      }
    }
    
    // Check dialogue
    if (exercise.dialogue && Array.isArray(exercise.dialogue)) {
      for (const line of exercise.dialogue) {
        if ((line.text && templatePattern.test(line.text)) || 
            (line.speaker && line.speaker.includes('Speaker'))) {
          return true;
        }
      }
    }
  }
  
  return false;
};
