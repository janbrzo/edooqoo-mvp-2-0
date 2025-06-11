export const mockWorksheetData = {
  title: "Business Communication Mastery",
  subtitle: "Advanced Expressions for Professional Discussions",
  introduction: "This worksheet focuses on sophisticated business expressions and communication techniques commonly used in professional environments. Students will practice using advanced vocabulary and expressions to communicate effectively in workplace situations.",
  exercises: [
    {
      type: "multiple_choice",
      title: "Multiple Choice",
      icon: "CheckCircle",
      time: 6,
      instructions: "Choose the best expression to complete each sentence.",
      questions: [
        {
          text: "_____ I see it, we need to reconsider our strategy.",
          options: [
            { label: "A", text: "The way", correct: true },
            { label: "B", text: "As far as", correct: false },
            { label: "C", text: "Where", correct: false },
            { label: "D", text: "What", correct: false }
          ]
        },
        {
          text: "I'm not entirely convinced; _____.",
          options: [
            { label: "A", text: "if I'm honest", correct: true },
            { label: "B", text: "to be frank", correct: false },
            { label: "C", text: "if I'm working", correct: false },
            { label: "D", text: "frankly speaking", correct: false }
          ]
        },
        {
          text: "_____ your point, but have you considered the cost?",
          options: [
            { label: "A", text: "I see", correct: true },
            { label: "B", text: "I understand", correct: false },
            { label: "C", text: "I get", correct: false },
            { label: "D", text: "I want", correct: false }
          ]
        },
        {
          text: "Let me play devil's advocate for a moment. _____?",
          options: [
            { label: "A", text: "What about the risks", correct: true },
            { label: "B", text: "I love your idea", correct: false },
            { label: "C", text: "Have you considered alternatives", correct: false },
            { label: "D", text: "You're completely wrong", correct: false }
          ]
        },
        {
          text: "_____ we look at this from another perspective?",
          options: [
            { label: "A", text: "Could", correct: false },
            { label: "B", text: "Why don't", correct: true },
            { label: "C", text: "What if", correct: false },
            { label: "D", text: "Should", correct: false }
          ]
        },
        {
          text: "That's an interesting approach, _____.",
          options: [
            { label: "A", text: "I must say", correct: true },
            { label: "B", text: "I must tell", correct: false },
            { label: "C", text: "I must admit", correct: false },
            { label: "D", text: "I must do", correct: false }
          ]
        },
        {
          text: "I'd like to _____ that this solution has worked before.",
          options: [
            { label: "A", text: "point out", correct: true },
            { label: "B", text: "point in", correct: false },
            { label: "C", text: "point up", correct: false },
            { label: "D", text: "mention", correct: false }
          ]
        },
        {
          text: "_____ I understand it, the main issue is funding.",
          options: [
            { label: "A", text: "As", correct: true },
            { label: "B", text: "From what", correct: false },
            { label: "C", text: "Which", correct: false },
            { label: "D", text: "Because", correct: false }
          ]
        },
        {
          text: "I'm not saying you're wrong, _____.",
          options: [
            { label: "A", text: "but there are other factors to consider", correct: true },
            { label: "B", text: "however I disagree completely", correct: false },
            { label: "C", text: "since you're obviously correct", correct: false },
            { label: "D", text: "and I agree with everything", correct: false }
          ]
        },
        {
          text: "_____, I believe this approach would be more effective.",
          options: [
            { label: "A", text: "On the whole", correct: true },
            { label: "B", text: "In general", correct: false },
            { label: "C", text: "At the part", correct: false },
            { label: "D", text: "Overall", correct: false }
          ]
        }
      ],
      teacher_tip: "Focus on helping students understand the subtle differences between similar expressions and when to use them appropriately in business contexts."
    },
    {
      type: "fill_in_the_blanks",
      title: "Fill in the Blanks",
      icon: "Edit",
      time: 8,
      instructions: "Complete the following sentences with appropriate business expressions from the word bank.",
      word_bank: ["to be honest", "in my experience", "on the other hand", "as a result", "in conclusion"],
      sentences: [
        "_____, this project has exceeded all expectations.",
        "_____, I think we should consider a different approach.",
        "_____, the market trends are not in our favor.",
        "_____, we need to adjust our strategies.",
        "_____, our team has shown remarkable resilience."
      ],
      teacher_tip: "Encourage students to understand the context of each sentence before choosing the appropriate expression."
    },
    {
      type: "matching",
      title: "Matching Expressions",
      icon: "Layout",
      time: 7,
      instructions: "Match the business expression with its correct meaning.",
      items: [
        { term: "Touch base", meaning: "To make contact with someone" },
        { term: "Think outside the box", meaning: "To come up with creative solutions" },
        { term: "Get the ball rolling", meaning: "To start a process or activity" },
        { term: "Blue sky thinking", meaning: "Unrestrained creative ideas" },
        { term: "At the end of the day", meaning: "Ultimately; in conclusion" }
      ],
      teacher_tip: "Help students understand the nuances of each expression and how they are used in professional settings."
    },
    {
      type: "dialogue",
      title: "Business Dialogue",
      icon: "MessageSquare",
      time: 10,
      instructions: "Complete the dialogue with appropriate business expressions.",
      dialogue: [
        { speaker: "Manager", line: "Good morning, team. Let's ____ today's agenda." },
        { speaker: "Team Member 1", line: "____, I think we should start with the marketing strategy." },
        { speaker: "Team Member 2", line: "____, I have some concerns about the budget." },
        { speaker: "Manager", line: "____ those concerns, but we need to stay within our limits." },
        { speaker: "Team Member 3", line: "____, let's find a compromise." }
      ],
      teacher_tip: "Encourage students to use a variety of expressions to make the dialogue sound natural and professional."
    },
    {
      type: "open_ended",
      title: "Open-Ended Discussion",
      icon: "Forum",
      time: 12,
      instructions: "Discuss the importance of effective communication in the workplace. Use advanced business expressions in your discussion.",
      content: "Consider the role of clear and concise communication in project management, team collaboration, and client relations.",
      teacher_tip: "Facilitate a discussion where students can practice using the expressions they've learned in a meaningful context."
    }
  ],
  vocabulary_sheet: [
    {
      term: "Devil's advocate",
      meaning: "Someone who argues against an idea to test its strength"
    },
    {
      term: "Point out",
      meaning: "To mention or draw attention to something"
    },
    {
      term: "On the whole",
      meaning: "Generally speaking; considering everything"
    },
    {
      term: "The way I see it",
      meaning: "In my opinion; from my perspective"
    },
    {
      term: "If I'm honest",
      meaning: "To be truthful; speaking frankly"
    }
  ]
};
