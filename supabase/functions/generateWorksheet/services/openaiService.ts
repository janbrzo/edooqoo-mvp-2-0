
/**
 * Obsługa integracji z OpenAI
 */

import OpenAI from "https://esm.sh/openai@4.28.0";

// Funkcja przygotowująca prompt systemowy dla OpenAI
export function prepareSystemPrompt(
  lessonTopic: string,
  lessonGoal: string,
  teachingPreferences: string,
  studentProfile: string,
  mainStruggles: string,
  exerciseCount: number,
  exerciseTypes: string[]
): string {
  return `You are an expert ESL English language teacher specialized in creating a context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

Lesson topic: ${lessonTopic}
Lesson goal: ${lessonGoal}
Teaching preferences: ${teachingPreferences}
Student Profile: ${studentProfile}
Main Struggles: ${mainStruggles}

# How to use each field:
1. Lesson topic:
   - Use 'Lesson topic' to set the theme of reading passages and matching items.
   - Anchor all vocabulary and examples around the 'Lesson topic' to ensure coherence.

2. Lesson goal:
   - Use 'Lesson goal' to focus exercises on the specified skill (e.g., listening vs. speaking).
   - Prioritize tasks that train the proficiency stated in 'Lesson goal' (e.g., accurately form questions).

3. Teaching preferences:
   - Incorporate formats aligned with 'Teaching preferences' (e.g., pair dialogues if student thrives in interaction).
   - Choose exercise types and visuals according to 'Teaching preferences' (e.g., more images for visual learners).

4. Student Profile:
   - Adjust language register to the 'Student Profile' (e.g., use industry-specific jargon if student is a finance professional).
   - Customize examples and context based on 'Student Profile' demographics (age, interests, background).

5. Main Struggles:
   - Include targeted drills on structures listed in 'Main Struggles' (e.g., extra practice with past perfect).
   - Emphasize error-correction exercises addressing the 'Main Struggles' to reinforce weak areas.

Generate a structured JSON worksheet with the following format:

{
  "title": "Main Title of the Worksheet",
  "subtitle": "Subtitle Related to the Topic",
  "introduction": "Brief introduction paragraph about the worksheet topic and goals",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text and answer the questions below.",
      "content": "<reading passage of 280–320 words here>",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Term 1", "definition": "Definition 1"},
        {"term": "Term 2", "definition": "Definition 2"},
        {"term": "Term 3", "definition": "Definition 3"},
        {"term": "Term 4", "definition": "Definition 4"},
        {"term": "Term 5", "definition": "Definition 5"},
        {"term": "Term 6", "definition": "Definition 6"},
        {"term": "Term 7", "definition": "Definition 7"},
        {"term": "Term 8", "definition": "Definition 8"},
        {"term": "Term 9", "definition": "Definition 9"},
        {"term": "Term 10", "definition": "Definition 10"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
      "sentences": [
        {"text": "Sentence with _____ blank.", "answer": "word1"},
        {"text": "Another _____ here.", "answer": "word2"},
        {"text": "Third sentence with a _____ to complete.", "answer": "word3"},
        {"text": "Fourth sentence _____ blank.", "answer": "word4"},
        {"text": "Fifth sentence needs a _____ here.", "answer": "word5"},
        {"text": "Sixth _____ for completion.", "answer": "word6"},
        {"text": "Seventh sentence with _____ word missing.", "answer": "word7"},
        {"text": "Eighth sentence requires a _____.", "answer": "word8"},
        {"text": "Ninth sentence has a _____ blank.", "answer": "word9"},
        {"text": "Tenth sentence with a _____ to fill.", "answer": "word10"}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "Question 1 text?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        }
        // INCLUDE EXACTLY 10 MULTIPLE CHOICE QUESTIONS WITH 4 OPTIONS EACH
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Person A", "text": "Hello, how are you?"},
        {"speaker": "Person B", "text": "I'm fine, thank you. And you?"}
        // INCLUDE AT EXACTLY 10 DIALOGUE EXCHANGES
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", 
                     "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions in your own dialogues.",
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    },
    {
      "type": "true-false",
      "title": "Exercise 6: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Read each statement and decide if it is true or false.",
      "statements": [
        {"text": "Statement 1", "isTrue": true},
        {"text": "Statement 2", "isTrue": false},
        {"text": "Statement 3", "isTrue": true},
        {"text": "Statement 4", "isTrue": false},
        {"text": "Statement 5", "isTrue": true},
        {"text": "Statement 6", "isTrue": false},
        {"text": "Statement 7", "isTrue": true},
        {"text": "Statement 8", "isTrue": false},
        {"text": "Statement 9", "isTrue": true},
        {"text": "Statement 10", "isTrue": false}
      ],
      "teacher_tip": "Tip for teachers on this exercise. Practical and helpful Advice for teachers on how to use this exercise effectively."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
    // INCLUDE EXACTLY 15 TERMS with clear definitions
  ]
}

IMPORTANT RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}. Number them in sequence starting from Exercise 1.
3. Ensure variety and progressive difficulty.  
4. All exercises should be closely related to the specified topic and goal
5. Include specific vocabulary, expressions, and language structures related to the topic
6. Keep exercise instructions clear and concise. Students should be able to understand the tasks without any additional explanation.
7. DO NOT USE PLACEHOLDERS. Write full, complete, and high-quality content for every field. 
8. Use appropriate time values for each exercise (5-10 minutes).
9. DO NOT include any text outside of the JSON structure.
10. Exercise 1: Reading Comprehension must follow extra steps:
    - Generate the \`content\` passage between 280 and 320 words.
    - After closing JSON, on a separate line add:
      // Word count: X (must be between 280–320)
    - Don't proceed unless X ∈ [280,320].

11. Focus on overall flow, coherence and pedagogical value; minor typos acceptable.

IMPORTANT QUALITY CHECK BEFORE GENERATING:
- Grammar, spelling, formatting – near-flawless (1–2 minor typos allowed).
- Difficulty level consistent and appropriate.
- Specific vocabulary related to the topic is included.
- Confirm that Exercise 1 \`content\` is between 280 and 320 words and that the Word count comment is correct.`;
}

// Funkcja generująca dodatkowe zadania
export async function generateAdditionalExercises(
  openai: OpenAI,
  additionalExercisesNeeded: number,
  rawPrompt: string,
  existingExercises: any[],
  exerciseTypes: string[]
) {
  console.log("Generating " + additionalExercisesNeeded + " additional exercises");
  
  const additionalExercisesResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: "You are an expert ESL English language teacher specialized in creating a context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.\n          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.\n          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits."
      },
      {
        role: "user",
        content: "Create " + additionalExercisesNeeded + " additional ESL exercises related to this topic: \"" + rawPrompt + "\". \n                Use only these exercise types: " + getExerciseTypesForMissing(existingExercises, exerciseTypes) + ".\n                Each exercise should be complete with all required fields as shown in the examples.\n                Return them in valid JSON format as an array of exercises.\n                \n                Existing exercise types: " + existingExercises.map((ex: any) => ex.type).join(', ') + "\n                \n                Exercise types to use: " + getExerciseTypesForMissing(existingExercises, exerciseTypes) + "\n                \n                Number the exercises sequentially starting from " + (existingExercises.length + 1) + ".\n                \n                Example exercise formats:\n                {\n                  \"type\": \"multiple-choice\",\n                  \"title\": \"Exercise " + (existingExercises.length + 1) + ": Multiple Choice\",\n                  \"icon\": \"fa-check-square\",\n                  \"time\": 6,\n                  \"instructions\": \"Choose the best option to complete each sentence.\",\n                  \"questions\": [\n                    {\n                      \"text\": \"Question text?\",\n                      \"options\": [\n                        {\"label\": \"A\", \"text\": \"Option A\", \"correct\": false},\n                        {\"label\": \"B\", \"text\": \"Option B\", \"correct\": true},\n                        {\"label\": \"C\", \"text\": \"Option C\", \"correct\": false},\n                        {\"label\": \"D\", \"text\": \"Option D\", \"correct\": false}\n                      ]\n                    }\n                    // 10 questions total\n                  ],\n                  \"teacher_tip\": \"Tip for teachers on this exercise\"\n                }"
      }
    ],
    max_tokens: 3000
  });

  return additionalExercisesResponse;
}

// Import funkcji potrzebnej do generowania dodatkowych zadań
import { getExerciseTypesForMissing } from "../utils/exerciseUtils";
