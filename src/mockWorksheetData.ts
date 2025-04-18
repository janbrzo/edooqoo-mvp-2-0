const mockWorksheetData = {
  title: "Professional Communication in Customer Service",
  subtitle: "Improving Service Quality through Effective Communication",
  introduction: "This worksheet focuses on developing communication skills essential for customer service professionals. It covers key vocabulary, active listening techniques, and practical scenarios to improve service quality.",
  exercises: [{
    type: "reading",
    title: "Exercise 1: Reading Comprehension",
    icon: "fa-book-open",
    time: 8,
    instructions: "Read the following text about customer service best practices and answer the questions below.",
    content: "Excellent customer service is essential for any business to succeed in today's competitive marketplace. The way a company treats its customers can make the difference between success and failure. Active listening is one of the most important skills for any customer service representative. This means paying full attention to what customers are saying, acknowledging their concerns, and responding appropriately.\n\nEmpathy plays a crucial role in understanding customer needs. By putting yourself in the customer's position, you can better understand their frustrations and find more effective solutions. Clear communication is equally important - using simple language, avoiding jargon, and confirming understanding can prevent misunderstandings.\n\nProfessional behavior, including remaining calm under pressure and maintaining a positive attitude, helps create a good impression. Finally, problem-solving skills are vital for resolving customer issues efficiently and effectively.",
    questions: [{
      text: "Why is customer service important for businesses?",
      answer: "It can make the difference between success and failure in today's competitive marketplace."
    }, {
      text: "What does active listening involve?",
      answer: "Paying full attention, acknowledging concerns, and responding appropriately."
    }, {
      text: "How does empathy help in customer service?",
      answer: "It helps understand customer frustrations and find more effective solutions."
    }, {
      text: "What communication practices can prevent misunderstandings?",
      answer: "Using simple language, avoiding jargon, and confirming understanding."
    }, {
      text: "Name two aspects of professional behavior mentioned in the text.",
      answer: "Remaining calm under pressure and maintaining a positive attitude."
    }],
    teacher_tip: "Before reading, discuss with your student if they have any experience with customer service. After reading, ask them to identify which skills they think they already possess and which they need to develop further."
  }, {
    type: "matching",
    title: "Exercise 2: Vocabulary Matching",
    icon: "fa-link",
    time: 7,
    instructions: "Match each term with its correct definition.",
    items: [{
      term: "Active listening",
      definition: "Fully concentrating on what is being said rather than just passively hearing"
    }, {
      term: "Empathy",
      definition: "The ability to understand and share the feelings of another"
    }, {
      term: "Professionalism",
      definition: "The competence or skill expected of a professional"
    }, {
      term: "Virtual platform",
      definition: "A video conferencing tool"
    }, {
      term: "Customer retention",
      definition: "Keeping existing customers over time"
    }, {
      term: "Clear communication",
      definition: "Conveying information in a straightforward manner"
    }, {
      term: "Zoom",
      definition: "A video conferencing platform used for virtual meetings"
    }, {
      term: "Microsoft Teams",
      definition: "A collaboration platform with chat, meetings, and files"
    }, {
      term: "Customer satisfaction",
      definition: "Fulfillment of one's expectations or needs"
    }, {
      term: "Hospitality",
      definition: "The way a business interacts with its guests"
    }],
    teacher_tip: "Have your student explain why they matched each pair. Ask them to provide examples of how each concept applies in real workplace situations."
  }, {
    type: "fill-in-blanks",
    title: "Exercise 3: Fill in the Blanks",
    icon: "fa-pencil-alt",
    time: 8,
    instructions: "Complete each sentence with the correct word from the box.",
    word_bank: ["empathy", "listening", "feedback", "professional", "service", "communication", "virtual", "customers", "satisfaction", "experience"],
    sentences: [{
      text: "Active _____ is crucial for understanding customer needs.",
      answer: "listening"
    }, {
      text: "Showing _____ helps build rapport with difficult customers.",
      answer: "empathy"
    }, {
      text: "Customer _____ surveys help businesses improve their offerings.",
      answer: "satisfaction"
    }, {
      text: "Maintaining a _____ appearance creates a good first impression.",
      answer: "professional"
    }, {
      text: "Effective _____ prevents misunderstandings with clients.",
      answer: "communication"
    }, {
      text: "Many companies now offer _____ meetings as an alternative to in-person appointments.",
      answer: "virtual"
    }, {
      text: "The overall customer _____ depends on many small interactions.",
      answer: "experience"
    }, {
      text: "Providing constructive _____ to team members improves service quality.",
      answer: "feedback"
    }, {
      text: "High-quality _____ leads to customer loyalty and retention.",
      answer: "service"
    }, {
      text: "Understanding the needs of diverse _____ requires cultural awareness.",
      answer: "customers"
    }],
    teacher_tip: "After completing the exercise, ask your student to create their own sentences using these key terms to check their understanding in different contexts."
  }, {
    type: "multiple-choice",
    title: "Exercise 4: Multiple Choice",
    icon: "fa-check-square",
    time: 7,
    instructions: "Choose the best option to complete each sentence.",
    questions: [{
      text: "Which platform is commonly used for virtual meetings?",
      options: [{
        label: "A",
        text: "Twitter",
        correct: false
      }, {
        label: "B",
        text: "Instagram",
        correct: false
      }, {
        label: "C",
        text: "Zoom",
        correct: true
      }, {
        label: "D",
        text: "Pinterest",
        correct: false
      }]
    }, {
      text: "What is crucial for understanding guest needs?",
      options: [{
        label: "A",
        text: "Ignoring",
        correct: false
      }, {
        label: "B",
        text: "Empathy",
        correct: true
      }, {
        label: "C",
        text: "Rudeness",
        correct: false
      }, {
        label: "D",
        text: "Indifference",
        correct: false
      }]
    }, {
      text: "What ensures a pleasant guest experience?",
      options: [{
        label: "A",
        text: "Professionalism",
        correct: true
      }, {
        label: "B",
        text: "Negligence",
        correct: false
      }, {
        label: "C",
        text: "Carelessness",
        correct: false
      }, {
        label: "D",
        text: "Disrespect",
        correct: false
      }]
    }, {
      text: "Which tool is used for team collaboration?",
      options: [{
        label: "A",
        text: "Facebook",
        correct: false
      }, {
        label: "B",
        text: "Snapchat",
        correct: false
      }, {
        label: "C",
        text: "LinkedIn",
        correct: false
      }, {
        label: "D",
        text: "Microsoft Teams",
        correct: true
      }]
    }, {
      text: "What should you do when a customer is angry?",
      options: [{
        label: "A",
        text: "Interrupt them",
        correct: false
      }, {
        label: "B",
        text: "Listen patiently",
        correct: true
      }, {
        label: "C",
        text: "Argue back",
        correct: false
      }, {
        label: "D",
        text: "Ignore them",
        correct: false
      }]
    }, {
      text: "Which communication style is best for customer service?",
      options: [{
        label: "A",
        text: "Clear and concise",
        correct: true
      }, {
        label: "B",
        text: "Vague and technical",
        correct: false
      }, {
        label: "C",
        text: "Rapid and complex",
        correct: false
      }, {
        label: "D",
        text: "Formal and distant",
        correct: false
      }]
    }, {
      text: "What is important for following up with customers?",
      options: [{
        label: "A",
        text: "Being inconsistent",
        correct: false
      }, {
        label: "B",
        text: "Making excuses",
        correct: false
      }, {
        label: "C",
        text: "Being timely",
        correct: true
      }, {
        label: "D",
        text: "Avoiding details",
        correct: false
      }]
    }],
    teacher_tip: "For each question, ask your student to explain why the correct answer is appropriate and why the other options are not suitable in a customer service context."
  }, {
    type: "dialogue",
    title: "Exercise 5: Speaking Practice",
    icon: "fa-comments",
    time: 10,
    instructions: "Practice the following dialogue with a partner. Then create your own similar conversation.",
    dialogue: [{
      speaker: "Customer",
      text: "Excuse me, I ordered this laptop online last week, but when I opened it, I noticed a scratch on the screen."
    }, {
      speaker: "Representative",
      text: "I'm very sorry to hear that. I understand how disappointing that must be."
    }, {
      speaker: "Customer",
      text: "Yes, it's quite frustrating. I paid a lot of money for a brand new product."
    }, {
      speaker: "Representative",
      text: "You're absolutely right, and I apologize for the inconvenience. Let me help you resolve this issue right away."
    }, {
      speaker: "Customer",
      text: "What options do I have?"
    }, {
      speaker: "Representative",
      text: "You have several options. We can offer a full refund, a replacement unit, or a discount if you prefer to keep this one."
    }, {
      speaker: "Customer",
      text: "I'd prefer a replacement if possible. How long would that take?"
    }, {
      speaker: "Representative",
      text: "We have the same model in stock. I can process the exchange today, and you should receive the new laptop within 3 business days."
    }, {
      speaker: "Customer",
      text: "That sounds reasonable. Thank you for your help."
    }, {
      speaker: "Representative",
      text: "You're welcome. Is there anything else I can assist you with today?"
    }],
    expression_instruction: "Now create your own dialogue using these expressions:",
    expressions: ["I understand your concern about...", "Let me check that for you right away.", "I apologize for the inconvenience.", "We have several options available.", "What would work best for you?", "I'd be happy to help with that.", "We can certainly arrange that for you.", "Thank you for your patience.", "Is there anything else I can help you with?", "Please don't hesitate to contact us again if needed."],
    teacher_tip: "Role-play this dialogue, then have your student create a new scenario with a different product or service issue. Switch roles to give them practice both as the customer and the representative."
  }, {
    type: "discussion",
    title: "Exercise 6: Discussion",
    icon: "fa-question-circle",
    time: 5,
    instructions: "Discuss the following questions with your partner or in small groups.",
    questions: ["What do you think makes the difference between good and excellent customer service?", "Can you describe a time when you received exceptional customer service? What made it special?", "How important is body language and tone of voice in customer service interactions?", "How might cultural differences affect customer service expectations?", "In what ways has technology changed customer service in recent years?"],
    teacher_tip: "Encourage your student to provide specific examples and detailed explanations. This exercise works well as a warm-up or conclusion to the lesson."
  },
  {
    type: "error-correction",
    title: "Exercise 7: Error Correction",
    icon: "fa-pencil-alt",
    time: 8,
    instructions: "Find and correct the error in each sentence.",
    sentences: [
      {
        text: "The customer have complained about the delivery time.",
        correction: "The customer has complained about the delivery time."
      },
      {
        text: "We discussed about the new project yesterday.",
        correction: "We discussed the new project yesterday."
      },
      {
        text: "She don't understand the company's refund policy.",
        correction: "She doesn't understand the company's refund policy."
      },
      {
        text: "They was very satisfied with our service.",
        correction: "They were very satisfied with our service."
      },
      {
        text: "The manager which I spoke to was very helpful.",
        correction: "The manager who/that I spoke to was very helpful."
      },
      {
        text: "We need to improve our communication skills everyday.",
        correction: "We need to improve our communication skills every day."
      },
      {
        text: "She's working in this company since 2015.",
        correction: "She's been working in this company since 2015."
      },
      {
        text: "If I would have known about the issue, I would have fixed it.",
        correction: "If I had known about the issue, I would have fixed it."
      },
      {
        text: "The documents needs to be signed by all parties.",
        correction: "The documents need to be signed by all parties."
      },
      {
        text: "Neither of the proposals were accepted by the client.",
        correction: "Neither of the proposals was accepted by the client."
      }
    ],
    teacher_tip: "Ask your student to explain the grammar rule that was broken in each sentence. This helps reinforce their understanding of English grammar in a business context."
  },
  {
    type: "word-formation",
    title: "Exercise 8: Word Formation",
    icon: "fa-link",
    time: 7,
    instructions: "Complete each sentence with the correct form of the word in brackets.",
    sentences: [
      {
        text: "The _____ of the customer is our top priority. (SATISFY)",
        answer: "satisfaction"
      },
      {
        text: "She spoke very _____ during the presentation. (PROFESSION)",
        answer: "professionally"
      },
      {
        text: "Their _____ to detail is what makes them stand out. (ATTEND)",
        answer: "attention"
      },
      {
        text: "We need to improve the _____ of our service. (EFFICIENT)",
        answer: "efficiency"
      },
      {
        text: "Her _____ helped her understand the customer's concerns. (PATIENT)",
        answer: "patience"
      },
      {
        text: "The company offers _____ training for all new employees. (COMPREHEND)",
        answer: "comprehensive"
      },
      {
        text: "His _____ approach to problem-solving impressed the managers. (CREATE)",
        answer: "creative"
      },
      {
        text: "The team showed great _____ when facing the crisis. (FLEXIBLE)",
        answer: "flexibility"
      },
      {
        text: "Our _____ system needs to be upgraded. (COMMUNICATE)",
        answer: "communication"
      },
      {
        text: "She has excellent _____ skills with international clients. (NEGOTIATE)",
        answer: "negotiation"
      }
    ],
    teacher_tip: "This exercise helps students practice word families and understand how different parts of speech are formed in English. Review common suffixes that create nouns, adjectives, adverbs, and verbs."
  },
  {
    type: "word-order",
    title: "Exercise 9: Word Order",
    icon: "fa-pencil-alt",
    time: 8,
    instructions: "Arrange the words to form correct sentences.",
    sentences: [
      {
        words: ["always", "customers", "should", "we", "listen", "to", "carefully"],
        answer: "We should always listen to customers carefully."
      },
      {
        words: ["meeting", "tomorrow", "the", "has", "been", "to", "rescheduled"],
        answer: "The meeting has been rescheduled to tomorrow."
      },
      {
        words: ["they", "a", "new", "have", "marketing", "strategy", "developed"],
        answer: "They have developed a new marketing strategy."
      },
      {
        words: ["you", "could", "please", "the", "details", "explain", "again"],
        answer: "Could you please explain the details again."
      },
      {
        words: ["we", "are", "currently", "on", "project", "working", "a", "new"],
        answer: "We are currently working on a new project."
      },
      {
        words: ["customer", "our", "policy", "satisfaction", "guarantees", "refunds"],
        answer: "Our customer satisfaction policy guarantees refunds."
      },
      {
        words: ["yesterday", "I", "with", "the", "manager", "spoke", "regional"],
        answer: "I spoke with the regional manager yesterday."
      },
      {
        words: ["they", "for", "have", "been", "waiting", "response", "a", "still", "are"],
        answer: "They are still waiting for a response."
      },
      {
        words: ["service", "quality", "to", "training", "is", "essential", "good"],
        answer: "Training is essential to good service quality."
      },
      {
        words: ["feedback", "customers", "from", "helps", "improve", "services", "our"],
        answer: "Feedback from customers helps improve our services."
      }
    ],
    teacher_tip: "This exercise helps students practice English word order, which can be particularly challenging for non-native speakers. Review basic sentence structure patterns like Subject-Verb-Object and the correct placement of adverbs."
  }],
  vocabulary_sheet: [{
    term: "Active listening",
    meaning: "Fully concentrating on what is being said rather than just passively hearing"
  }, {
    term: "Empathy",
    meaning: "The ability to understand and share the feelings of another"
  }, {
    term: "Customer retention",
    meaning: "Keeping existing customers over time"
  }, {
    term: "Professional etiquette",
    meaning: "Expected conduct in a business environment"
  }, {
    term: "Service recovery",
    meaning: "The process of converting a poor customer experience into a positive one"
  }, {
    term: "Conflict resolution",
    meaning: "The process of finding a peaceful solution to a disagreement"
  }, {
    term: "Virtual meeting",
    meaning: "A meeting that takes place over the internet rather than in person"
  }, {
    term: "Customer satisfaction",
    meaning: "Measure of how products and services meet or exceed customer expectation"
  }, {
    term: "Problem-solving",
    meaning: "The process of finding solutions to difficult or complex issues"
  }, {
    term: "Rapport building",
    meaning: "Developing a relationship of mutual trust and understanding"
  }, {
    term: "Troubleshooting",
    meaning: "The process of identifying and resolving problems"
  }, {
    term: "Service quality",
    meaning: "The assessment of how well a delivered service conforms to expectations"
  }, {
    term: "Client communication",
    meaning: "The exchange of information between service providers and clients"
  }, {
    term: "Feedback mechanism",
    meaning: "A system that allows information to be collected and analyzed"
  }, {
    term: "Customer loyalty",
    meaning: "A customer's willingness to continue to do business with a company"
  }]
};

export const mockExercises = {
  errorCorrection: {
    type: "error-correction",
    title: "Exercise 7: Error Correction",
    icon: "fa-pencil-alt",
    time: 8,
    instructions: "Find and correct the error in each sentence.",
    sentences: [
      {
        text: "The customer have complained about the delivery time.",
        correction: "The customer has complained about the delivery time."
      },
      {
        text: "We discussed about the new project yesterday.",
        correction: "We discussed the new project yesterday."
      },
      {
        text: "She don't understand the company's refund policy.",
        correction: "She doesn't understand the company's refund policy."
      },
      {
        text: "They was very satisfied with our service.",
        correction: "They were very satisfied with our service."
      },
      {
        text: "The manager which I spoke to was very helpful.",
        correction: "The manager who/that I spoke to was very helpful."
      },
      {
        text: "We need to improve our communication skills everyday.",
        correction: "We need to improve our communication skills every day."
      },
      {
        text: "She's working in this company since 2015.",
        correction: "She's been working in this company since 2015."
      },
      {
        text: "If I would have known about the issue, I would have fixed it.",
        correction: "If I had known about the issue, I would have fixed it."
      },
      {
        text: "The documents needs to be signed by all parties.",
        correction: "The documents need to be signed by all parties."
      },
      {
        text: "Neither of the proposals were accepted by the client.",
        correction: "Neither of the proposals was accepted by the client."
      }
    ],
    teacher_tip: "Ask your student to explain the grammar rule that was broken in each sentence. This helps reinforce their understanding of English grammar in a business context."
  },
  wordFormation: {
    type: "word-formation",
    title: "Exercise 8: Word Formation",
    icon: "fa-link",
    time: 7,
    instructions: "Complete each sentence with the correct form of the word in brackets.",
    sentences: [
      {
        text: "The _____ of the customer is our top priority. (SATISFY)",
        answer: "satisfaction"
      },
      {
        text: "She spoke very _____ during the presentation. (PROFESSION)",
        answer: "professionally"
      },
      {
        text: "Their _____ to detail is what makes them stand out. (ATTEND)",
        answer: "attention"
      },
      {
        text: "We need to improve the _____ of our service. (EFFICIENT)",
        answer: "efficiency"
      },
      {
        text: "Her _____ helped her understand the customer's concerns. (PATIENT)",
        answer: "patience"
      },
      {
        text: "The company offers _____ training for all new employees. (COMPREHEND)",
        answer: "comprehensive"
      },
      {
        text: "His _____ approach to problem-solving impressed the managers. (CREATE)",
        answer: "creative"
      },
      {
        text: "The team showed great _____ when facing the crisis. (FLEXIBLE)",
        answer: "flexibility"
      },
      {
        text: "Our _____ system needs to be upgraded. (COMMUNICATE)",
        answer: "communication"
      },
      {
        text: "She has excellent _____ skills with international clients. (NEGOTIATE)",
        answer: "negotiation"
      }
    ],
    teacher_tip: "This exercise helps students practice word families and understand how different parts of speech are formed in English. Review common suffixes that create nouns, adjectives, adverbs, and verbs."
  },
  wordOrder: {
    type: "word-order",
    title: "Exercise 9: Word Order",
    icon: "fa-pencil-alt",
    time: 8,
    instructions: "Arrange the words to form correct sentences.",
    sentences: [
      {
        words: ["always", "customers", "should", "we", "listen", "to", "carefully"],
        answer: "We should always listen to customers carefully."
      },
      {
        words: ["meeting", "tomorrow", "the", "has", "been", "to", "rescheduled"],
        answer: "The meeting has been rescheduled to tomorrow."
      },
      {
        words: ["they", "a", "new", "have", "marketing", "strategy", "developed"],
        answer: "They have developed a new marketing strategy."
      },
      {
        words: ["you", "could", "please", "the", "details", "explain", "again"],
        answer: "Could you please explain the details again."
      },
      {
        words: ["we", "are", "currently", "on", "project", "working", "a", "new"],
        answer: "We are currently working on a new project."
      },
      {
        words: ["customer", "our", "policy", "satisfaction", "guarantees", "refunds"],
        answer: "Our customer satisfaction policy guarantees refunds."
      },
      {
        words: ["yesterday", "I", "with", "the", "manager", "spoke", "regional"],
        answer: "I spoke with the regional manager yesterday."
      },
      {
        words: ["they", "for", "have", "been", "waiting", "response", "a", "still", "are"],
        answer: "They are still waiting for a response."
      },
      {
        words: ["service", "quality", "to", "training", "is", "essential", "good"],
        answer: "Training is essential to good service quality."
      },
      {
        words: ["feedback", "customers", "from", "helps", "improve", "services", "our"],
        answer: "Feedback from customers helps improve our services."
      }
    ],
    teacher_tip: "This exercise helps students practice English word order, which can be particularly challenging for non-native speakers. Review basic sentence structure patterns like Subject-Verb-Object and the correct placement of adverbs."
  }
};

export default mockWorksheetData;
