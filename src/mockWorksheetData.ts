
// This is a mock data structure simulating a worksheet response
// Used as a fallback when API calls fail

export default {
  title: "Advanced English Conversation Skills",
  subtitle: "Expressing Opinions and Making Arguments",
  introduction: "This worksheet focuses on developing advanced conversation skills in English, particularly around expressing opinions and making persuasive arguments. The exercises will help you practice vocabulary, sentence structures, and conversation strategies needed for effective discussions and debates.",
  exercises: [
    {
      type: "reading",
      title: "Exercise 1: Reading Comprehension",
      icon: "fa-book-open",
      time: 8,
      instructions: "Read the following text and answer the questions below.",
      content: "In today's interconnected world, the ability to express opinions clearly and make persuasive arguments in English has become an essential skill. Whether in academic settings, professional environments, or casual conversations, being able to articulate your thoughts effectively can make a significant difference in how your ideas are received and understood by others. The art of persuasion involves more than just knowing vocabulary; it requires understanding cultural contexts, employing appropriate tone, and structuring arguments logically. English, as a global language, has developed specific expressions and structures that are commonly used in debates and discussions. Learning these patterns can help non-native speakers sound more natural and convincing. Moreover, being aware of cultural differences in argumentation styles is crucial. While some cultures value direct confrontation and explicit disagreement, others prefer more indirect approaches and value harmony in conversations. Being able to navigate these differences can prevent misunderstandings and make communication more effective. Additionally, non-verbal aspects such as body language, facial expressions, and tone of voice play important roles in how opinions are perceived. Even the most logically sound argument can fall flat if delivered with inappropriate non-verbal cues. Therefore, developing a comprehensive approach to expressing opinions includes practicing both verbal and non-verbal aspects of communication. Finally, respect for different viewpoints remains the cornerstone of productive discussions in any language. The goal of expressing opinions and making arguments should not necessarily be to 'win' but rather to exchange ideas and potentially reach new understandings through constructive dialogue.",
      questions: [
        {
          text: "According to the text, why has expressing opinions in English become an essential skill?",
          answer: "Because of our interconnected world and its importance in academic, professional, and casual settings."
        },
        {
          text: "What does the art of persuasion involve besides vocabulary knowledge?",
          answer: "Understanding cultural contexts, employing appropriate tone, and structuring arguments logically."
        },
        {
          text: "How do cultural differences impact argumentation styles?",
          answer: "Some cultures value direct confrontation while others prefer indirect approaches and harmony in conversations."
        },
        {
          text: "What non-verbal aspects affect how opinions are perceived?",
          answer: "Body language, facial expressions, and tone of voice."
        },
        {
          text: "What does the text suggest should be the goal of expressing opinions?",
          answer: "To exchange ideas and reach new understandings through constructive dialogue, not necessarily to 'win'."
        }
      ],
      teacher_tip: "Before discussing the questions, ask students to identify and explain any new vocabulary from the text. Consider having a brief discussion about argumentation styles in different cultures represented in your classroom."
    },
    {
      type: "matching",
      title: "Exercise 2: Vocabulary Matching",
      icon: "fa-link",
      time: 7,
      instructions: "Match each term with its correct definition.",
      items: [
        { term: "Persuasive", definition: "Able to cause people to do or believe something" },
        { term: "Articulate", definition: "Able to express thoughts and feelings clearly and effectively" },
        { term: "Perspective", definition: "A particular way of viewing things" },
        { term: "Consensus", definition: "General agreement among a group of people" },
        { term: "Rhetoric", definition: "Language designed to have a persuasive or impressive effect" },
        { term: "Rebut", definition: "To prove something is false by presenting opposing arguments" },
        { term: "Substantiate", definition: "To provide evidence to support or prove the truth of something" },
        { term: "Fallacy", definition: "A mistaken belief, especially one based on unsound arguments" },
        { term: "Premise", definition: "A previous statement from which another is inferred" },
        { term: "Concede", definition: "To admit that something is true or valid despite wanting to deny it" }
      ],
      teacher_tip: "After completing the matching exercise, ask students to create their own sentences using these terms to check for understanding."
    },
    {
      type: "fill-in-blanks",
      title: "Exercise 3: Fill in the Blanks",
      icon: "fa-pencil-alt",
      time: 8,
      instructions: "Complete each sentence with the correct word from the box.",
      word_bank: ["opinion", "argue", "believe", "disagree", "evidence", "perspective", "convinced", "point", "view", "persuade"],
      sentences: [
        { text: "I strongly _____ that environmental protection should be a global priority.", answer: "believe" },
        { text: "From my _____, the solution seems quite straightforward.", answer: "perspective" },
        { text: "Could you please clarify your _____ on this matter?", answer: "opinion" },
        { text: "I must _____ with your assessment of the situation.", answer: "disagree" },
        { text: "She presented compelling _____ to support her argument.", answer: "evidence" },
        { text: "He tried to _____ the committee to approve his proposal.", answer: "persuade" },
        { text: "The experts _____ that climate change requires immediate action.", answer: "argue" },
        { text: "After hearing all sides, I'm _____ that we need a new approach.", answer: "convinced" },
        { text: "I see your _____, but have you considered the alternatives?", answer: "point" },
        { text: "In my _____, this policy will benefit everyone involved.", answer: "view" }
      ],
      teacher_tip: "After students complete the exercise individually, have them work in pairs to create additional sentences using the same vocabulary."
    },
    {
      type: "multiple-choice",
      title: "Exercise 4: Multiple Choice",
      icon: "fa-check-square",
      time: 6,
      instructions: "Choose the best expression to complete each sentence.",
      questions: [
        {
          text: "_____ I see it, we need to reconsider our strategy.",
          options: [
            { label: "A", text: "How", correct: false },
            { label: "B", text: "Where", correct: false },
            { label: "C", text: "The way", correct: true },
            { label: "D", text: "What", correct: false }
          ]
        },
        {
          text: "I'm not entirely convinced; _____.",
          options: [
            { label: "A", text: "if I'm honest", correct: true },
            { label: "B", text: "if I'm lying", correct: false },
            { label: "C", text: "if I'm working", correct: false },
            { label: "D", text: "if I'm eating", correct: false }
          ]
        },
        {
          text: "_____ your point, but have you considered the cost?",
          options: [
            { label: "A", text: "I'm taking", correct: false },
            { label: "B", text: "I see", correct: true },
            { label: "C", text: "I believe", correct: false },
            { label: "D", text: "I want", correct: false }
          ]
        },
        {
          text: "Let me play devil's advocate for a moment. _____?",
          options: [
            { label: "A", text: "What about the risks", correct: true },
            { label: "B", text: "I love your idea", correct: false },
            { label: "C", text: "I totally agree", correct: false },
            { label: "D", text: "You're completely wrong", correct: false }
          ]
        },
        {
          text: "_____ we look at this from another perspective?",
          options: [
            { label: "A", text: "Why don't", correct: false },
            { label: "B", text: "What if", correct: false },
            { label: "C", text: "Could", correct: true },
            { label: "D", text: "Should why", correct: false }
          ]
        },
        {
          text: "That's an interesting approach, _____.",
          options: [
            { label: "A", text: "I must tell", correct: false },
            { label: "B", text: "I must say", correct: true },
            { label: "C", text: "I must do", correct: false },
            { label: "D", text: "I must think", correct: false }
          ]
        },
        {
          text: "I'd like to _____ that this solution has worked before.",
          options: [
            { label: "A", text: "point in", correct: false },
            { label: "B", text: "point up", correct: false },
            { label: "C", text: "point down", correct: false },
            { label: "D", text: "point out", correct: true }
          ]
        },
        {
          text: "_____ I understand it, the main issue is funding.",
          options: [
            { label: "A", text: "As", correct: true },
            { label: "B", text: "When", correct: false },
            { label: "C", text: "Which", correct: false },
            { label: "D", text: "Because", correct: false }
          ]
        },
        {
          text: "I'm not saying you're wrong, _____.",
          options: [
            { label: "A", text: "but there are other factors to consider", correct: true },
            { label: "B", text: "because you're completely right", correct: false },
            { label: "C", text: "since you're obviously correct", correct: false },
            { label: "D", text: "and I agree with everything", correct: false }
          ]
        },
        {
          text: "_____, I believe this approach would be more effective.",
          options: [
            { label: "A", text: "On the whole", correct: true },
            { label: "B", text: "In the hole", correct: false },
            { label: "C", text: "At the part", correct: false },
            { label: "D", text: "With the section", correct: false }
          ]
        }
      ],
      teacher_tip: "After students complete this exercise, have them identify which expressions are more formal versus informal, and discuss contexts where each would be appropriate."
    },
    {
      type: "dialogue",
      title: "Exercise 5: Dialogue Practice",
      icon: "fa-comments",
      time: 7,
      instructions: "Read the dialogue and practice with a partner. Then create your own dialogue using the expressions listed below.",
      dialogue: [
        { speaker: "Alex", text: "What do you think about the new company policy on remote work?" },
        { speaker: "Jordan", text: "Personally, I think it's a step in the right direction. Employees need more flexibility." },
        { speaker: "Alex", text: "I see your point, but I'm concerned about team cohesion. Won't it affect collaboration?" },
        { speaker: "Jordan", text: "That's a valid concern. However, I believe with the right tools, we can maintain effective communication." },
        { speaker: "Alex", text: "I'm not entirely convinced. In my experience, face-to-face interactions lead to more innovation." },
        { speaker: "Jordan", text: "I understand where you're coming from, but studies suggest remote teams can be just as innovative." },
        { speaker: "Alex", text: "Could you point me to those studies? I'd be interested to see the evidence." },
        { speaker: "Jordan", text: "Of course! I'll send you the links. It might change your perspective on the matter." },
        { speaker: "Alex", text: "I appreciate that. I'm always open to reconsidering my views based on new information." },
        { speaker: "Jordan", text: "That's what I like about our discussions—we can disagree respectfully and learn from each other." },
        { speaker: "Alex", text: "Absolutely. Even if we don't reach consensus, the exchange of ideas is valuable." },
        { speaker: "Jordan", text: "Let's revisit this after you've read those studies. We might find some common ground." }
      ],
      expressions: [
        "In my opinion...",
        "From my perspective...",
        "I see your point, but...",
        "That's a valid argument, however...",
        "I'm not convinced that...",
        "Have you considered that...?",
        "The way I see it...",
        "I understand where you're coming from...",
        "Let's look at it another way...",
        "What if we considered...?"
      ],
      expression_instruction: "Use these expressions when practicing your own dialogue about a topic of your choice.",
      teacher_tip: "After students practice the provided dialogue, assign them controversial topics to debate using the expressions. Topics could include: social media influence, environmental policies, or education reform."
    },
    {
      type: "discussion",
      title: "Exercise 6: Group Discussion",
      icon: "fa-question-circle",
      time: 10,
      instructions: "Discuss the following questions in groups of 3-4 students. Use the expressions from previous exercises to express your opinions.",
      questions: [
        "Should social media companies be responsible for regulating content on their platforms? Why or why not?",
        "Is working remotely more productive than working in an office? Defend your position.",
        "Do you think artificial intelligence will create more jobs than it eliminates? Explain your reasoning.",
        "Should higher education be free for all citizens? Present arguments for or against.",
        "Is it ethical for governments to collect data on their citizens for security purposes? Discuss."
      ],
      teacher_tip: "Assign roles within each group: moderator (ensures everyone speaks), note-taker (summarizes key points), and timekeeper (keeps discussion moving). After group discussions, have each group present their most interesting conclusions."
    }
  ],
  vocabulary_sheet: [
    { term: "Argue", meaning: "To give reasons for or against something" },
    { term: "Assertion", meaning: "A confident and forceful statement of fact or belief" },
    { term: "Claim", meaning: "To state something as a fact without providing proof" },
    { term: "Contend", meaning: "To assert something as a position in an argument" },
    { term: "Counterargument", meaning: "An argument opposed to another argument" },
    { term: "Debate", meaning: "A formal discussion on a particular matter with opposing viewpoints" },
    { term: "Elaborate", meaning: "To develop or present something in further detail" },
    { term: "Inference", meaning: "A conclusion reached on the basis of evidence and reasoning" },
    { term: "Justify", meaning: "To show or prove to be right or reasonable" },
    { term: "Logical fallacy", meaning: "An error in reasoning that renders an argument invalid" },
    { term: "Objective", meaning: "Not influenced by personal feelings or opinions" },
    { term: "Rebut", meaning: "To claim or prove that a statement or accusation is false" },
    { term: "Subjective", meaning: "Based on or influenced by personal feelings or opinions" },
    { term: "Validate", meaning: "To check or prove the validity or accuracy of something" },
    { term: "Viewpoint", meaning: "A way of looking at or thinking about something" }
  ]
};
