
// OpenAI service for worksheet generation - completely rewritten for better JSON

import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

export async function generateWorksheetWithAI(sanitizedPrompt: string, exerciseTypes: string[]) {
  console.log('=== OPENAI SERVICE DEBUG ===');
  console.log('Generating worksheet with OpenAI...');
  console.log('Exercise types:', exerciseTypes);
  console.log('Prompt preview:', sanitizedPrompt.substring(0, 100));
  
  const systemPrompt = `You are an expert ESL English language teacher. You MUST return ONLY a valid JSON object - no markdown, no explanations, no other text.

CRITICAL REQUIREMENTS:
1. Return ONLY raw JSON - NO markdown formatting like \`\`\`json
2. Generate EXACTLY 8 exercises using these types: ${exerciseTypes.join(', ')}
3. Reading exercise MUST have 280-320 words in content field
4. All string values MUST be properly escaped
5. NO trailing commas anywhere
6. NO line breaks inside string values

JSON STRUCTURE TO RETURN:
{
  "title": "Worksheet Title",
  "subtitle": "Subtitle Text", 
  "introduction": "Introduction paragraph",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the text and answer questions.",
      "content": "EXACTLY 280-320 WORDS HERE",
      "questions": [
        {"text": "Question 1?", "answer": "Answer 1"},
        {"text": "Question 2?", "answer": "Answer 2"},
        {"text": "Question 3?", "answer": "Answer 3"},
        {"text": "Question 4?", "answer": "Answer 4"},
        {"text": "Question 5?", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match terms with definitions.",
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
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete sentences with correct words.",
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
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best option.",
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
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Read and practice the dialogue.",
      "dialogue": [
        {"speaker": "Person A", "text": "Hello, how are you?"},
        {"speaker": "Person B", "text": "Fine, thank you."},
        {"speaker": "Person A", "text": "What do you do?"},
        {"speaker": "Person B", "text": "I am a teacher."},
        {"speaker": "Person A", "text": "That is interesting."},
        {"speaker": "Person B", "text": "Yes, I enjoy it."},
        {"speaker": "Person A", "text": "Where do you work?"},
        {"speaker": "Person B", "text": "At a local school."},
        {"speaker": "Person A", "text": "Have a nice day."},
        {"speaker": "Person B", "text": "You too, goodbye."}
      ],
      "expressions": ["Hello", "How are you?", "Thank you", "Interesting", "I enjoy it", "Where?", "Local school", "Have a nice day", "Goodbye", "You too"],
      "expression_instruction": "Practice these expressions.",
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "true-false",
      "title": "Exercise 6: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Decide if statements are true or false.",
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
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions.",
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
      "teacher_tip": "Tip for teachers"
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 6,
      "instructions": "Find and correct errors.",
      "sentences": [
        {"text": "I have a error.", "answer": "I have an error."},
        {"text": "She go home.", "answer": "She goes home."},
        {"text": "They is happy.", "answer": "They are happy."},
        {"text": "He don't like it.", "answer": "He doesn't like it."},
        {"text": "We was there.", "answer": "We were there."},
        {"text": "I have see it.", "answer": "I have seen it."},
        {"text": "She can speaks.", "answer": "She can speak."},
        {"text": "This are good.", "answer": "This is good."},
        {"text": "I am go now.", "answer": "I am going now."},
        {"text": "He have done it.", "answer": "He has done it."}
      ],
      "teacher_tip": "Tip for teachers"
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

Generate content for topic: ${sanitizedPrompt}

REMEMBER: Return ONLY the JSON object above with content customized for the topic. NO markdown, NO explanations, NO other text.`;

  const userPrompt = `Create a worksheet about: ${sanitizedPrompt}

IMPORTANT: Return ONLY raw JSON - no \`\`\`json formatting, no explanations, just the JSON object starting with { and ending with }.`;

  try {
    console.log('Calling OpenAI API...');
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.0, // Lowest possible for maximum consistency
      max_tokens: 15000, // Increased for full content
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ]
    });

    const content = aiResponse.choices[0].message.content;
    console.log('OpenAI response received, length:', content?.length || 0);
    console.log('Response preview:', content?.substring(0, 200));
    
    return content;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API call failed: ${error.message}`);
  }
}
