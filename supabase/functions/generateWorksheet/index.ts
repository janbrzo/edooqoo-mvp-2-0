
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';
import { isValidUUID, sanitizeInput, validatePrompt } from './security.ts';
import { RateLimiter } from './rateLimiter.ts';
import { getGeolocation } from './geolocation.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Start generation time measurement
  const generationStartTime = Date.now();

  try {
    const { prompt, formData, userId, studentId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
    
    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return new Response(
        JSON.stringify({ error: promptValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced rate limiting with multi-tier limits
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geolocation data
    const geoData = await getGeolocation(ip);

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Check if grammarFocus is provided in the prompt
    const hasGrammarFocus = sanitizedPrompt.includes('grammarFocus:');
    const grammarFocusMatch = sanitizedPrompt.match(/grammarFocus:\s*(.+?)(?:\n|$)/);
    const grammarFocus = grammarFocusMatch ? grammarFocusMatch[1].trim() : null;

    // Determine exercise count - always generate 8, then trim if needed
    let finalExerciseCount = 8; // Always generate 8 exercises
    if (sanitizedPrompt.includes('45 min')) {
      finalExerciseCount = 6; // Will trim to 6 after generation
    } else if (sanitizedPrompt.includes('30 min')) {
      // Convert 30 min to 45 min (remove 30 min option)
      finalExerciseCount = 6;
    }
    
    // Always use the full 8-exercise set for generation
    const exerciseTypes = getExerciseTypesForCount(8);
    
    console.log(`Generating 8 exercises, will trim to ${finalExerciseCount} if needed`);
    
    // CREATE SYSTEM MESSAGE with Golden Prompt content
    const systemMessage = `You are an expert ESL English language teacher specialized in creating context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

          CRITICAL RULES AND REQUIREMENTS:
1. Create EXACTLY 8 exercises. No fewer, no more. Number them Exercise 1 through Exercise 8.
2. Use EXACTLY these exercise types in this EXACT ORDER: reading, matching, fill-in-blanks, multiple-choice, dialogue, true-false, discussion, error-correction
3. All exercises should be closely related to the specified topic and goal
4. Include specific vocabulary, expressions, and language structures related to the topic.
5. Keep exercise instructions clear and concise. Students should understand tasks without additional explanation.
6. DO NOT USE PLACEHOLDERS. Write full, complete, high-quality content for every field.
7. Write tasks using natural, spoken English that reflects how real people talk. Avoid robotic AI or textbook-style phrases. Use contractions, informal structures, and natural flow. Keep it appropriate for the learner's level, but make it sound like a real-life conversation, not a scripted monologue.
8. DO NOT include any text outside of the JSON structure.
9. Exercise 1 (Reading Comprehension) MUST have content more than 300 words. Analyze the lessonTopic, lessonGoal and additionalInformation to determine the most appropriate text format (article, review, interview, story, email, etc.). The reading text should exemplify the format students will encounter or create based on the lesson objectives.
10. Focus on overall flow, coherence and pedagogical value.
11. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale.

${hasGrammarFocus ? `
12. GRAMMAR FOCUS REQUIREMENT: The user has specified a grammar focus: "${grammarFocus}". You MUST:
    - ENSURE grammar complexity matches CERF level: "${formData.englishLevel}"
    - Include a "grammar_rules" section in the JSON with detailed explanation of this grammar topic
    - Design ALL exercises to practice and reinforce this specific grammar point
    - Ensure the reading text, vocabulary, and all exercises incorporate examples of this grammar
    - Make this grammar topic the central pedagogical focus of the entire worksheet
    -provide a detailed and comprehensive explanation about the grammatical topic, including a thorough introduction explaining its usage, importance, and general overview, written in the style of well-known grammar reference books (such as My Grammar Lab, Cambridge Grammar, or Virginia Evans).
` : `
12. NO GRAMMAR FOCUS: The user has not specified a grammar focus, so create a general worksheet focused on the topic and goal without emphasizing any particular grammar point.
`}

13. Generate a structured JSON worksheet with this EXACT format:
EXAMPLE OUTPUT (IGNORE CONTENT, FOCUS ON STRUCTURE):
{
  "title": "In a restaurant",
  "subtitle": "Making a complaint about your dish in a restaurant: adjectives practice",
  "introduction": "In this lesson, you'll practice a restaurant role-play, learn how to order food, and make a complaint about an incorrect order. You'll also review grammar related to adjectives in their comparative and superlative forms.",
  ${hasGrammarFocus ? `"grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Adjectives are words that describe or modify nouns, providing information about qualities such as size, color, shape, age, and many others. When we want to compare people, objects, or ideas, we use adjectives in their comparative or superlative forms.\\n\\nComparatives are used to compare two things or people, showing that one has a higher or lower degree of a particular quality than the other. For example, when saying \\"John is taller than Mike,\\" the adjective \\"taller\\" is in the comparative form, indicating a comparison between two individuals. Comparatives are often followed by the word \\"than\\" to introduce the second element of comparison.\\n\\nSuperlatives, on the other hand, are used to describe the extreme or highest degree of a quality among three or more things or people. For example, \\"Anna is the tallest in her class\\" uses the superlative form \\"tallest\\" to indicate that Anna has the greatest height compared to all others in the group. Superlatives are usually preceded by the definite article \\"the\\".\\n\\nThe formation of comparatives and superlatives depends largely on the length and ending of the adjective. One-syllable adjectives usually form comparatives and superlatives by adding the suffixes \\"-er\\" and \\"-est\\". For adjectives with two syllables or more, especially those with three or more syllables, the words \\"more\\" and \\"most\\" are used before the adjective instead of adding suffixes.\\n\\nSome adjectives have irregular comparative and superlative forms that must be memorized as they do not follow standard patterns. For instance, \\"good\\" becomes \\"better\\" (comparative) and \\"best\\" (superlative).\\n\\nIn addition to indicating comparisons of difference, adjectives can also be used to express equality, using the structure \\"as + adjective + as\\" to show that two things share the same degree of a quality.\\n\\nUnderstanding and correctly using comparatives and superlatives is essential for effective communication, enabling speakers and writers to accurately compare qualities and express degrees of difference or similarity.",
    "rules": [
      {
        "title": "Forming Comparatives for One-Syllable Adjectives",
        "explanation": "Most one-syllable adjectives form their comparative by adding the suffix \\"-er\\" to the base adjective. If the adjective ends with a single consonant preceded by a single vowel, double the consonant before adding \\"-er\\". When the adjective ends with \\"-e\\", just add \\"-r\\".",
        "examples": ["food → colder food", "dish → spicier dish", "service → slower service"]
      },
      {
        "title": "Forming Superlatives for One-Syllable Adjectives",
        "explanation": "One-syllable adjectives form the superlative by adding the suffix \\"-est\\" to the base adjective. Similar spelling rules apply as with comparatives.",
        "examples": ["food → coldest food", "dish → spiciest dish", "service → slowest service"]
      },
      {
        "title": "Forming Comparatives and Superlatives for Adjectives with Two or More Syllables",
        "explanation": "Adjectives with two or more syllables generally form comparatives and superlatives by using \\"more\\" before the adjective for comparatives, and \\"most\\" before the adjective for superlatives. Some two-syllable adjectives can also take \\"-er\\" and \\"-est\\" if they end with \\"-y\\" or certain other endings.",
        "examples": ["delicious → more delicious → most delicious", "uncomfortable → more uncomfortable → most uncomfortable", "friendly staff → friendlier staff → friendliest staff"]
      },
      {
        "title": "Irregular Comparatives and Superlatives",
        "explanation": "Some adjectives have irregular forms that do not follow the usual patterns and must be memorized. These are common and important adjectives.",
        "examples": ["good service → better service → best service", "bad coffee → worse coffee → worst coffee", "far table → farther table → farthest table"]
      },
      {
        "title": "Using \\"than\\" in Comparatives",
        "explanation": "Comparative adjectives are usually followed by \\"than\\" to introduce the second element being compared.",
        "examples": ["This soup is colder than it should be.", "The second waiter was more polite than the first one."]
      },
      {
        "title": "Using \\"the\\" with Superlatives",
        "explanation": "Superlative adjectives are usually preceded by the definite article \\"the\\" to show that one thing is the highest or lowest in a group.",
        "examples": ["That was the worst pasta I’ve ever eaten.", "This is the most expensive restaurant in the area."]
      },
      {
        "title": "Comparing Equality with \\"as...as\\"",
        "explanation": "To show that two things are equal in some quality, use the structure \\"as + adjective + as\\".",
        "examples": ["This dish is not as hot as I expected.", "The new waiter is as friendly as the old one."]
      }
    ]
  },` : ''}
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 9,
      "instructions": "Read the following text and answer the questions below.",
      "content": "New York City is famous for its restaurants. People from all over the world live there, so the city offers many different types of food. You can find Italian, Chinese, Mexican, Japanese, Greek, Thai, Indian, and many more international cuisines. American-style diners and fast food restaurants are also very popular.\\nMost restaurants in New York have menus that include appetizers, main dishes, and desserts. Appetizers are small dishes that people eat before the main meal, such as soups, salads, or garlic bread. Main dishes are usually bigger and include meat, fish, or vegetarian options, often served with rice, potatoes, or pasta. Desserts like cheesecake, brownies, or ice cream are very common.\\nSome of the most popular types of food in New York include pizza, burgers, sushi, and pasta. People also enjoy trying food from food trucks, especially for lunch. One of the most famous dishes in the United States, and especially in New York, is the New York-style pizza. It's a thin, wide slice of pizza, usually eaten with your hands.\\nOf course, not every restaurant visit is perfect. Some common complaints that people make in New York restaurants include:\\n"The food is cold."\\n"This is not what I ordered."\\n"The portion is too small."\\n"I waited too long for my food."\\n"The bill is incorrect."\\nLearning how to order food and make polite complaints in English is very useful if you ever visit New York or work in customer service.",
      "questions": [
        {"text": "Why is there such a wide variety of food in New York City restaurants?", "answer": "Because people from all over the world live in New York, so the city offers many different types of international cuisine."},
        {"text": "What are some typical examples of appetizers, main dishes, and desserts mentioned in the text?", "answer": "Appetizers: soups, salads, garlic bread; Main dishes: meat, fish, or vegetarian options with rice, potatoes, or pasta; Desserts: cheesecake, brownies, ice cream."},
        {"text": "What is special about New York-style pizza?", "answer": "It is a thin, wide slice of pizza, usually eaten with your hands."},
        {"text": "What are some of the most popular international cuisines in New York?", "answer": "Italian, Chinese, Mexican, Japanese, Greek, Thai, and Indian cuisines."},
        {"text": "What are some common complaints that customers make in New York restaurants?", "answer": "The food is cold, This is not what I ordered, The portion is too small, I waited too long for my food, and The bill is incorrect."}
      ],
      "teacher_tip": "Use the comprehension questions as a starting point to ask more personal questions related to your student's life and experiences. Encourage them to share their opinions on the topics and situations mentioned in the text."
    },
    {
      "type": "matching",
      "title": "Exercise 2: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Appetizer", "definition": "A small dish served before the main course to stimulate the appetite."},
        {"term": "Cuisine", "definition": "A style or method of cooking, especially as characteristic of a particular country or region."},
        {"term": "Portion", "definition": "The amount of food served to one person at a meal."},
        {"term": "Incorrect", "definition": "Not accurate or wrong; used especially in the context of errors with orders or bills."},
        {"term": "Complaint", "definition": "A statement that something is wrong or not satisfactory, especially in service or quality."},
        {"term": "Fine dining", "definition": "A high-end, expensive restaurant experience offering exceptional food, service, and atmosphere."},
        {"term": "Reservation", "definition": "An arrangement made in advance to secure a table at a restaurant."},
        {"term": "Signature dish", "definition": "A unique or famous meal that represents a restaurant or chef's style."},
        {"term": "Undercooked", "definition": "Food that has not been cooked long enough and may be unsafe or unpleasant to eat."},
        {"term": "Customer service", "definition": "The assistance and advice provided by a restaurant or business to people who use its services."}
      ],
      "teacher_tip": "Before the matching activity, introduce and pronounce each term to ensure students feel confident recognizing and understanding them. If needed, translate the most difficult or abstract vocabulary terms into the student's native language. After the exercise, assign students a follow-up task to write 10 original sentences using the new vocabulary."
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["famous", "international", "incorrect", "small", "popular", "cold", "different", "thin", "expensive", "common"],
      "sentences": [
        {"text": "New York is _____ for its wide variety of restaurants and street food.", "answer": "famous"},
        {"text": "The city offers many _____ cuisines, like Thai, Italian, and Indian.", "answer": "international"},
        {"text": "Customers often complain when their bill is _____.", "answer": "incorrect"},
        {"text": "Appetizers are usually _____ dishes served before the main course.", "answer": "small"},
        {"text": "Pizza is one of the most _____ foods in New York.", "answer": "popular"},
        {"text": "One common complaint is that the food arrives _____.", "answer": "cold"},
        {"text": "You can try food from many _____ cultures in New York.", "answer": "different"},
        {"text": "New York-style pizza is known for its wide and _____ crust.", "answer": "thin"},
        {"text": "Some restaurants are very _____, but they offer high-quality service.", "answer": "expensive"},
        {"text": "It is _____ to leave a tip in American restaurants.", "answer": "common"}
      ],
      "teacher_tip": "You can use this exercise in the next class as a sentence translation activity—provide the sentences in the student's native language and ask them to translate them into English to practice the new vocabulary."
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Multiple Choice",
      "icon": "fa-check-square",
      "time": 8,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "This restaurant is ______ than the one we went to last week.",
          "options": [
            {"label": "A", "text": "good", "correct": false},
            {"label": "B", "text": "better", "correct": true},
            {"label": "C", "text": "best", "correct": false},
            {"label": "D", "text": "the better", "correct": false}
          ]
        },
        {
          "text": "That was the ______ meal I've ever had!",
          "options": [
            {"label": "A", "text": "most delicious", "correct": true},
            {"label": "B", "text": "more delicious", "correct": false},
            {"label": "C", "text": "deliciouser", "correct": false},
            {"label": "D", "text": "deliciousest", "correct": false}
          ]
        },
        {
          "text": "Chinese food is usually ______ than British food.",
          "options": [
            {"label": "A", "text": "spicy", "correct": false},
            {"label": "B", "text": "the spiciest", "correct": false},
            {"label": "C", "text": "spicier", "correct": true},
            {"label": "D", "text": "most spicy", "correct": false}
          ]
        },
        {
          "text": "That's the ______ restaurant in our neighborhood.",
          "options": [
            {"label": "A", "text": "expensiver", "correct": false},
            {"label": "B", "text": "most expensive", "correct": true},
            {"label": "C", "text": "more expensive", "correct": false},
            {"label": "D", "text": "expensivest", "correct": false}
          ]
        },
        {
          "text": "John eats ______ than his brother.",
          "options": [
            {"label": "A", "text": "most slowly", "correct": false},
            {"label": "B", "text": "the slowest", "correct": false},
            {"label": "C", "text": "slow", "correct": false},
            {"label": "D", "text": "more slowly", "correct": true}
          ]
        },
        {
          "text": "This soup is ______ than the one I made yesterday.",
          "options": [
            {"label": "A", "text": "tastier", "correct": true},
            {"label": "B", "text": "the tastiest", "correct": false},
            {"label": "C", "text": "tasty", "correct": false},
            {"label": "D", "text": "more tastiest", "correct": false}
          ]
        },
        {
          "text": "Of all the dishes on the menu, the lasagna is the ______.",
          "options": [
            {"label": "A", "text": "good", "correct": false},
            {"label": "B", "text": "better", "correct": false},
            {"label": "C", "text": "best", "correct": true},
            {"label": "D", "text": "more better", "correct": false}
          ]
        },
        {
          "text": "Pizza is ______ than soup for a quick lunch.",
          "options": [
            {"label": "A", "text": "the convenient", "correct": false},
            {"label": "B", "text": "more convenient", "correct": true},
            {"label": "C", "text": "convenientest", "correct": false},
            {"label": "D", "text": "most convenient", "correct": false}
          ]
        },
        {
          "text": "This is the ______ café in town. Everyone loves it!",
          "options": [
            {"label": "A", "text": "more popular", "correct": false},
            {"label": "B", "text": "popular", "correct": false},
            {"label": "C", "text": "popularest", "correct": false},
            {"label": "D", "text": "most popular", "correct": true}
          ]
        },
        {
          "text": "The weather today is much ______ than it was yesterday.",
          "options": [
            {"label": "A", "text": "warmer", "correct": true},
            {"label": "B", "text": "the warmest", "correct": false},
            {"label": "C", "text": "warm", "correct": false},
            {"label": "D", "text": "most warm", "correct": false}
          ]
        }
      ],
      "teacher_tip": "After choosing an answer, ask students to explain why they picked it. This encourages deeper thinking and grammar awareness. Show tricky or commonly confused forms (more better, the most nicest) and explain why they are incorrect."
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Dialogue Practice",
      "icon": "fa-comments",
      "time": 8,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Waiter", "text": "Good evening! Can I take your order?"},
        {"speaker": "Customer", "text": "Yes, I'd like the grilled salmon with vegetables, please."},
        {"speaker": "Waiter", "text": "Of course. Would you like anything to drink?"},
        {"speaker": "Customer", "text": "A glass of sparkling water, please."},
        {"speaker": "Waiter", "text": "Great. Your order will be ready shortly."},
        {"speaker": "Waiter", "text": "Here is your grilled salmon. Enjoy your meal!"},
        {"speaker": "Customer", "text": "Thank you."},
        {"speaker": "Customer", "text": "Excuse me, I'm sorry but this isn't what I ordered. I asked for grilled salmon, but this is fried."},
        {"speaker": "Waiter", "text": "Oh, I'm really sorry about that. Let me fix it right away."},
        {"speaker": "Customer", "text": "Thank you, I'd appreciate that."},
        {"speaker": "Waiter", "text": "Please accept our apologies. I'll bring the correct dish in just a few minutes."},
        {"speaker": "Customer", "text": "No problem. Thank you for your help."}
      ],
      "expressions": [
        "I'd like to order the ……, please.",
        "Can I see the menu, please?",
        "Could you recommend something vegetarian?",
        "I think there's a mistake with my order.",
        "Excuse me, but this isn't what I asked for.",
        "Could I get the bill, please?",
        "Can I have this to go?",
        "The food was delicious, thank you!",
        "I'm afraid my dish is cold.",
        "Can you bring us some more water, please?"
      ],
      "expression_instruction": "Practice using these expressions in your own dialogues and real-life situations.",
      "teacher_tip": "Include unexpected issues (e.g., the order is cold, the waiter forgets the drink) to keep the role-play dynamic and spontaneous. Assign students to write a restaurant review or a list of useful expressions they used or learned."
    },
    {
      "type": "true-false",
      "title": "Exercise 6: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Read each statement and decide if it is true or false.",
      "statements": [
        {"text": "Comparative adjectives are used to compare two things.", "isTrue": true},
        {"text": "We always add 'more' to make a comparative adjective, even for short words like 'big'.", "isTrue": false},
        {"text": "Superlative adjectives are used to compare more than two things.", "isTrue": true},
        {"text": "The superlative form of 'good' is 'goodest'.", "isTrue": false},
        {"text": "Adjectives with three or more syllables usually take 'more' or 'most'.", "isTrue": true},
        {"text": "We use 'than' with superlatives.", "isTrue": false},
        {"text": "The comparative form of 'happy' is 'happier'.", "isTrue": true},
        {"text": "To form comparatives, we never change the spelling of the adjective.", "isTrue": false},
        {"text": "The superlative form of 'bad' is 'the worst'.", "isTrue": true},
        {"text": "We add 'er' and 'est' to all adjectives to form comparatives and superlatives.", "isTrue": false}
      ],
      "teacher_tip": "You can use this exercise to check whether the student has understood the grammar topic."
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        {"text": "What is your favorite type of restaurant and why?"},
        {"text": "Have you ever had a bad experience in a restaurant? What happened?"},
        {"text": "Do you prefer eating at home or dining out? Give reasons using comparatives."},
        {"text": "What dish would you recommend to someone visiting your country for the first time?"},
        {"text": "Which restaurant in your city is the most popular? Why do you think it's the best?"},
        {"text": "How do you usually react if your order is wrong or the food isn't good?"},
        {"text": "What is more important to you: good food or good service? Why?"},
        {"text": "Can you describe the most expensive meal you've ever had? Was it worth it?"},
        {"text": "What makes a restaurant better than others in your opinion?"},
        {"text": "Have you ever tried a dish that was better than you expected? What was it?"}
      ],
      "teacher_tip": "Encourage deeper thinking by asking students to explain, justify, or give examples for their answers.Focus on major errors or repeated mistakes after the discussion, not during."
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 7,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "This pizza is more better than the one I had yesterday.", "correction": "This pizza is better than the one I had yesterday."},
        {"text": "She is the most tallest girl in the class.", "correction": "She is the tallest girl in the class."},
        {"text": "My house is more big than yours.", "correction": "My house is bigger than yours."},
        {"text": "Today is the most hottest day of the year.", "correction": "Today is the hottest day of the year."},
        {"text": "This restaurant is more expensiveer than the other one.", "correction": "This restaurant is more expensive than the other one."},
        {"text": "He is smarter than his brother.", "correction": "He is smarter than his brother."},
        {"text": "That movie was the most funniest I have ever seen.", "correction": "That movie was the funniest I have ever seen."},
        {"text": "My car is more faster now after the repair.", "correction": "My car is faster now after the repair."},
        {"text": "Winter is colder than summer.", "correction": "Winter is colder than summer."},
        {"text": "She is the more talented singer in our group.", "correction": "She is the most talented singer in our group."}
      ],
      "teacher_tip": "Highlight frequent errors with comparatives and superlatives, like double comparatives (e.g., more better) or incorrect superlative forms.Ask students to explain why a sentence is incorrect to deepen comprehension."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Appetizer", "meaning": "A small dish served before the main meal to stimulate the appetite."},
    {"term": "Main course", "meaning": "The primary or largest dish in a meal."},
    {"term": "Dessert", "meaning": "A sweet course served at the end of a meal."},
    {"term": "Beverage", "meaning": "A drink, especially one other than water."},
    {"term": "Reservation", "meaning": "An arrangement to have a table kept for you at a restaurant."},
    {"term": "Waiter / Waitress", "meaning": "A person who serves customers in a restaurant."},
    {"term": "Menu", "meaning": "A list of dishes available at a restaurant."},
    {"term": "Order", "meaning": "A request for food or drink in a restaurant."},
    {"term": "Complaint", "meaning": "An expression of dissatisfaction about food or service."},
    {"term": "Wrong order", "meaning": "When the dish served is not what the customer requested."},
    {"term": "Overcooked", "meaning": "Food that has been cooked for too long and is ruined."},
    {"term": "Undercooked", "meaning": "Food that has not been cooked enough."},
    {"term": "Allergy", "meaning": "A harmful reaction to certain foods or ingredients."},
    {"term": "Bill / Check", "meaning": "A statement of the money owed for the meal."},
    {"term": "Tip", "meaning": "An extra amount of money given to the waiter as a thank you for good service."}
  ]
}
END OF EXAMPLE

CRITICAL REQUIREMENTS VERIFICATION:
1. Exercise 1 (reading): Content MUST have more than 320 words. Count words carefully.
2. Exercise 2 (matching): EXACTLY 10 items to match.
3. Exercise 3 (fill-in-blanks): EXACTLY 10 sentences and 10 words in word bank.
4. Exercise 4 (multiple-choice): EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other – no duplicates or similar variations allowed. Only one option per question is correct.
5. Exercise 5 (dialogue): AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions.
6. Exercise 6 (true-false): EXACTLY 10 statements.
7. Exercise 7 (discussion): EXACTLY 10 discussion questions.
8. Exercise 8 (error-correction): EXACTLY 10 sentences with errors.
9. Vocabulary sheet: EXACTLY 15 terms with definitions.
${hasGrammarFocus ? `10. Grammar Rules: Must include 4-7 grammar rules with title, explanation, and 3 examples each.` : ''}

RETURN ONLY VALID JSON. NO MARKDOWN. NO ADDITIONAL TEXT.`;

    // Generate worksheet using OpenAI with complete prompt structure
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14", // Changed back to gpt-4o
      temperature: 0.2, // 
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: sanitizedPrompt
        }
      ],
      max_tokens: 6500
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse the JSON response with error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Validate we got exactly 8 exercises
      if (worksheetData.exercises.length !== 8) {
        console.warn(`Expected 8 exercises but got ${worksheetData.exercises.length}`);
        throw new Error(`Generated ${worksheetData.exercises.length} exercises instead of required 8`);
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Trim exercises if needed for 45 min lessons
      if (finalExerciseCount === 6) {
        worksheetData.exercises = worksheetData.exercises.slice(0, 6);
        console.log(`Trimmed exercises to ${worksheetData.exercises.length} for 45 min lesson`);
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`Final exercise count: ${worksheetData.exercises.length} (target: ${finalExerciseCount})`);
      console.log(`Grammar Rules included: ${!!worksheetData.grammar_rules}`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate generation time
    const generationEndTime = Date.now();
    const generationTimeSeconds = Math.round((generationEndTime - generationStartTime) / 1000);

    // Save worksheet to database with FULL PROMPT (SYSTEM + USER)
    try {
      // CREATE FULL PROMPT - this is what should be saved to database
      const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
      
      // Sanitize form data
      const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
      
      const { data: worksheet, error: worksheetError } = await supabase
        .from('worksheets')
        .insert({
          prompt: fullPrompt, // NOW SAVING FULL PROMPT (SYSTEM + USER)
          form_data: sanitizedFormData,
          ai_response: jsonContent?.substring(0, 50000) || '', // Limit response size
          html_content: JSON.stringify(worksheetData),
          user_id: userId || null,
          teacher_id: userId || null, // Add teacher_id for authenticated users
          student_id: studentId || null, // Add student_id if provided
          ip_address: ip,
          status: 'created',
          title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet', // Limit title length
          generation_time_seconds: generationTimeSeconds,
          country: geoData.country || null,
          city: geoData.city || null
        })
        .select('id, created_at, title');

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        console.log('Worksheet generated and saved successfully with ID:', worksheetId);
        console.log(`Generation time: ${generationTimeSeconds} seconds`);
        console.log(`Geo data: ${geoData.country || 'unknown'}, ${geoData.city || 'unknown'}`);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
