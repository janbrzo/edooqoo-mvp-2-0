
import { Tile } from './types';

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

export const GRAMMAR_FOCUS: Tile[] = [
  { id: "grammar-1", title: "Using present perfect to talk about experience and gaps in employment" },
  { id: "grammar-2", title: "Making polite requests and asking questions using could/would" },
  { id: "grammar-3", title: "Practising small talk structures: question tags, short responses" },
  { id: "grammar-4", title: "Using present simple and continuous to describe school situations" },
  { id: "grammar-5", title: "Polite complaints: using passive voice and indirect language" }
];

export const ENGLISH_LEVEL_DESCRIPTIONS = {
  "A1/A2": "Beginner/Elementary",
  "B1/B2": "Intermediate/Upper-Intermediate", 
  "C1/C2": "Advanced/Proficiency"
};

// New synchronized placeholders with 5 sets
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
