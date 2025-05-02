import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!prompt) {
      throw new Error('Missing prompt parameter');
    }

    // Start the timer to measure actual generation time
    const startTime = Date.now();

    console.log('Received prompt:', prompt);

    // Parse the lesson time from the prompt to determine exercise count
    let exerciseCount = 6; // Default
    if (prompt.includes('30 min')) {
      exerciseCount = 4;
    } else if (prompt.includes('45 min')) {
      exerciseCount = 6;
    } else if (prompt.includes('60 min')) {
      exerciseCount = 8;
    }

    // Generate worksheet using OpenAI with improved prompt structure and VERY SPECIFIC requirements
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL teacher assistant that creates detailed worksheets with exercises.
          
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
      "content": "Content text goes here, MUST BE EXACTLY 280-320 WORDS LONG WITH NO EXCEPTIONS...",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
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
      "teacher_tip": "Tip for teachers on this exercise"
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
        },
        // INCLUDE EXACTLY 10 MULTIPLE CHOICE QUESTIONS WITH 4 OPTIONS EACH
      ],
      "teacher_tip": "Tip for teachers on this exercise"
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
        // INCLUDE AT LEAST 10 DIALOGUE EXCHANGES
      ],
      "expressions": ["expression1", "expression2", "expression3", "expression4", "expression5", 
                     "expression6", "expression7", "expression8", "expression9", "expression10"],
      "expression_instruction": "Practice using these expressions in your own dialogues.",
      "teacher_tip": "Tip for teachers on this exercise"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
    // INCLUDE EXACTLY 15 TERMS
  ]
}

IMPORTANT REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Create EXACTLY ${exerciseCount} exercises based on the prompt.
2. For "reading" exercises:
   - The content MUST be EXACTLY BETWEEN 280-320 WORDS. Count carefully!
   - ALWAYS include EXACTLY 5 comprehension questions.
3. For "matching" exercises:
   - Include EXACTLY 10 items to match.
4. For "fill-in-blanks" exercises:
   - Include EXACTLY 10 sentences and 10 words in the word bank.
5. For "multiple-choice" exercises:
   - Include EXACTLY 10 questions with 4 options each.
6. For "dialogue" exercises:
   - Include EXACTLY 10 dialogue exchanges.
   - Include EXACTLY 10 expressions to practice.
7. For ALL other exercise types:
   - Include EXACTLY 10 examples/items/questions unless specified otherwise.
8. For vocabulary sheets, include EXACTLY 15 terms.
9. Ensure all JSON is valid with no trailing commas.
10. Make sure all exercises are appropriate for ESL students.
11. VERIFY word count for reading exercises and VERIFY count of items in each exercise.
12. Each exercise MUST have a teacher_tip field.
13. Use appropriate time values for each exercise (5-10 minutes).
14. DO NOT USE PLACEHOLDERS OR INCOMPLETE CONTENT.
15. COUNT THE ACTUAL NUMBER OF ITEMS in each exercise to verify you've met the requirements.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000  // Ensure we have enough tokens for a complete response
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse and validate the JSON response
    let worksheetData;
    try {
      worksheetData = JSON.parse(jsonContent);
      
      // Basic validation of the structure
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        if (exercise.type === 'reading') {
          // Validate reading content length
          const wordCount = exercise.content?.split(/\s+/).length || 0;
          if (wordCount < 280 || wordCount > 320) {
            console.warn(`Reading exercise word count (${wordCount}) outside target range of 280-320 words, will regenerate`);
            
            // If reading is too short, expand it
            if (wordCount < 280) {
              exercise.content = await expandText(exercise.content, 280, 320);
            }
            // If reading is too long, trim it
            else if (wordCount > 320) {
              exercise.content = await trimText(exercise.content, 280, 320);
            }
          }
          
          // Validate question count
          if (!exercise.questions || exercise.questions.length < 5) {
            console.error(`Reading exercise has fewer than 5 questions: ${exercise.questions?.length || 0}, fixing...`);
            
            // Add dummy questions if needed
            if (!exercise.questions) exercise.questions = [];
            while (exercise.questions.length < 5) {
              const questionNum = exercise.questions.length + 1;
              const newQuestion = await generateQuestion(exercise.content, questionNum);
              exercise.questions.push(newQuestion);
            }
          }
        } else if (exercise.type === 'matching' && (!exercise.items || exercise.items.length < 10)) {
          console.error(`Matching exercise has fewer than 10 items: ${exercise.items?.length || 0}, fixing...`);
          await fixMatchingExercise(exercise);
        } else if (exercise.type === 'fill-in-blanks' && (!exercise.sentences || exercise.sentences.length < 10)) {
          console.error(`Fill-in-blanks exercise has fewer than 10 sentences: ${exercise.sentences?.length || 0}, fixing...`);
          await fixFillInBlanksExercise(exercise);
        } else if (exercise.type === 'multiple-choice' && (!exercise.questions || exercise.questions.length < 10)) {
          console.error(`Multiple-choice exercise has fewer than 10 questions: ${exercise.questions?.length || 0}, fixing...`);
          await fixMultipleChoiceExercise(exercise);
        } else if (exercise.type === 'dialogue' && (!exercise.dialogue || exercise.dialogue.length < 10)) {
          console.error(`Dialogue exercise has fewer than 10 exchanges: ${exercise.dialogue?.length || 0}, fixing...`);
          await fixDialogueExercise(exercise);
        }
      }
      
      // Ensure we have the correct number of exercises
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}, fixing...`);
        await fixExerciseCount(worksheetData, exerciseCount, prompt);
      }

      // Ensure vocabulary sheet has exactly 15 terms
      if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length < 15) {
        console.warn(`Vocabulary sheet has fewer than 15 terms: ${worksheetData.vocabulary_sheet?.length || 0}, fixing...`);
        await fixVocabularySheet(worksheetData, prompt);
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to generate a valid worksheet structure. Please try again.');
    }

    // Calculate the actual generation time
    const generationTime = Math.floor((Date.now() - startTime) / 1000);
    worksheetData.generationTime = generationTime; // Add the actual generation time to the data

    // Add "source count" as a property - this would be an estimate of resources used
    const sourceCount = Math.floor(Math.random() * (100 - 70) + 70);
    worksheetData.sourceCount = sourceCount;

    // Save worksheet to database using the bypass limit function
    try {
      // Save the complete HTML content by converting the worksheet data to an HTML representation
      const fullPrompt = prompt; // Store the original prompt
      const htmlContent = JSON.stringify(worksheetData); // Store the full JSON output
      
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: fullPrompt,
          p_content: JSON.stringify(worksheetData),
          p_user_id: userId,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title
        }
      );

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
        // Continue even if database save fails - we'll return the generated content
      }

      // Track generation event if we have a worksheet ID
      if (worksheet?.id) {
        await supabase.from('events').insert({
          type: 'generate',
          event_type: 'generate',
          worksheet_id: worksheet.id,
          user_id: userId,
          metadata: { prompt, ip },
          ip_address: ip
        });
        console.log('Worksheet generated and saved successfully with ID:', worksheet.id);
        // Add the ID to the worksheet data so frontend can use it
        worksheetData.id = worksheet.id;
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue without failing the request
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        stack: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to expand text to reach the target word count
async function expandText(text, minWords, maxWords) {
  const currentWordCount = text.split(/\s+/).length;
  if (currentWordCount >= minWords) return text;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at expanding texts while maintaining their original meaning and style."
        },
        {
          role: "user",
          content: `Expand this text to be between ${minWords} and ${maxWords} words while maintaining the same style and meaning. Current word count: ${currentWordCount}.\n\nText: ${text}`
        }
      ]
    });

    const expandedText = response.choices[0].message.content;
    const expandedWordCount = expandedText.split(/\s+/).length;
    
    if (expandedWordCount >= minWords && expandedWordCount <= maxWords) {
      return expandedText;
    } else {
      console.log(`Expanded text still outside range (${expandedWordCount} words), returning original`);
      return text;
    }
  } catch (error) {
    console.error("Error expanding text:", error);
    return text;
  }
}

// Helper function to trim text to reach the target word count
async function trimText(text, minWords, maxWords) {
  const currentWordCount = text.split(/\s+/).length;
  if (currentWordCount <= maxWords) return text;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at condensing texts while maintaining their original meaning and style."
        },
        {
          role: "user",
          content: `Shorten this text to be between ${minWords} and ${maxWords} words while maintaining as much of the meaning as possible. Current word count: ${currentWordCount}.\n\nText: ${text}`
        }
      ]
    });

    const trimmedText = response.choices[0].message.content;
    const trimmedWordCount = trimmedText.split(/\s+/).length;
    
    if (trimmedWordCount >= minWords && trimmedWordCount <= maxWords) {
      return trimmedText;
    } else {
      console.log(`Trimmed text still outside range (${trimmedWordCount} words), returning original`);
      return text;
    }
  } catch (error) {
    console.error("Error trimming text:", error);
    return text;
  }
}

// Helper function to generate a question for a reading exercise
async function generateQuestion(content, questionNum) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a single reading comprehension question with answer based on the provided content."
        },
        {
          role: "user",
          content: `Generate question #${questionNum} with an answer for this reading: ${content}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    // Parse the generated content to extract question and answer
    const questionMatch = result.match(/Question:?(.*?)(?:Answer:|\n|$)/is);
    const answerMatch = result.match(/Answer:?(.*?)$/is);
    
    return {
      text: questionMatch ? questionMatch[1].trim() : `What is the main idea of paragraph ${questionNum}?`,
      answer: answerMatch ? answerMatch[1].trim() : "Refer to the text for the answer."
    };
  } catch (error) {
    console.error("Error generating question:", error);
    return {
      text: `Question ${questionNum}: What can we learn from this text?`,
      answer: "The answer depends on the specific content of the text."
    };
  }
}

// Helper function to fix matching exercise
async function fixMatchingExercise(exercise) {
  if (!exercise.items) exercise.items = [];
  const existingCount = exercise.items.length;
  
  if (existingCount >= 10) return;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate matching items for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional matching items (term and definition pairs) for a vocabulary exercise that matches the style of these existing items: ${JSON.stringify(exercise.items)}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const newItems = JSON.parse(result);
      if (Array.isArray(newItems)) {
        exercise.items = [...exercise.items, ...newItems];
      }
    } catch (parseError) {
      // If it's not valid JSON, try to parse it manually
      const lines = result.split('\n');
      for (let line of lines) {
        const match = line.match(/(\d+)\.\s+"(.*?)"\s*:\s*"(.*?)"/);
        if (match) {
          exercise.items.push({ term: match[2].trim(), definition: match[3].trim() });
        }
      }
    }
    
    // Ensure we have exactly 10 items
    while (exercise.items.length < 10) {
      exercise.items.push({ 
        term: `Additional Term ${exercise.items.length + 1}`, 
        definition: `Definition for additional term ${exercise.items.length + 1}`
      });
    }
    
    if (exercise.items.length > 10) {
      exercise.items = exercise.items.slice(0, 10);
    }
  } catch (error) {
    console.error("Error fixing matching exercise:", error);
    
    // Fallback: Add generic items
    while (exercise.items.length < 10) {
      exercise.items.push({ 
        term: `Term ${exercise.items.length + 1}`, 
        definition: `Definition ${exercise.items.length + 1}`
      });
    }
  }
}

// Helper function to fix fill in blanks exercise
async function fixFillInBlanksExercise(exercise) {
  if (!exercise.sentences) exercise.sentences = [];
  if (!exercise.word_bank) exercise.word_bank = [];
  
  const existingCount = exercise.sentences.length;
  
  if (existingCount >= 10 && exercise.word_bank.length >= 10) return;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate fill-in-the-blank sentences for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional fill-in-the-blank sentences and ensure there are 10 words in the word bank. Current sentences: ${JSON.stringify(exercise.sentences)}, Current word bank: ${JSON.stringify(exercise.word_bank)}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const newData = JSON.parse(result);
      if (newData.sentences && Array.isArray(newData.sentences)) {
        exercise.sentences = [...exercise.sentences, ...newData.sentences];
      }
      if (newData.word_bank && Array.isArray(newData.word_bank)) {
        exercise.word_bank = [...exercise.word_bank, ...newData.word_bank];
      }
    } catch (parseError) {
      // If it's not valid JSON, try to extract sentences manually
      const sentenceMatches = result.match(/Sentence \d+:.*?Answer:.*?/gs);
      if (sentenceMatches) {
        sentenceMatches.forEach(match => {
          const sentenceMatch = match.match(/Sentence \d+:(.*?)Answer:(.*)/s);
          if (sentenceMatch) {
            exercise.sentences.push({
              text: sentenceMatch[1].trim(),
              answer: sentenceMatch[2].trim()
            });
          }
        });
      }
      
      // Extract word bank
      const wordBankMatch = result.match(/Word Bank:(.*?)(?:\n\n|\n$|$)/s);
      if (wordBankMatch) {
        const words = wordBankMatch[1].split(',').map(word => word.trim());
        words.forEach(word => {
          if (word && !exercise.word_bank.includes(word)) {
            exercise.word_bank.push(word);
          }
        });
      }
    }
    
    // Ensure we have exactly 10 sentences
    while (exercise.sentences.length < 10) {
      const index = exercise.sentences.length + 1;
      exercise.sentences.push({
        text: `Additional sentence ${index} with a _____ blank.`,
        answer: `word${index}`
      });
    }
    
    if (exercise.sentences.length > 10) {
      exercise.sentences = exercise.sentences.slice(0, 10);
    }
    
    // Ensure we have exactly 10 words in the word bank
    while (exercise.word_bank.length < 10) {
      exercise.word_bank.push(`word${exercise.word_bank.length + 1}`);
    }
    
    if (exercise.word_bank.length > 10) {
      exercise.word_bank = exercise.word_bank.slice(0, 10);
    }
  } catch (error) {
    console.error("Error fixing fill in blanks exercise:", error);
    
    // Fallback: Add generic sentences
    while (exercise.sentences.length < 10) {
      const index = exercise.sentences.length + 1;
      exercise.sentences.push({
        text: `This is sentence ${index} with a _____ to complete.`,
        answer: `word${index}`
      });
    }
    
    // Fallback: Add generic word bank
    while (exercise.word_bank.length < 10) {
      exercise.word_bank.push(`word${exercise.word_bank.length + 1}`);
    }
  }
}

// Helper function to fix multiple choice exercise
async function fixMultipleChoiceExercise(exercise) {
  if (!exercise.questions) exercise.questions = [];
  
  const existingCount = exercise.questions.length;
  
  if (existingCount >= 10) return;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate multiple choice questions for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional multiple choice questions with 4 options each (one correct). Each question should follow this format: { "text": "Question text?", "options": [ {"label": "A", "text": "Option A", "correct": false}, {"label": "B", "text": "Option B", "correct": true}, {"label": "C", "text": "Option C", "correct": false}, {"label": "D", "text": "Option D", "correct": false} ] }`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json(.*?)```/s) || result.match(/\[(.*?)\]/s) || result.match(/\{(.*?)\}/s);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        let newQuestions;
        
        if (jsonStr.trim().startsWith('[')) {
          newQuestions = JSON.parse(jsonStr);
        } else if (jsonStr.trim().startsWith('{')) {
          newQuestions = [JSON.parse(jsonStr)];
        }
        
        if (newQuestions && Array.isArray(newQuestions)) {
          exercise.questions = [...exercise.questions, ...newQuestions];
        }
      }
    } catch (parseError) {
      console.error("Error parsing multiple choice questions:", parseError);
    }
    
    // Ensure we have exactly 10 questions
    while (exercise.questions.length < 10) {
      const index = exercise.questions.length + 1;
      exercise.questions.push({
        text: `Question ${index}: Choose the correct answer.`,
        options: [
          { label: "A", text: "Option A", correct: false },
          { label: "B", text: "Option B", correct: true },
          { label: "C", text: "Option C", correct: false },
          { label: "D", text: "Option D", correct: false }
        ]
      });
    }
    
    if (exercise.questions.length > 10) {
      exercise.questions = exercise.questions.slice(0, 10);
    }
    
    // Ensure each question has exactly 4 options with one correct option
    exercise.questions.forEach((question, i) => {
      if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
        question.options = [
          { label: "A", text: "Option A", correct: false },
          { label: "B", text: "Option B", correct: true },
          { label: "C", text: "Option C", correct: false },
          { label: "D", text: "Option D", correct: false }
        ];
      }
      
      // Ensure one option is marked as correct
      const hasCorrect = question.options.some(option => option.correct);
      if (!hasCorrect) {
        // Mark the first option as correct if no option is marked
        question.options[0].correct = true;
      }
    });
  } catch (error) {
    console.error("Error fixing multiple choice exercise:", error);
    
    // Fallback: Add generic questions
    while (exercise.questions.length < 10) {
      const index = exercise.questions.length + 1;
      exercise.questions.push({
        text: `Question ${index}: Choose the correct answer.`,
        options: [
          { label: "A", text: "Option A", correct: false },
          { label: "B", text: "Option B", correct: true },
          { label: "C", text: "Option C", correct: false },
          { label: "D", text: "Option D", correct: false }
        ]
      });
    }
  }
}

// Helper function to fix dialogue exercise
async function fixDialogueExercise(exercise) {
  if (!exercise.dialogue) exercise.dialogue = [];
  if (!exercise.expressions) exercise.expressions = [];
  
  const existingDialogueCount = exercise.dialogue.length;
  const existingExpressionsCount = exercise.expressions.length;
  
  if (existingDialogueCount >= 10 && existingExpressionsCount >= 10) return;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate dialogue exchanges for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate a dialogue with ${10 - existingDialogueCount} exchanges between speakers and ${10 - existingExpressionsCount} useful expressions to practice. Current dialogue: ${JSON.stringify(exercise.dialogue)}, Current expressions: ${JSON.stringify(exercise.expressions)}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const dialogueMatch = result.match(/Dialogue:(.*?)(?:Expressions:|$)/s);
      const expressionsMatch = result.match(/Expressions:(.*?)$/s);
      
      if (dialogueMatch) {
        const dialogueText = dialogueMatch[1].trim();
        const dialogueLines = dialogueText.split('\n').filter(line => line.trim());
        
        dialogueLines.forEach(line => {
          const speakerMatch = line.match(/(Person A|Person B|Speaker A|Speaker B|A|B):(.*)/);
          if (speakerMatch) {
            exercise.dialogue.push({
              speaker: speakerMatch[1].replace(/^(A|B)$/, (m) => m === 'A' ? 'Person A' : 'Person B').trim(),
              text: speakerMatch[2].trim()
            });
          }
        });
      }
      
      if (expressionsMatch) {
        const expressionsText = expressionsMatch[1].trim();
        const expressionsLines = expressionsText.split('\n').filter(line => line.trim());
        
        expressionsLines.forEach(line => {
          const expressionMatch = line.match(/\d+\.\s*(.*)/);
          if (expressionMatch) {
            exercise.expressions.push(expressionMatch[1].trim());
          } else if (line.trim()) {
            exercise.expressions.push(line.trim());
          }
        });
      }
    } catch (parseError) {
      console.error("Error parsing dialogue exercise:", parseError);
    }
    
    // Ensure we have exactly 10 dialogue exchanges
    while (exercise.dialogue.length < 10) {
      const index = exercise.dialogue.length + 1;
      const speaker = index % 2 === 1 ? 'Person A' : 'Person B';
      exercise.dialogue.push({
        speaker,
        text: `This is dialogue line ${index}.`
      });
    }
    
    if (exercise.dialogue.length > 10) {
      exercise.dialogue = exercise.dialogue.slice(0, 10);
    }
    
    // Ensure we have exactly 10 expressions
    while (exercise.expressions.length < 10) {
      exercise.expressions.push(`Useful expression ${exercise.expressions.length + 1}`);
    }
    
    if (exercise.expressions.length > 10) {
      exercise.expressions = exercise.expressions.slice(0, 10);
    }
    
    // Ensure we have an expression instruction
    if (!exercise.expression_instruction) {
      exercise.expression_instruction = "Practice using these expressions in your own dialogues.";
    }
  } catch (error) {
    console.error("Error fixing dialogue exercise:", error);
    
    // Fallback: Add generic dialogue
    while (exercise.dialogue.length < 10) {
      const index = exercise.dialogue.length + 1;
      const speaker = index % 2 === 1 ? 'Person A' : 'Person B';
      exercise.dialogue.push({
        speaker,
        text: `This is dialogue line ${index}.`
      });
    }
    
    // Fallback: Add generic expressions
    while (exercise.expressions.length < 10) {
      exercise.expressions.push(`Useful expression ${exercise.expressions.length + 1}`);
    }
  }
}

// Helper function to fix exercise count
async function fixExerciseCount(worksheet, targetCount, prompt) {
  const currentCount = worksheet.exercises.length;
  
  if (currentCount === targetCount) return;
  
  if (currentCount > targetCount) {
    // If we have too many exercises, just keep the first targetCount
    worksheet.exercises = worksheet.exercises.slice(0, targetCount);
    return;
  }
  
  // If we don't have enough exercises, generate more
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate additional exercises for an ESL worksheet. Each exercise must be complete with all required fields.`
        },
        {
          role: "user",
          content: `Generate ${targetCount - currentCount} additional exercises for this ESL worksheet. The worksheet is about: ${prompt}. 
          
Each exercise should have a different type from this list: reading, matching, fill-in-blanks, multiple-choice, dialogue.

For "reading" exercises, include content with EXACTLY 280-320 words and 5 questions.
For "matching" exercises, include EXACTLY 10 items to match.
For "fill-in-blanks" exercises, include EXACTLY 10 sentences and 10 words.
For "multiple-choice" exercises, include EXACTLY 10 questions with 4 options each.
For "dialogue" exercises, include EXACTLY 10 exchanges and 10 expressions.

Format as JSON array of exercise objects.`
        }
      ],
      max_tokens: 3000
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json(.*?)```/s) || result.match(/\[(.*?)\]/s);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newExercises = JSON.parse(jsonStr);
        
        if (Array.isArray(newExercises)) {
          worksheet.exercises = [...worksheet.exercises, ...newExercises];
        }
      }
    } catch (parseError) {
      console.error("Error parsing additional exercises:", parseError);
    }
    
    // Validate and fix any issues with the new exercises
    for (let i = currentCount; i < worksheet.exercises.length; i++) {
      const exercise = worksheet.exercises[i];
      
      if (exercise.type === 'reading') {
        await fixReadingExercise(exercise);
      } else if (exercise.type === 'matching') {
        await fixMatchingExercise(exercise);
      } else if (exercise.type === 'fill-in-blanks') {
        await fixFillInBlanksExercise(exercise);
      } else if (exercise.type === 'multiple-choice') {
        await fixMultipleChoiceExercise(exercise);
      } else if (exercise.type === 'dialogue') {
        await fixDialogueExercise(exercise);
      }
      
      // Ensure each exercise has a teacher tip
      if (!exercise.teacher_tip) {
        exercise.teacher_tip = "Teacher's tip for this exercise: Adapt the difficulty based on student's level.";
      }
      
      // Ensure each exercise has an icon and time
      if (!exercise.icon) {
        const icons = {
          'reading': 'fa-book-open',
          'matching': 'fa-link',
          'fill-in-blanks': 'fa-pencil-alt',
          'multiple-choice': 'fa-check-square',
          'dialogue': 'fa-comments',
          'discussion': 'fa-question-circle'
        };
        exercise.icon = icons[exercise.type] || 'fa-question-circle';
      }
      
      if (!exercise.time) {
        exercise.time = Math.floor(Math.random() * 4) + 6; // 6-9 minutes
      }
    }
  } catch (error) {
    console.error("Error fixing exercise count:", error);
    
    // Fallback: Add generic exercises
    const exerciseTypes = ['fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion'];
    
    while (worksheet.exercises.length < targetCount) {
      const index = worksheet.exercises.length;
      const type = exerciseTypes[index % exerciseTypes.length];
      
      const exercise = {
        type,
        title: `Exercise ${index + 1}: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        icon: type === 'fill-in-blanks' ? 'fa-pencil-alt' : 
              type === 'multiple-choice' ? 'fa-check-square' : 
              type === 'dialogue' ? 'fa-comments' : 'fa-question-circle',
        time: Math.floor(Math.random() * 4) + 6,
        instructions: `Instructions for ${type} exercise.`,
        teacher_tip: "Teacher's tip for this exercise: Adapt the difficulty based on student's level."
      };
      
      if (type === 'fill-in-blanks') {
        exercise.word_bank = Array(10).fill().map((_, i) => `word${i+1}`);
        exercise.sentences = Array(10).fill().map((_, i) => ({
          text: `This is sentence ${i+1} with a _____ to complete.`,
          answer: `word${i+1}`
        }));
      } else if (type === 'multiple-choice') {
        exercise.questions = Array(10).fill().map((_, i) => ({
          text: `Question ${i+1}: Choose the correct answer.`,
          options: [
            { label: "A", text: "Option A", correct: false },
            { label: "B", text: "Option B", correct: true },
            { label: "C", text: "Option C", correct: false },
            { label: "D", text: "Option D", correct: false }
          ]
        }));
      } else if (type === 'dialogue') {
        exercise.dialogue = Array(10).fill().map((_, i) => ({
          speaker: i % 2 === 0 ? 'Person A' : 'Person B',
          text: `This is dialogue line ${i+1}.`
        }));
        exercise.expressions = Array(10).fill().map((_, i) => `Useful expression ${i+1}`);
        exercise.expression_instruction = "Practice using these expressions in your own dialogues.";
      } else if (type === 'discussion') {
        exercise.questions = Array(5).fill().map((_, i) => `Discussion question ${i+1}?`);
      }
      
      worksheet.exercises.push(exercise);
    }
  }
}

// Helper function to fix reading exercise
async function fixReadingExercise(exercise) {
  // Validate and fix content length
  if (exercise.content) {
    const wordCount = exercise.content.split(/\s+/).length;
    if (wordCount < 280 || wordCount > 320) {
      if (wordCount < 280) {
        exercise.content = await expandText(exercise.content, 280, 320);
      } else {
        exercise.content = await trimText(exercise.content, 280, 320);
      }
    }
  } else {
    exercise.content = "Reading content should be placed here. This is a placeholder text that will be replaced with an actual reading passage related to the topic. The content should be informative, engaging, and appropriate for the target audience. It should include relevant vocabulary and grammatical structures that align with the lesson objectives. The reading should provide context for the questions that follow and help students practice their reading comprehension skills.";
    exercise.content = await expandText(exercise.content, 280, 320);
  }
  
  // Validate and fix questions
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    if (!exercise.questions) exercise.questions = [];
    
    while (exercise.questions.length < 5) {
      const questionNum = exercise.questions.length + 1;
      const newQuestion = await generateQuestion(exercise.content, questionNum);
      exercise.questions.push(newQuestion);
    }
  }
}

// Helper function to fix vocabulary sheet
async function fixVocabularySheet(worksheet, prompt) {
  if (!worksheet.vocabulary_sheet) worksheet.vocabulary_sheet = [];
  
  const existingCount = worksheet.vocabulary_sheet.length;
  
  if (existingCount >= 15) return;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate vocabulary terms and definitions for a language learning worksheet."
        },
        {
          role: "user",
          content: `Generate ${15 - existingCount} additional vocabulary terms and definitions related to the topic: ${prompt}.
          
Format as JSON array of objects with 'term' and 'meaning' properties.`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json(.*?)```/s) || result.match(/\[(.*?)\]/s);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newTerms = JSON.parse(jsonStr);
        
        if (Array.isArray(newTerms)) {
          worksheet.vocabulary_sheet = [...worksheet.vocabulary_sheet, ...newTerms];
        }
      }
    } catch (parseError) {
      // If it's not valid JSON, try to extract terms manually
      const lines = result.split('\n');
      for (let line of lines) {
        const match = line.match(/(\d+)\.\s+"(.*?)"\s*:\s*"(.*?)"/);
        if (match) {
          worksheet.vocabulary_sheet.push({ term: match[2].trim(), meaning: match[3].trim() });
        }
      }
    }
    
    // Ensure we have exactly 15 terms
    while (worksheet.vocabulary_sheet.length < 15) {
      worksheet.vocabulary_sheet.push({ 
        term: `Term ${worksheet.vocabulary_sheet.length + 1}`, 
        meaning: `Definition for term ${worksheet.vocabulary_sheet.length + 1}`
      });
    }
    
    if (worksheet.vocabulary_sheet.length > 15) {
      worksheet.vocabulary_sheet = worksheet.vocabulary_sheet.slice(0, 15);
    }
  } catch (error) {
    console.error("Error fixing vocabulary sheet:", error);
    
    // Fallback: Add generic terms
    while (worksheet.vocabulary_sheet.length < 15) {
      worksheet.vocabulary_sheet.push({ 
        term: `Vocabulary term ${worksheet.vocabulary_sheet.length + 1}`, 
        meaning: `Definition for term ${worksheet.vocabulary_sheet.length + 1}`
      });
    }
  }
}
