
// OpenAI service for worksheet generation - updated with better parameters
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

export async function generateWorksheetWithAI(sanitizedPrompt: string, exerciseTypes: string[]) {
  console.log('Generating worksheet with OpenAI...');
  
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.05, // Lower temperature for more consistent JSON
    max_tokens: 12000, // Increased token limit
    messages: [
      {
        role: "system",
        content: `You are an expert ESL English language teacher. Create EXACTLY ONE complete, valid JSON worksheet.

CRITICAL RULES:
1. Generate EXACTLY 8 exercises using these types in order: ${exerciseTypes.join(', ')}
2. Return ONLY valid JSON - no markdown, no explanations, no text outside JSON
3. Reading exercise: EXACTLY 280-320 words in content field
4. All arrays must have exact counts as specified below
5. Use proper JSON escaping for quotes and special characters
6. NO trailing commas anywhere in the JSON
7. Ensure all strings are properly quoted and escaped

REQUIRED JSON STRUCTURE - RETURN EXACTLY THIS FORMAT:
{
  "title": "Worksheet Title Here",
  "subtitle": "Subtitle Here", 
  "introduction": "Introduction paragraph here",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text and answer the questions below.",
      "content": "EXACTLY 280-320 WORDS OF TEXT HERE - COUNT CAREFULLY",
      "questions": [
        {"text": "Question 1?", "answer": "Answer 1"},
        {"text": "Question 2?", "answer": "Answer 2"},
        {"text": "Question 3?", "answer": "Answer 3"},
        {"text": "Question 4?", "answer": "Answer 4"},
        {"text": "Question 5?", "answer": "Answer 5"}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link", 
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Term1", "definition": "Definition1"},
        {"term": "Term2", "definition": "Definition2"},
        {"term": "Term3", "definition": "Definition3"},
        {"term": "Term4", "definition": "Definition4"},
        {"term": "Term5", "definition": "Definition5"},
        {"term": "Term6", "definition": "Definition6"},
        {"term": "Term7", "definition": "Definition7"},
        {"term": "Term8", "definition": "Definition8"},
        {"term": "Term9", "definition": "Definition9"},
        {"term": "Term10", "definition": "Definition10"}
      ],
      "teacher_tip": "Teaching tip here"
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
        {"text": "Third _____ blank.", "answer": "word3"},
        {"text": "Fourth _____ blank.", "answer": "word4"},
        {"text": "Fifth _____ blank.", "answer": "word5"},
        {"text": "Sixth _____ blank.", "answer": "word6"},
        {"text": "Seventh _____ blank.", "answer": "word7"},
        {"text": "Eighth _____ blank.", "answer": "word8"},
        {"text": "Ninth _____ blank.", "answer": "word9"},
        {"text": "Tenth _____ blank.", "answer": "word10"}
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "Question 1?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 2?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 3?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 4?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 5?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 6?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 7?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": true},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 8?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        },
        {
          "text": "Question 9?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": true}
          ]
        },
        {
          "text": "Question 10?",
          "options": [
            {"label": "A", "text": "Option A", "correct": true},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": false},
            {"label": "D", "text": "Option D", "correct": false}
          ]
        }
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Person A", "text": "Hello, how are you?"},
        {"speaker": "Person B", "text": "I am fine, thank you. And you?"},
        {"speaker": "Person A", "text": "I am doing well, thanks."},
        {"speaker": "Person B", "text": "What brings you here today?"},
        {"speaker": "Person A", "text": "I am here for a business meeting."},
        {"speaker": "Person B", "text": "That sounds important."},
        {"speaker": "Person A", "text": "Yes, it is quite significant."},
        {"speaker": "Person B", "text": "I hope it goes well."},
        {"speaker": "Person A", "text": "Thank you, I appreciate that."},
        {"speaker": "Person B", "text": "You are welcome. Good luck!"}
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions.",
      "teacher_tip": "Teaching tip here"
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
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        "Question 1?",
        "Question 2?",
        "Question 3?",
        "Question 4?",
        "Question 5?",
        "Question 6?",
        "Question 7?",
        "Question 8?",
        "Question 9?",
        "Question 10?"
      ],
      "teacher_tip": "Teaching tip here"
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 6,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "Sentence with a error.", "answer": "Sentence with an error."},
        {"text": "This are wrong.", "answer": "This is wrong."},
        {"text": "I do not have no money.", "answer": "I do not have any money."},
        {"text": "She go yesterday.", "answer": "She went yesterday."},
        {"text": "There is many people.", "answer": "There are many people."},
        {"text": "I am study.", "answer": "I am studying."},
        {"text": "He do not like.", "answer": "He does not like."},
        {"text": "We was there.", "answer": "We were there."},
        {"text": "I have see it.", "answer": "I have seen it."},
        {"text": "She can speaks.", "answer": "She can speak."}
      ],
      "teacher_tip": "Teaching tip here"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term1", "meaning": "Meaning1"},
    {"term": "Term2", "meaning": "Meaning2"},
    {"term": "Term3", "meaning": "Meaning3"},
    {"term": "Term4", "meaning": "Meaning4"},
    {"term": "Term5", "meaning": "Meaning5"},
    {"term": "Term6", "meaning": "Meaning6"},
    {"term": "Term7", "meaning": "Meaning7"},
    {"term": "Term8", "meaning": "Meaning8"},
    {"term": "Term9", "meaning": "Meaning9"},
    {"term": "Term10", "meaning": "Meaning10"},
    {"term": "Term11", "meaning": "Meaning11"},
    {"term": "Term12", "meaning": "Meaning12"},
    {"term": "Term13", "meaning": "Meaning13"},
    {"term": "Term14", "meaning": "Meaning14"},
    {"term": "Term15", "meaning": "Meaning15"}
  ]
}

GENERATE CONTENT BASED ON THIS TOPIC: ${sanitizedPrompt}

RETURN ONLY THE JSON OBJECT - NO OTHER TEXT OR FORMATTING.`
        }
      ]
    });

  return aiResponse.choices[0].message.content;
}
