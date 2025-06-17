import { Tile } from './types';

// Stare kafelki Grammar Focus przywrócone
export const GRAMMAR_FOCUS: Tile[] = [
  { id: "Present-Simple", title: "Present Simple Tense" },
  { id: "Present-Continuous", title: "Present Continuous Tense" },
  { id: "Past-Simple", title: "Past Simple Tense" },
  { id: "Future-Forms", title: "Future Forms: \"Will\" vs. \"Going to\"" },
  { id: "nouns", title: "Countable and Uncountable Nouns" },
  { id: "Modals", title: "Modals of Advice and Obligation" },
  { id: "Adverbs", title: "Adverbs of Frequency" },
  { id: "Conditionals01", title: "Conditionals (0 and 1st)" },
  { id: "Conditionals2", title: "Conditionals (2nd)" },
  { id: "Passive-Voice", title: "Passive Voice (present and past)" },
  { id: "Relative-Clauses", title: "Relative Clauses: who, which, that" },
  { id: "Gerunds-Infinitives", title: "Gerunds and Infinitives" },
  { id: "Reported-Speech", title: "Reported Speech" },
  { id: "Conditional3", title: "Conditional Sentences – 3rd Conditional" },
  { id: "Past-Habits", title: "Used to / Be used to / Get used to" },
  { id: "Causative-Form", title: "Causative Form: Have/Get something done" },
  { id: "Future-Continuous", title: "Future Continuous" },
  { id: "Adverbs-so/such", title: "Adverbs: So / Such" }
];

// Nowe zestawy 1-30 dla wszystkich pól
export const WORKSHEET_SETS = [
  {
    id: 1,
    lessonTopic: "Preparing for a job interview at Tesla",
    lessonFocus: "Talking about experience and career goals",
    additionalInfo: "Emily [28] is applying for a software engineering position at Tesla in Berlin next Tuesday.",
    grammarFocus: "Present Perfect",
    topicTiles: [
      { id: "topic-1-1", title: "Preparing for a job interview at Tesla" },
      { id: "topic-1-2", title: "Discussing technical skills in interviews" }
    ],
    focusTiles: [
      { id: "focus-1-1", title: "Talking about experience and career goals" },
      { id: "focus-1-2", title: "Answering behavioral interview questions" }
    ],
    infoTiles: [
      { id: "info-1-1", title: "Emily [28] is applying for a software engineering position at Tesla in Berlin next Tuesday." },
      { id: "info-1-2", title: "Student nervous about technical questions and company culture fit" }
    ]
  },
  {
    id: 2,
    lessonTopic: "Planning a weekend trip to the Scottish Highlands",
    lessonFocus: "Making suggestions and talking about preferences",
    additionalInfo: "Jack [32] and his partner want to escape the city and explore nature this weekend.",
    grammarFocus: "Modals of Advice and Obligation",
    topicTiles: [
      { id: "topic-2-1", title: "Planning a weekend trip to the Scottish Highlands" },
      { id: "topic-2-2", title: "Exploring nature destinations in Scotland" }
    ],
    focusTiles: [
      { id: "focus-2-1", title: "Making suggestions and talking about preferences" },
      { id: "focus-2-2", title: "Discussing outdoor activities and hiking plans" }
    ],
    infoTiles: [
      { id: "info-2-1", title: "Jack [32] and his partner want to escape the city and explore nature this weekend." },
      { id: "info-2-2", title: "Looking for hiking trails and cozy accommodations" }
    ]
  },
  {
    id: 3,
    lessonTopic: "Returning a damaged product",
    lessonFocus: "Making complaints and asking for solutions",
    additionalInfo: "Sophie [41] received a broken coffee machine from Amazon and wants a refund or replacement.",
    grammarFocus: "Conditionals (0 and 1st)",
    topicTiles: [
      { id: "topic-3-1", title: "Returning a damaged product" },
      { id: "topic-3-2", title: "Dealing with online shopping issues" }
    ],
    focusTiles: [
      { id: "focus-3-1", title: "Making complaints and asking for solutions" },
      { id: "focus-3-2", title: "Negotiating refunds and replacements" }
    ],
    infoTiles: [
      { id: "info-3-1", title: "Sophie [41] received a broken coffee machine from Amazon and wants a refund or replacement." },
      { id: "info-3-2", title: "Product arrived damaged in packaging, needs quick resolution" }
    ]
  },
  {
    id: 4,
    lessonTopic: "Writing an email to reschedule a client meeting",
    lessonFocus: "Apologizing and offering alternatives",
    additionalInfo: "Mark [36] has a scheduling conflict and needs to postpone a sales meeting with a UK client.",
    grammarFocus: "Future Forms: \"Will\" vs. \"Going to\"",
    topicTiles: [
      { id: "topic-4-1", title: "Writing an email to reschedule a client meeting" },
      { id: "topic-4-2", title: "Professional business communication" }
    ],
    focusTiles: [
      { id: "focus-4-1", title: "Apologizing and offering alternatives" },
      { id: "focus-4-2", title: "Maintaining client relationships professionally" }
    ],
    infoTiles: [
      { id: "info-4-1", title: "Mark [36] has a scheduling conflict and needs to postpone a sales meeting with a UK client." },
      { id: "info-4-2", title: "Important client relationship, needs diplomatic approach" }
    ]
  },
  {
    id: 5,
    lessonTopic: "Organizing a surprise birthday party",
    lessonFocus: "Discussing plans and delegating tasks",
    additionalInfo: "Sarah [30] is planning a surprise party for her best friend at their favorite rooftop bar.",
    grammarFocus: "Present Continuous",
    topicTiles: [
      { id: "topic-5-1", title: "Organizing a surprise birthday party" },
      { id: "topic-5-2", title: "Planning special events and celebrations" }
    ],
    focusTiles: [
      { id: "focus-5-1", title: "Discussing plans and delegating tasks" },
      { id: "focus-5-2", title: "Coordinating with friends and venues" }
    ],
    infoTiles: [
      { id: "info-5-1", title: "Sarah [30] is planning a surprise party for her best friend at their favorite rooftop bar." },
      { id: "info-5-2", title: "Needs to coordinate decorations, guest list, and surprise element" }
    ]
  },
  {
    id: 6,
    lessonTopic: "First day at a new high school",
    lessonFocus: "Introducing yourself and talking about routines",
    additionalInfo: "Noah [15] just moved from the US to the UK and needs to get comfortable with school vocabulary.",
    grammarFocus: "Present Simple Tense",
    topicTiles: [
      { id: "topic-6-1", title: "First day at a new high school" },
      { id: "topic-6-2", title: "Adapting to a new school environment" }
    ],
    focusTiles: [
      { id: "focus-6-1", title: "Introducing yourself and talking about routines" },
      { id: "focus-6-2", title: "Making friends and joining school activities" }
    ],
    infoTiles: [
      { id: "info-6-1", title: "Noah [15] just moved from the US to the UK and needs to get comfortable with school vocabulary." },
      { id: "info-6-2", title: "Nervous about British school system and making new friends" }
    ]
  },
  {
    id: 7,
    lessonTopic: "Visiting a doctor after a sports injury",
    lessonFocus: "Describing symptoms and asking for advice",
    additionalInfo: "David [25] twisted his ankle playing football and is unsure whether to go to the ER.",
    grammarFocus: "Past Simple",
    topicTiles: [
      { id: "topic-7-1", title: "Visiting a doctor after a sports injury" },
      { id: "topic-7-2", title: "Describing medical emergencies" }
    ],
    focusTiles: [
      { id: "focus-7-1", title: "Describing symptoms and asking for advice" },
      { id: "focus-7-2", title: "Understanding medical recommendations" }
    ],
    infoTiles: [
      { id: "info-7-1", title: "David [25] twisted his ankle playing football and is unsure whether to go to the ER." },
      { id: "info-7-2", title: "Pain level moderate, concerned about cost vs. necessity" }
    ]
  },
  {
    id: 8,
    lessonTopic: "Asking for help at an electronics store abroad",
    lessonFocus: "Explaining problems and understanding instructions",
    additionalInfo: "Emma [27] is in Paris and her laptop suddenly stopped working — she needs help fast.",
    grammarFocus: "Relative Clauses",
    topicTiles: [
      { id: "topic-8-1", title: "Asking for help at an electronics store abroad" },
      { id: "topic-8-2", title: "Solving technical problems while traveling" }
    ],
    focusTiles: [
      { id: "focus-8-1", title: "Explaining problems and understanding instructions" },
      { id: "focus-8-2", title: "Communicating technical issues clearly" }
    ],
    infoTiles: [
      { id: "info-8-1", title: "Emma [27] is in Paris and her laptop suddenly stopped working — she needs help fast." },
      { id: "info-8-2", title: "Important work deadline, limited French language skills" }
    ]
  },
  {
    id: 9,
    lessonTopic: "Giving a presentation on climate change",
    lessonFocus: "Presenting arguments and using statistics",
    additionalInfo: "Tom [22] is preparing a group project for university about global warming trends in Europe.",
    grammarFocus: "Passive Voice",
    topicTiles: [
      { id: "topic-9-1", title: "Giving a presentation on climate change" },
      { id: "topic-9-2", title: "Academic presentations and research" }
    ],
    focusTiles: [
      { id: "focus-9-1", title: "Presenting arguments and using statistics" },
      { id: "focus-9-2", title: "Explaining complex data and trends" }
    ],
    infoTiles: [
      { id: "info-9-1", title: "Tom [22] is preparing a group project for university about global warming trends in Europe." },
      { id: "info-9-2", title: "Nervous about presenting to professors and classmates" }
    ]
  },
  {
    id: 10,
    lessonTopic: "Chatting at a wedding reception",
    lessonFocus: "Making small talk and asking polite questions",
    additionalInfo: "Lily [38] doesn't know many people at her cousin's wedding and wants to make conversation.",
    grammarFocus: "Question Formation",
    topicTiles: [
      { id: "topic-10-1", title: "Chatting at a wedding reception" },
      { id: "topic-10-2", title: "Social conversations at formal events" }
    ],
    focusTiles: [
      { id: "focus-10-1", title: "Making small talk and asking polite questions" },
      { id: "focus-10-2", title: "Connecting with strangers at social events" }
    ],
    infoTiles: [
      { id: "info-10-1", title: "Lily [38] doesn't know many people at her cousin's wedding and wants to make conversation." },
      { id: "info-10-2", title: "Feeling shy but wants to be social and friendly" }
    ]
  },
  // ... continue with remaining sets 11-30
  {
    id: 11,
    lessonTopic: "Booking an Airbnb for a family vacation",
    lessonFocus: "Asking detailed questions and checking availability",
    additionalInfo: "Chris [42] is planning a summer trip to Italy with his wife and two kids.",
    grammarFocus: "Future Forms: \"Will\" vs. \"Going to\"",
    topicTiles: [
      { id: "topic-11-1", title: "Booking an Airbnb for a family vacation" },
      { id: "topic-11-2", title: "Planning family trips to Italy" }
    ],
    focusTiles: [
      { id: "focus-11-1", title: "Asking detailed questions and checking availability" },
      { id: "focus-11-2", title: "Ensuring family-friendly accommodations" }
    ],
    infoTiles: [
      { id: "info-11-1", title: "Chris [42] is planning a summer trip to Italy with his wife and two kids." },
      { id: "info-11-2", title: "Need child-safe accommodation with kitchen facilities" }
    ]
  },
  {
    id: 12,
    lessonTopic: "Making a complaint at a restaurant",
    lessonFocus: "Describing issues and being polite",
    additionalInfo: "Anna [29] received cold food and a rude response from staff during a business dinner.",
    grammarFocus: "Modals of Advice and Obligation",
    topicTiles: [
      { id: "topic-12-1", title: "Making a complaint at a restaurant" },
      { id: "topic-12-2", title: "Handling poor customer service professionally" }
    ],
    focusTiles: [
      { id: "focus-12-1", title: "Describing issues and being polite" },
      { id: "focus-12-2", title: "Maintaining professionalism in difficult situations" }
    ],
    infoTiles: [
      { id: "info-12-1", title: "Anna [29] received cold food and a rude response from staff during a business dinner." },
      { id: "info-12-2", title: "Important client present, needs to handle situation diplomatically" }
    ]
  },
  {
    id: 13,
    lessonTopic: "Discussing past travel experiences",
    lessonFocus: "Telling stories and describing memorable moments",
    additionalInfo: "Ben [34] wants to share his trip to Morocco with colleagues during a team-building session.",
    grammarFocus: "Past Simple",
    topicTiles: [
      { id: "topic-13-1", title: "Discussing past travel experiences" },
      { id: "topic-13-2", title: "Sharing travel stories from Morocco" }
    ],
    focusTiles: [
      { id: "focus-13-1", title: "Telling stories and describing memorable moments" },
      { id: "focus-13-2", title: "Engaging colleagues with travel anecdotes" }
    ],
    infoTiles: [
      { id: "info-13-1", title: "Ben [34] wants to share his trip to Morocco with colleagues during a team-building session." },
      { id: "info-13-2", title: "Amazing cultural experiences, wants to inspire others to travel" }
    ]
  },
  {
    id: 14,
    lessonTopic: "Preparing for a conference call with US partners",
    lessonFocus: "Clarifying information and confirming details",
    additionalInfo: "Julia [45] works in HR at a Polish company and needs to host a bilingual Zoom meeting.",
    grammarFocus: "Present Perfect",
    topicTiles: [
      { id: "topic-14-1", title: "Preparing for a conference call with US partners" },
      { id: "topic-14-2", title: "Managing international business meetings" }
    ],
    focusTiles: [
      { id: "focus-14-1", title: "Clarifying information and confirming details" },
      { id: "focus-14-2", title: "Leading bilingual professional discussions" }
    ],
    infoTiles: [
      { id: "info-14-1", title: "Julia [45] works in HR at a Polish company and needs to host a bilingual Zoom meeting." },
      { id: "info-14-2", title: "Discussing employee policies with American headquarters" }
    ]
  },
  {
    id: 15,
    lessonTopic: "Helping a friend write a dating profile",
    lessonFocus: "Describing personality and interests",
    additionalInfo: "Mia [33] is helping her best friend describe himself honestly but attractively on Bumble.",
    grammarFocus: "Adjectives and Adverbs",
    topicTiles: [
      { id: "topic-15-1", title: "Helping a friend write a dating profile" },
      { id: "topic-15-2", title: "Creating attractive online dating profiles" }
    ],
    focusTiles: [
      { id: "focus-15-1", title: "Describing personality and interests" },
      { id: "focus-15-2", title: "Balancing honesty with appeal in self-description" }
    ],
    infoTiles: [
      { id: "info-15-1", title: "Mia [33] is helping her best friend describe himself honestly but attractively on Bumble." },
      { id: "info-15-2", title: "Friend is shy but interesting, needs confidence boost" }
    ]
  },
  {
    id: 16,
    lessonTopic: "Booking a ski trip for a group of friends",
    lessonFocus: "Asking for package deals and negotiating prices",
    additionalInfo: "Adam [31] is organizing a winter trip to Austria for 6 people in January.",
    grammarFocus: "Countable and Uncountable Nouns",
    topicTiles: [
      { id: "topic-16-1", title: "Booking a ski trip for a group of friends" },
      { id: "topic-16-2", title: "Organizing group winter vacations in Austria" }
    ],
    focusTiles: [
      { id: "focus-16-1", title: "Asking for package deals and negotiating prices" },
      { id: "focus-16-2", title: "Coordinating group bookings and payments" }
    ],
    infoTiles: [
      { id: "info-16-1", title: "Adam [31] is organizing a winter trip to Austria for 6 people in January." },
      { id: "info-16-2", title: "Mixed skiing abilities, need budget-friendly options" }
    ]
  },
  {
    id: 17,
    lessonTopic: "Describing your dream home",
    lessonFocus: "Using descriptive language and comparisons",
    additionalInfo: "Kate [39] and her husband are looking to move and are discussing features they want.",
    grammarFocus: "Comparatives and Superlatives",
    topicTiles: [
      { id: "topic-17-1", title: "Describing your dream home" },
      { id: "topic-17-2", title: "House hunting and property features" }
    ],
    focusTiles: [
      { id: "focus-17-1", title: "Using descriptive language and comparisons" },
      { id: "focus-17-2", title: "Discussing home preferences with spouse" }
    ],
    infoTiles: [
      { id: "info-17-1", title: "Kate [39] and her husband are looking to move and are discussing features they want." },
      { id: "info-17-2", title: "Growing family, need more space and better location" }
    ]
  },
  {
    id: 18,
    lessonTopic: "Preparing a CV for an internship",
    lessonFocus: "Talking about education, skills, and ambitions",
    additionalInfo: "Oliver [19] is applying for his first internship at a marketing firm in London.",
    grammarFocus: "Present Simple",
    topicTiles: [
      { id: "topic-18-1", title: "Preparing a CV for an internship" },
      { id: "topic-18-2", title: "First job applications and career preparation" }
    ],
    focusTiles: [
      { id: "focus-18-1", title: "Talking about education, skills, and ambitions" },
      { id: "focus-18-2", title: "Presenting limited experience positively" }
    ],
    infoTiles: [
      { id: "info-18-1", title: "Oliver [19] is applying for his first internship at a marketing firm in London." },
      { id: "info-18-2", title: "University student, enthusiastic but lacks work experience" }
    ]
  },
  {
    id: 19,
    lessonTopic: "Writing a complaint to a delivery company",
    lessonFocus: "Explaining what went wrong and requesting action",
    additionalInfo: "Grace [37] didn't receive her package despite a \"delivered\" notice and can't reach support.",
    grammarFocus: "Passive Voice",
    topicTiles: [
      { id: "topic-19-1", title: "Writing a complaint to a delivery company" },
      { id: "topic-19-2", title: "Dealing with lost package and poor service" }
    ],
    focusTiles: [
      { id: "focus-19-1", title: "Explaining what went wrong and requesting action" },
      { id: "focus-19-2", title: "Escalating customer service issues effectively" }
    ],
    infoTiles: [
      { id: "info-19-1", title: "Grace [37] didn't receive her package despite a \"delivered\" notice and can't reach support." },
      { id: "info-19-2", title: "Expensive item missing, needs urgent resolution" }
    ]
  },
  {
    id: 20,
    lessonTopic: "Introducing yourself in a professional setting",
    lessonFocus: "Sharing job role and responsibilities",
    additionalInfo: "Daniel [40] is attending a networking event for fintech professionals in Warsaw.",
    grammarFocus: "Present Simple",
    topicTiles: [
      { id: "topic-20-1", title: "Introducing yourself in a professional setting" },
      { id: "topic-20-2", title: "Networking at fintech industry events" }
    ],
    focusTiles: [
      { id: "focus-20-1", title: "Sharing job role and responsibilities" },
      { id: "focus-20-2", title: "Making professional connections and partnerships" }
    ],
    infoTiles: [
      { id: "info-20-1", title: "Daniel [40] is attending a networking event for fintech professionals in Warsaw." },
      { id: "info-20-2", title: "Looking for new business opportunities and partnerships" }
    ]
  },
  {
    id: 21,
    lessonTopic: "Giving directions to a tourist",
    lessonFocus: "Using landmarks and clear sequencing",
    additionalInfo: "Ella [26] works in a bookstore in Prague and often gets asked how to find popular sites.",
    grammarFocus: "Imperatives and Sequencing Words",
    topicTiles: [
      { id: "topic-21-1", title: "Giving directions to a tourist" },
      { id: "topic-21-2", title: "Helping visitors navigate Prague landmarks" }
    ],
    focusTiles: [
      { id: "focus-21-1", title: "Using landmarks and clear sequencing" },
      { id: "focus-21-2", title: "Explaining routes to popular tourist destinations" }
    ],
    infoTiles: [
      { id: "info-21-1", title: "Ella [26] works in a bookstore in Prague and often gets asked how to find popular sites." },
      { id: "info-21-2", title: "Enjoys helping tourists, wants to give clear directions" }
    ]
  },
  {
    id: 22,
    lessonTopic: "Talking about childhood memories",
    lessonFocus: "Describing events and people from the past",
    additionalInfo: "James [35] wants to share stories with his daughter in English at bedtime.",
    grammarFocus: "Used to / Be used to",
    topicTiles: [
      { id: "topic-22-1", title: "Talking about childhood memories" },
      { id: "topic-22-2", title: "Sharing family stories and traditions" }
    ],
    focusTiles: [
      { id: "focus-22-1", title: "Describing events and people from the past" },
      { id: "focus-22-2", title: "Creating engaging bedtime stories" }
    ],
    infoTiles: [
      { id: "info-22-1", title: "James [35] wants to share stories with his daughter in English at bedtime." },
      { id: "info-22-2", title: "Bilingual family, wants daughter to hear family history" }
    ]
  },
  {
    id: 23,
    lessonTopic: "Canceling a gym membership",
    lessonFocus: "Giving reasons and negotiating terms",
    additionalInfo: "Olivia [29] moved to a new city and wants to cancel her current gym contract early.",
    grammarFocus: "Conditionals (2nd)",
    topicTiles: [
      { id: "topic-23-1", title: "Canceling a gym membership" },
      { id: "topic-23-2", title: "Breaking contracts due to relocation" }
    ],
    focusTiles: [
      { id: "focus-23-1", title: "Giving reasons and negotiating terms" },
      { id: "focus-23-2", title: "Avoiding cancellation fees and penalties" }
    ],
    infoTiles: [
      { id: "info-23-1", title: "Olivia [29] moved to a new city and wants to cancel her current gym contract early." },
      { id: "info-23-2", title: "Annual contract with 6 months remaining, seeking fair solution" }
    ]
  },
  {
    id: 24,
    lessonTopic: "Making future plans with old university friends",
    lessonFocus: "Talking about schedules and possible meetups",
    additionalInfo: "Liam [33] wants to arrange a group trip to Lisbon next spring with former classmates.",
    grammarFocus: "Future Continuous",
    topicTiles: [
      { id: "topic-24-1", title: "Making future plans with old university friends" },
      { id: "topic-24-2", title: "Organizing reunion trips to Portugal" }
    ],
    focusTiles: [
      { id: "focus-24-1", title: "Talking about schedules and possible meetups" },
      { id: "focus-24-2", title: "Coordinating group travel with busy professionals" }
    ],
    infoTiles: [
      { id: "info-24-1", title: "Liam [33] wants to arrange a group trip to Lisbon next spring with former classmates." },
      { id: "info-24-2", title: "Group scattered across Europe, need to find common dates" }
    ]
  },
  {
    id: 25,
    lessonTopic: "Discussing sustainability habits",
    lessonFocus: "Describing routines and giving suggestions",
    additionalInfo: "Zoe [27] wants to talk about her plastic-free lifestyle with her flatmates.",
    grammarFocus: "Present Simple and Modals",
    topicTiles: [
      { id: "topic-25-1", title: "Discussing sustainability habits" },
      { id: "topic-25-2", title: "Promoting eco-friendly lifestyle choices" }
    ],
    focusTiles: [
      { id: "focus-25-1", title: "Describing routines and giving suggestions" },
      { id: "focus-25-2", title: "Inspiring others to adopt green practices" }
    ],
    infoTiles: [
      { id: "info-25-1", title: "Zoe [27] wants to talk about her plastic-free lifestyle with her flatmates." },
      { id: "info-25-2", title: "Passionate about environment, wants to influence shared household" }
    ]
  },
  {
    id: 26,
    lessonTopic: "Talking about a favorite movie",
    lessonFocus: "Giving opinions and summarizing plot",
    additionalInfo: "Ethan [24] wants to write a short review for his English book club.",
    grammarFocus: "Past Simple and Adjectives",
    topicTiles: [
      { id: "topic-26-1", title: "Talking about a favorite movie" },
      { id: "topic-26-2", title: "Writing film reviews and recommendations" }
    ],
    focusTiles: [
      { id: "focus-26-1", title: "Giving opinions and summarizing plot" },
      { id: "focus-26-2", title: "Engaging book club with film discussions" }
    ],
    infoTiles: [
      { id: "info-26-1", title: "Ethan [24] wants to write a short review for his English book club." },
      { id: "info-26-2", title: "Loves cinema, wants to share enthusiasm with reading group" }
    ]
  },
  {
    id: 27,
    lessonTopic: "Explaining how a product works",
    lessonFocus: "Describing processes and giving instructions",
    additionalInfo: "Ava [31] is a customer support agent explaining a new coffee machine setup.",
    grammarFocus: "Passive Voice",
    topicTiles: [
      { id: "topic-27-1", title: "Explaining how a product works" },
      { id: "topic-27-2", title: "Customer support for technical products" }
    ],
    focusTiles: [
      { id: "focus-27-1", title: "Describing processes and giving instructions" },
      { id: "focus-27-2", title: "Troubleshooting and technical support" }
    ],
    infoTiles: [
      { id: "info-27-1", title: "Ava [31] is a customer support agent explaining a new coffee machine setup." },
      { id: "info-27-2", title: "Complex product with multiple features, needs clear explanations" }
    ]
  },
  {
    id: 28,
    lessonTopic: "Talking about future hopes and dreams",
    lessonFocus: "Describing plans and expectations",
    additionalInfo: "Lucas [22] wants to practice expressing his goals during coaching sessions.",
    grammar Focus: "Future Forms",
    topicTiles: [
      { id: "topic-28-1", title: "Talking about future hopes and dreams" },
      { id: "topic-28-2", title: "Career coaching and personal development" }
    ],
    focusTiles: [
      { id: "focus-28-1", title: "Describing plans and expectations" },
      { id: "focus-28-2", title: "Articulating ambitions and career goals" }
    ],
    infoTiles: [
      { id: "info-28-1", title: "Lucas [22] wants to practice expressing his goals during coaching sessions." },
      { id: "info-28-2", title: "Recent graduate, uncertain about career path but motivated" }
    ]
  },
  {
    id: 29,
    lessonTopic: "Visiting a dentist abroad",
    lessonFocus: "Describing pain and asking about procedures",
    additionalInfo: "Laura [34] chipped a tooth while on holiday in Croatia and needs to get it fixed.",
    grammarFocus: "Modals of Advice and Obligation",
    topicTiles: [
      { id: "topic-29-1", title: "Visiting a dentist abroad" },
      { id: "topic-29-2", title: "Emergency dental care while traveling" }
    ],
    focusTiles: [
      { id: "focus-29-1", title: "Describing pain and asking about procedures" },
      { id: "focus-29-2", title: "Understanding medical treatment options" }
    ],
    infoTiles: [
      { id: "info-29-1", title: "Laura [34] chipped a tooth while on holiday in Croatia and needs to get it fixed." },
      { id: "info-29-2", title: "Concerned about cost and quality of treatment abroad" }
    ]
  },
  {
    id: 30,
    lessonTopic: "Interviewing someone for a school newspaper",
    lessonFocus: "Asking open-ended questions and paraphrasing answers",
    additionalInfo: "Henry [17] is preparing an interview with a local artist for his school's newsletter.",
    grammarFocus: "Reported Speech",
    topicTiles: [
      { id: "topic-30-1", title: "Interviewing someone for a school newspaper" },
      { id: "topic-30-2", title: "Student journalism and local community stories" }
    ],
    focusTiles: [
      { id: "focus-30-1", title: "Asking open-ended questions and paraphrasing answers" },
      { id: "focus-30-2", title: "Creating engaging interview content" }
    ],
    infoTiles: [
      { id: "info-30-1", title: "Henry [17] is preparing an interview with a local artist for his school's newsletter." },
      { id: "info-30-2", title: "First interview assignment, nervous but excited about journalism" }
    ]
  }
];

export const ENGLISH_LEVEL_DESCRIPTIONS = {
  "A1/A2": "Beginner/Elementary",
  "B1/B2": "Intermediate/Upper-Intermediate", 
  "C1/C2": "Advanced/Proficiency"
};

// Synchronized placeholders - pozostają bez zmian
export const SYNCHRONIZED_PLACEHOLDERS = [
  {
    lessonTopic: "Preparing for a job interview at Amazon for a logistics specialist role",
    lessonFocus: "Answer difficult questions about past experience and gaps in the CV",
    additionalInfo: "Student: Daniel [34], interview on Monday in Wrocław. He's nervous about explaining a 2‑year career break after moving countries and raising his daughter.",
    grammarFocus: "Using present perfect to talk about experience and gaps in employment"
  },
  {
    lessonTopic: "Travelling to Boston with a toddler for the first time",
    lessonFocus: "Communicate with airport staff and ask for help in case of delays or problems",
    additionalInfo: "Student: Emily [29], flying alone with her 2-year-old son next Friday. Worried about managing hand luggage, boarding, and asking for warm water during the flight.",
    grammarFocus: "Making polite requests and asking questions using could/would"
  },
  {
    lessonTopic: "Making small talk with new coworkers during coffee breaks",
    lessonFocus: "Join casual conversations, respond naturally, and avoid awkward silences",
    additionalInfo: "Student: Mike [41], started working at Deloitte Kraków last month. Wants to feel more confident when chatting informally in the kitchen.",
    grammarFocus: "Practising small talk structures: question tags, short responses"
  },
  {
    lessonTopic: "Talking to a teacher at a parent-teacher meeting in London",
    lessonFocus: "Ask specific questions about the child's progress and explain concerns clearly",
    additionalInfo: "Student: Laura [38], her son Oliver is struggling with reading. She needs to talk to Ms. Edwards at Kingsway Primary this Thursday.",
    grammarFocus: "Using present simple and continuous to describe school situations"
  },
  {
    lessonTopic: "Solving a delivery issue with a missing IKEA order by phone",
    lessonFocus: "Describe the problem clearly, stay polite, and insist on a solution",
    additionalInfo: "Student: James [45], ordered furniture online but received the wrong items. Needs to call customer support and doesn't want to get ignored.",
    grammarFocus: "Polite complaints: using passive voice and indirect language"
  }
];

// Stare kafelki - zachowane dla kompatybilności wstecznej
export const LESSON_TOPICS: Tile[] = [
  { id: "topic-1", title: "IT: debugging code" },
  { id: "topic-2", title: "Business negotiations" },
  { id: "topic-3", title: "Travel planning" },
  { id: "topic-4", title: "Healthy eating habits" },
  { id: "topic-5", title: "Job interviews" },
  { id: "topic-6", title: "Financial planning" },
  { id: "topic-7", title: "Home improvement projects" },
  { id: "topic-8", title: "Environmental issues" },
  { id: "topic-9", title: "Cultural differences" },
  { id: "topic-10", title: "Online shopping" }
];

export const LESSON_GOALS: Tile[] = [
  { id: "goal-1", title: "Preparing for a work presentation on AI" },
  { id: "goal-2", title: "Improving communication skills with clients" },
  { id: "goal-3", title: "Learning how to order food in a restaurant" },
  { id: "goal-4", title: "Understanding different accents" },
  { id: "goal-5", title: "Writing professional emails" },
  { id: "goal-6", title: "Negotiating a salary increase" },
  { id: "goal-7", title: "Participating in a conference call" },
  { id: "goal-8", title: "Giving feedback to colleagues" },
  { id: "goal-9", title: "Networking at industry events" },
  { id: "goal-10", title: "Managing conflicts in the workplace" }
];

// Nowy system kafelków podzielony na kategorie dla Lesson Topic
export const LESSON_TOPIC_TILES: Record<string, Tile[]> = {
  // A. Specific Scenario (8)
  specificScenario: [
    { id: "topic-a1", title: "Preparing for a job interview at Amazon for a logistics specialist role" },
    { id: "topic-a2", title: "Travelling to Boston with a toddler for the first time" },
    { id: "topic-a3", title: "Making small talk with new coworkers during coffee breaks" },
    { id: "topic-a4", title: "Talking to a teacher at a parent‑teacher meeting in London" },
    { id: "topic-a5", title: "Solving a delivery issue with a missing IKEA order by phone" },
    { id: "topic-a6", title: "Organizing a surprise birthday party for a colleague" },
    { id: "topic-a7", title: "Negotiating a freelance contract with an international client" },
    { id: "topic-a8", title: "Explaining a two‑year career break due to caregiving responsibilities" }
  ],
  // B. Role & Profession (6)
  roleProfession: [
    { id: "topic-b1", title: "Writing emails to suppliers for a café chain" },
    { id: "topic-b2", title: "Presenting quarterly sales figures to management" },
    { id: "topic-b3", title: "Conducting a code review in a software team" },
    { id: "topic-b4", title: "Leading a brainstorming session in a marketing agency" },
    { id: "topic-b5", title: "Interviewing candidates for a UX designer position" },
    { id: "topic-b6", title: "Training new interns in a finance department" }
  ],
  // C. Everyday Life (6)
  everydayLife: [
    { id: "topic-c1", title: "Discussing weekend plans with friends over coffee" },
    { id: "topic-c2", title: "Explaining your morning routine in detail" },
    { id: "topic-c3", title: "Rescheduling a dentist appointment by phone" },
    { id: "topic-c4", title: "Calling a landlord about a broken heater" },
    { id: "topic-c5", title: "Planning a family dinner menu" },
    { id: "topic-c6", title: "Asking a neighbor to pick up your mail" }
  ],
  // D. Travel & Leisure (6)
  travelLeisure: [
    { id: "topic-d1", title: "Booking a boutique hotel in Barcelona" },
    { id: "topic-d2", title: "Creating a 5‑day hiking itinerary in the Alps" },
    { id: "topic-d3", title: "Buying concert tickets online for a friend" },
    { id: "topic-d4", title: "Arranging a city tour with a local guide" },
    { id: "topic-d5", title: "Renting a car for a road trip through Scotland" },
    { id: "topic-d6", title: "Choosing activities for a beach holiday in Greece" }
  ],
  // E. Emotional Context (4)
  emotionalContext: [
    { id: "topic-e1", title: "Calming nerves before a public speech" },
    { id: "topic-e2", title: "Expressing frustration after a project setback" },
    { id: "topic-e3", title: "Apologizing sincerely after a misunderstanding" },
    { id: "topic-e4", title: "Celebrating a small victory at work" }
  ],
  // F. Task‑Oriented (4)
  taskOriented: [
    { id: "topic-f1", title: "Booking a doctor's appointment online" },
    { id: "topic-f2", title: "Requesting a refund for a faulty product" },
    { id: "topic-f3", title: "Ordering groceries for home delivery" },
    { id: "topic-f4", title: "Registering for a professional conference" }
  ],
  // G. Open‑Ended Inspiration (4)
  openEnded: [
    { id: "topic-g1", title: "Discussing life goals and aspirations" },
    { id: "topic-g2", title: "Describing your perfect day off" },
    { id: "topic-g3", title: "Imagining the workplace of the future" },
    { id: "topic-g4", title: "Brainstorming ideas for a passion project" }
  ],
  // H. Fun & Creative (4)
  funCreative: [
    { id: "topic-h1", title: "Designing a themed costume for Halloween party" },
    { id: "topic-h2", title: "Writing a short poem about your favorite season" },
    { id: "topic-h3", title: "Inventing a new gadget that solves daily chores" },
    { id: "topic-h4", title: "Planning a karaoke night setlist for friends" }
  ]
};

// Nowy system kafelków podzielony na kategorie dla Lesson Focus
export const LESSON_FOCUS_TILES: Record<string, Tile[]> = {
  specificScenario: [
    { id: "focus-a1", title: "Answer tricky competency questions under pressure" },
    { id: "focus-a2", title: "Navigate a flight delay and rebooking process" },
    { id: "focus-a3", title: "Initiate small talk with new teammates" },
    { id: "focus-a4", title: "Advocate for your child's needs at school meeting" },
    { id: "focus-a5", title: "Escalate a customer complaint to a supervisor" },
    { id: "focus-a6", title: "Coordinate a surprise event without revealing details" },
    { id: "focus-a7", title: "Negotiate a freelance rate confidently" },
    { id: "focus-a8", title: "Explain a gap in your CV clearly" }
  ],
  roleProfession: [
    { id: "focus-b1", title: "Deliver a concise team status update" },
    { id: "focus-b2", title: "Lead a client presentation on new product features" },
    { id: "focus-b3", title: "Draft a press release for a corporate event" },
    { id: "focus-b4", title: "Conduct a virtual training session" },
    { id: "focus-b5", title: "Perform a job shadowing introduction" },
    { id: "focus-b6", title: "Negotiate deliverables with a project manager" }
  ],
  everydayLife: [
    { id: "focus-c1", title: "Ask for help when your phone's battery dies" },
    { id: "focus-c2", title: "Explain dietary restrictions at a restaurant" },
    { id: "focus-c3", title: "Arrange a playdate for your child" },
    { id: "focus-c4", title: "Report a lost wallet to the police station" },
    { id: "focus-c5", title: "Give directions to a stranger on the street" },
    { id: "focus-c6", title: "Return a damaged item to a store" }
  ],
  travelLeisure: [
    { id: "focus-d1", title: "Plan airport transfer with tight connection" },
    { id: "focus-d2", title: "Book a guided wine tour in Bordeaux" },
    { id: "focus-d3", title: "Select the best travel insurance plan" },
    { id: "focus-d4", title: "Reserve seats for a city sightseeing bus" },
    { id: "focus-d5", title: "Rent sports equipment during vacation" },
    { id: "focus-d6", title: "Inquire about pet policies at hotels" }
  ],
  emotionalContext: [
    { id: "focus-e1", title: "Express disappointment over a cancelled event" },
    { id: "focus-e2", title: "Thank a colleague for unexpected support" },
    { id: "focus-e3", title: "Apologize for missing an important deadline" },
    { id: "focus-e4", title: "Celebrate finishing a challenging project" }
  ],
  taskOriented: [
    { id: "focus-f1", title: "Schedule a dentist appointment via email" },
    { id: "focus-f2", title: "Submit a warranty claim online" },
    { id: "focus-f3", title: "Order office supplies for next week" },
    { id: "focus-f4", title: "Register for a newsletter with a special code" }
  ],
  openEnded: [
    { id: "focus-g1", title: "Reflect on your personal strengths" },
    { id: "focus-g2", title: "Imagine your dream career path" },
    { id: "focus-g3", title: "Brainstorm solutions for a community problem" },
    { id: "focus-g4", title: "Discuss habits that boost productivity" }
  ],
  funCreative: [
    { id: "focus-h1", title: "Write a funny job ad for a pet sitter" },
    { id: "focus-h2", title: "Create a meme about remote work" },
    { id: "focus-h3", title: "Invent a fictional travel destination" },
    { id: "focus-h4", title: "Design a motivational office poster" }
  ]
};

// Nowy system kafelków podzielony na kategorie dla Additional Information
export const ADDITIONAL_INFO_TILES: Record<string, Tile[]> = {
  specificScenario: [
    { id: "info-a1", title: "Student: Lucy [30], relocating to Munich next month, needs airport German too" },
    { id: "info-a2", title: "Student: Mark [42], managing remote team across time zones, struggles with async calls" },
    { id: "info-a3", title: "Student: Anna [27], recovering from surgery, wants telehealth vocabulary" },
    { id: "info-a4", title: "Student: Jake [35], planning a surprise anniversary trip, needs gift suggestions" },
    { id: "info-a5", title: "Student: Sophie [29], editing a blog post for international audience" },
    { id: "info-a6", title: "Student: Tom [50], upgrading to electric car, learning charging station terms" },
    { id: "info-a7", title: "Student: Mia [33], volunteering in Kenya, needs medical mission phrases" },
    { id: "info-a8", title: "Student: Leo [28], training for Boston Marathon, wants sports commentary vocab" }
  ],
  roleProfession: [
    { id: "info-b1", title: "Software engineer at Google, presenting sprint demo" },
    { id: "info-b2", title: "HR manager scheduling interviews for 20 candidates" },
    { id: "info-b3", title: "Event planner organizing a 200‑person conference" },
    { id: "info-b4", title: "Customer support rep handling high‑priority tickets" },
    { id: "info-b5", title: "Graphic designer pitching concept to a brewery" },
    { id: "info-b6", title: "Financial analyst writing quarterly forecasts" }
  ],
  everydayLife: [
    { id: "info-c1", title: "Prefers WhatsApp over email; allergic to shellfish" },
    { id: "info-c2", title: "Lives in a shared flat; needs polite roommate phrases" },
    { id: "info-c3", title: "Volunteers every weekend; likes sustainability topics" },
    { id: "info-c4", title: "Plays guitar; wants music-related vocabulary" },
    { id: "info-c5", title: "Cooking enthusiast; shares recipes with friends" },
    { id: "info-c6", title: "Learning photography; needs critique language" }
  ],
  travelLeisure: [
    { id: "info-d1", title: "Backpacking across Southeast Asia for 3 months" },
    { id: "info-d2", title: "Cruise to the Caribbean with travel insurance concerns" },
    { id: "info-d3", title: "Road trip along Route 66 in a vintage car" },
    { id: "info-d4", title: "Voluntourism in Costa Rica; needs jungle survival terms" },
    { id: "info-d5", title: "Skiing holiday in the Alps; booking equipment rental" },
    { id: "info-d6", title: "Attending Burning Man; discussing camp logistics" }
  ],
  emotionalContext: [
    { id: "info-e1", title: "Anxious about public speaking at a wedding toast" },
    { id: "info-e2", title: "Frustrated after losing important documents" },
    { id: "info-e3", title: "Excited about starting a new hobby" },
    { id: "info-e4", title: "Overwhelmed by relocation stress" }
  ],
  taskOriented: [
    { id: "info-f1", title: "Need steps to set up a VPN at home" },
    { id: "info-f2", title: "How to apply for a visa extension online" },
    { id: "info-f3", title: "Process for returning an online purchase" },
    { id: "info-f4", title: "Guide to scheduling a medical check‑up" }
  ],
  openEnded: [
    { id: "info-g1", title: "Share your biggest career ambition" },
    { id: "info-g2", title: "Describe your ideal community project" },
    { id: "info-g3", title: "Imagine your perfect language learning environment" },
    { id: "info-g4", title: "Discuss values most important to you" }
  ],
  funCreative: [
    { id: "info-h1", title: "Write a humorous ad for a flying car" },
    { id: "info-h2", title: "Create a slogan for a zero‑gravity café" },
    { id: "info-h3", title: "Invent a holiday that celebrates laughter" },
    { id: "info-h4", title: "Design a mascot for an intergalactic school" }
  ]
};
