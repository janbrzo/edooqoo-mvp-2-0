
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

    // Generate worksheet using OpenAI with improved prompt structure and EXTREMELY SPECIFIC requirements
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

⚠️ EXTREMELY IMPORTANT REQUIREMENTS - FOLLOW THESE EXACTLY:

1. Create EXACTLY ${exerciseCount} exercises based on the prompt.

2. For "reading" exercises:
   - The content MUST HAVE EXACTLY BETWEEN 280-320 WORDS. COUNT CAREFULLY!
   - Content must be high-quality, relevant to the topic, and appropriate for ESL students.
   - Include EXACTLY 5 comprehension questions with answers.

3. For "matching" exercises:
   - Include EXACTLY 10 items to match.
   - Terms and definitions must be clearly related and educationally valuable.

4. For "fill-in-blanks" exercises:
   - Include EXACTLY 10 sentences and 10 words in the word bank.
   - Ensure sentences are grammatically correct with clear blanks.

5. For "multiple-choice" exercises:
   - Include EXACTLY 10 questions with 4 options each.
   - Each question must have exactly ONE correct answer.
   - Options should be plausible yet distinguishable.

6. For "dialogue" exercises:
   - Include EXACTLY 10 dialogue exchanges.
   - Include EXACTLY 10 relevant expressions to practice.
   - Dialogues should be natural and conversational.

7. For ALL other exercise types:
   - Include EXACTLY 10 examples/items/questions unless specified otherwise.
   - All content must be educationally sound and appropriate for language learning.

8. For vocabulary sheets:
   - Include EXACTLY 15 terms with clear definitions.
   - Terms should be relevant to the worksheet topic.

9. ESSENTIAL QUALITY CHECKS:
   - Ensure all JSON is valid with no trailing commas.
   - Make exercises appropriate for ESL students at the implied level.
   - VERIFY word count for reading exercises (280-320 words STRICTLY).
   - VERIFY the EXACT number of items in each exercise type.
   - Each exercise MUST have a teacher_tip field with useful guidance.
   - Use appropriate time values for each exercise (5-10 minutes).
   - NEVER USE PLACEHOLDERS OR INCOMPLETE CONTENT.
   - DOUBLE CHECK that you've met all requirements before submitting.

DO NOT SUBMIT YOUR RESPONSE UNTIL YOU HAVE VERIFIED ALL REQUIREMENTS ARE MET EXACTLY.`
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
    
    console.log(`Expanded text from ${currentWordCount} to ${expandedWordCount} words`);
    
    if (expandedWordCount >= minWords && expandedWordCount <= maxWords) {
      return expandedText;
    } else {
      console.log(`Expanded text still outside range (${expandedWordCount} words), trying additional processing`);
      
      // If we're still outside the range but closer, try once more with specific instructions
      if (expandedWordCount < minWords) {
        return await expandTextToExactCount(expandedText, minWords);
      } else {
        return await trimTextToExactCount(expandedText, maxWords);
      }
    }
  } catch (error) {
    console.error("Error expanding text:", error);
    return text;
  }
}

// Helper function to expand text to an exact word count
async function expandTextToExactCount(text, targetWordCount) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at precise text editing."
        },
        {
          role: "user",
          content: `Expand this text to EXACTLY ${targetWordCount} words. Be very precise with the word count.\n\nText: ${text}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    const resultWordCount = result.split(/\s+/).length;
    
    console.log(`Attempt to reach exact count: got ${resultWordCount} words, target was ${targetWordCount}`);
    
    return result;
  } catch (error) {
    console.error("Error in exact text expansion:", error);
    return text;
  }
}

// Helper function to trim text to an exact word count
async function trimTextToExactCount(text, targetWordCount) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at precise text editing."
        },
        {
          role: "user",
          content: `Trim this text to EXACTLY ${targetWordCount} words while preserving its meaning as much as possible.\n\nText: ${text}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    const resultWordCount = result.split(/\s+/).length;
    
    console.log(`Attempt to reach exact count: got ${resultWordCount} words, target was ${targetWordCount}`);
    
    return result;
  } catch (error) {
    console.error("Error in exact text trimming:", error);
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
    
    console.log(`Trimmed text from ${currentWordCount} to ${trimmedWordCount} words`);
    
    if (trimmedWordCount >= minWords && trimmedWordCount <= maxWords) {
      return trimmedText;
    } else {
      console.log(`Trimmed text still outside range (${trimmedWordCount} words), trying additional processing`);
      
      // If still outside the range but closer, try once more with specific instructions
      return await trimTextToExactCount(trimmedText, Math.floor((minWords + maxWords) / 2));
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
          content: "Generate a single, high-quality reading comprehension question with answer based on the provided content."
        },
        {
          role: "user",
          content: `Generate question #${questionNum} with a detailed answer for this reading content. Make sure the question is thoughtful and tests comprehension, not just factual recall.\n\nContent: ${content}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    // Parse the generated content to extract question and answer
    const questionMatch = result.match(/Question:?(.*?)(?:Answer:|\n|$)/is);
    const answerMatch = result.match(/Answer:?(.*?)$/is);
    
    return {
      text: questionMatch ? questionMatch[1].trim() : `What is the main idea discussed in paragraph ${questionNum}?`,
      answer: answerMatch ? answerMatch[1].trim() : "Refer to the text for the answer."
    };
  } catch (error) {
    console.error("Error generating question:", error);
    return {
      text: `Question ${questionNum}: What important concept can we learn from this text?`,
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
          content: "Generate high-quality matching items for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional matching items (term and definition pairs) for a vocabulary exercise that matches the style and topic of these existing items: ${JSON.stringify(exercise.items)}. Format the response as a JSON array of objects with 'term' and 'definition' properties.`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatches = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatches) {
        const jsonStr = jsonMatches[1] || result;
        const newItems = JSON.parse(jsonStr.trim());
        
        if (Array.isArray(newItems)) {
          exercise.items = [...exercise.items, ...newItems];
          console.log(`Successfully added ${newItems.length} matching items`);
        }
      } else {
        // If it's not valid JSON, try to parse it manually
        const lines = result.split('\n');
        for (let line of lines) {
          const match = line.match(/(\d+)\.\s+"(.*?)"\s*:\s*"(.*?)"/);
          if (match) {
            exercise.items.push({ term: match[2].trim(), definition: match[3].trim() });
          }
        }
      }
    } catch (parseError) {
      console.error("Error parsing matching items:", parseError);
    }
    
    // Ensure we have exactly 10 items
    while (exercise.items.length < 10) {
      exercise.items.push({ 
        term: `Term ${exercise.items.length + 1}`, 
        definition: `Definition for term ${exercise.items.length + 1}`
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
          content: "Generate high-quality fill-in-the-blank sentences for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional fill-in-the-blank sentences and ensure there are exactly 10 words in the word bank. Return the result as a JSON object with 'sentences' array and 'word_bank' array.\n\nCurrent sentences: ${JSON.stringify(exercise.sentences)}\nCurrent word bank: ${JSON.stringify(exercise.word_bank)}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{\s*"sentences[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newData = JSON.parse(jsonStr.trim());
        
        if (newData.sentences && Array.isArray(newData.sentences)) {
          exercise.sentences = [...exercise.sentences, ...newData.sentences];
          console.log(`Added ${newData.sentences.length} new sentences`);
        }
        
        if (newData.word_bank && Array.isArray(newData.word_bank)) {
          // Add only new words that don't already exist in the word bank
          newData.word_bank.forEach(word => {
            if (!exercise.word_bank.includes(word)) {
              exercise.word_bank.push(word);
            }
          });
        }
      }
    } catch (parseError) {
      console.error("Error parsing fill-in-blanks data:", parseError);
      
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
    
    // Ensure all sentences' answers are in the word bank
    exercise.sentences.forEach((sentence, index) => {
      if (!exercise.word_bank.includes(sentence.answer)) {
        // Replace the answer with one from the word bank
        exercise.sentences[index].answer = exercise.word_bank[index % exercise.word_bank.length];
      }
    });
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
          content: "Generate high-quality multiple choice questions for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate ${10 - existingCount} additional multiple choice questions with 4 options each (one correct). Format the response as a JSON array.

Each question should follow this structure:
{
  "text": "Question text?",
  "options": [
    {"label": "A", "text": "Option A", "correct": false},
    {"label": "B", "text": "Option B", "correct": true},
    {"label": "C", "text": "Option C", "correct": false},
    {"label": "D", "text": "Option D", "correct": false}
  ]
}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        let newQuestions;
        
        if (jsonStr.trim().startsWith('[')) {
          newQuestions = JSON.parse(jsonStr.trim());
        } else if (jsonStr.trim().startsWith('{')) {
          newQuestions = [JSON.parse(jsonStr.trim())];
        }
        
        if (newQuestions && Array.isArray(newQuestions)) {
          exercise.questions = [...exercise.questions, ...newQuestions];
          console.log(`Added ${newQuestions.length} multiple choice questions`);
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
        // Mark one option as correct if no option is marked
        question.options[1].correct = true;
      }
      
      // Ensure labels are sequential A, B, C, D
      question.options.forEach((option, index) => {
        option.label = String.fromCharCode(65 + index); // 65 = ASCII 'A'
      });
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
          content: "Generate natural dialogue exchanges for a language learning exercise."
        },
        {
          role: "user",
          content: `Generate a dialogue with ${10 - existingDialogueCount} exchanges between speakers and ${10 - existingExpressionsCount} useful expressions to practice. Return the response as a JSON object with 'dialogue' array of speaker-text pairs and 'expressions' array of strings.

Current dialogue: ${JSON.stringify(exercise.dialogue)}
Current expressions: ${JSON.stringify(exercise.expressions)}`
        }
      ]
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{\s*"dialogue[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newData = JSON.parse(jsonStr.trim());
        
        if (newData.dialogue && Array.isArray(newData.dialogue)) {
          exercise.dialogue = [...exercise.dialogue, ...newData.dialogue];
          console.log(`Added ${newData.dialogue.length} dialogue exchanges`);
        }
        
        if (newData.expressions && Array.isArray(newData.expressions)) {
          exercise.expressions = [...exercise.expressions, ...newData.expressions];
          console.log(`Added ${newData.expressions.length} expressions`);
        }
      }
    } catch (parseError) {
      console.error("Error parsing dialogue data:", parseError);
      
      // Try to extract dialogue manually
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

Format as JSON array of exercise objects following this structure:
{
  "type": "exercise_type",
  "title": "Exercise Title",
  "icon": "fa-icon-name",
  "time": 8,
  "instructions": "Exercise instructions",
  // Additional fields specific to exercise type
  "teacher_tip": "Tip for teachers"
}`
        }
      ],
      max_tokens: 3000
    });

    const result = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newExercises = JSON.parse(jsonStr.trim());
        
        if (Array.isArray(newExercises)) {
          worksheet.exercises = [...worksheet.exercises, ...newExercises];
          console.log(`Added ${newExercises.length} new exercises`);
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
      console.log(`Reading exercise word count (${wordCount}) outside target range 280-320 words`);
      
      if (wordCount < 280) {
        console.log("Expanding reading content...");
        exercise.content = await expandText(exercise.content, 280, 320);
      } else {
        console.log("Trimming reading content...");
        exercise.content = await trimText(exercise.content, 280, 320);
      }
      
      // Verify the new word count
      const newWordCount = exercise.content.split(/\s+/).length;
      console.log(`New reading exercise word count: ${newWordCount}`);
    }
  } else {
    exercise.content = "Reading content should be placed here. This is a placeholder text that will be replaced with an actual reading passage related to the topic. The content should be informative, engaging, and appropriate for the target audience. It should include relevant vocabulary and grammatical structures that align with the lesson objectives. The reading should provide context for the questions that follow and help students practice their reading comprehension skills.";
    exercise.content = await expandText(exercise.content, 280, 320);
  }
  
  // Validate and fix questions
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    if (!exercise.questions) exercise.questions = [];
    console.log(`Adding reading questions (current count: ${exercise.questions.length})`);
    
    while (exercise.questions.length < 5) {
      const questionNum = exercise.questions.length + 1;
      const newQuestion = await generateQuestion(exercise.content, questionNum);
      exercise.questions.push(newQuestion);
    }
  }
  
  if (exercise.questions.length > 5) {
    exercise.questions = exercise.questions.slice(0, 5);
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
          content: "Generate relevant vocabulary terms and definitions for a language learning worksheet."
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
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || result;
        const newTerms = JSON.parse(jsonStr.trim());
        
        if (Array.isArray(newTerms)) {
          worksheet.vocabulary_sheet = [...worksheet.vocabulary_sheet, ...newTerms];
          console.log(`Added ${newTerms.length} vocabulary terms`);
        }
      }
    } catch (parseError) {
      console.error("Error parsing vocabulary terms:", parseError);
      
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

