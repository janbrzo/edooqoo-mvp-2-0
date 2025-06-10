
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, getExerciseTypesForMissing, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security utilities
function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }
  
  if (prompt.length < 10) {
    return { isValid: false, error: 'Prompt must be at least 10 characters long' };
  }
  
  if (prompt.length > 5000) {
    return { isValid: false, error: 'Prompt must be less than 5000 characters' };
  }
  
  return { isValid: true };
}

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 5, windowMs: number = 300000): boolean { // 5 requests per 5 minutes
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
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

    // Rate limiting
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

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
    
    // CREATE SYSTEM MESSAGE - This is the ENHANCED SYSTEM PROMPT with Golden Example
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
7. Use appropriate time values for each exercise (5-10 minutes).
8. DO NOT include any text outside of the JSON structure.
9. Exercise 1 (Reading Comprehension) MUST have content between 280 and 320 words.
10. Focus on overall flow, coherence and pedagogical value.
11. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale. Critically, you MUST incorporate the 'teachingPreferences' into the design of relevant exercises. For 'studentProfile' and 'studentStruggles', adapt exercises to address these specific needs.

12. GOLDEN EXAMPLE - Study this PERFECT worksheet example to understand the expected quality, creativity, and structure. Your output should match or exceed this standard:

{
  "title": "Travel Adventures: Booking Your Perfect Hotel Stay",
  "subtitle": "Essential Skills for International Business Travelers",
  "introduction": "This comprehensive worksheet will equip you with the language skills needed to confidently book hotel accommodations during business trips. You'll practice essential vocabulary, real-world scenarios, and professional communication techniques that will make your travel experiences smoother and more successful.",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 8,
      "instructions": "Read the following text about hotel booking strategies and answer the questions below.",
      "content": "When booking a hotel for business travel, successful professionals follow several key strategies to ensure their stay meets both personal comfort and professional requirements. The first consideration is location proximity to meeting venues, as this can significantly impact punctuality and transportation costs. Many experienced travelers recommend booking accommodations within walking distance or a short taxi ride from their primary business destination. The second crucial factor involves understanding cancellation policies, particularly for business trips where schedules frequently change. Flexible booking options, though sometimes more expensive, often prove invaluable when meetings are rescheduled or extended unexpectedly. Additionally, business travelers should prioritize hotels with reliable internet connectivity, 24-hour room service, and business centers equipped with printing and conference facilities. The booking process itself has evolved dramatically with online platforms offering real-time availability, customer reviews, and competitive pricing. However, calling hotels directly can sometimes yield better rates or room upgrades, especially for corporate accounts or loyalty program members. Smart travelers also consider seasonal pricing fluctuations, local events that might affect availability, and the hotel's reputation for accommodating business needs such as early check-in or late checkout options.",
      "questions": [
        {"text": "What is the first consideration when booking a hotel for business travel?", "answer": "Location proximity to meeting venues"},
        {"text": "Why do experienced travelers recommend flexible booking options?", "answer": "Because business trip schedules frequently change"},
        {"text": "What hotel amenities are particularly important for business travelers?", "answer": "Reliable internet, 24-hour room service, and business centers"},
        {"text": "What advantage might calling hotels directly provide?", "answer": "Better rates or room upgrades"},
        {"text": "What factors affect hotel pricing that travelers should consider?", "answer": "Seasonal pricing fluctuations and local events"}
      ],
      "teacher_tip": "Encourage students to share their own hotel booking experiences and discuss cultural differences in hospitality expectations across different countries."
    },
    {
      "type": "matching",
      "title": "Exercise 2: Hotel Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each hotel-related term with its correct definition.",
      "items": [
        {"term": "Concierge", "definition": "Hotel staff member who assists guests with various services and local recommendations"},
        {"term": "Suite", "definition": "Large hotel room with separate living and sleeping areas"},
        {"term": "Amenities", "definition": "Additional services or features provided by the hotel for guest comfort"},
        {"term": "Reservation", "definition": "Advance booking or arrangement to secure a hotel room"},
        {"term": "Check-in", "definition": "Process of registering arrival and receiving room keys at a hotel"},
        {"term": "Folio", "definition": "Detailed bill showing all charges during a hotel stay"},
        {"term": "Upgrade", "definition": "Moving to a better room category, often at no additional cost"},
        {"term": "Occupancy", "definition": "The number of guests staying in a room or hotel"},
        {"term": "Incidentals", "definition": "Extra charges for services like minibar, phone calls, or room service"},
        {"term": "Complimentary", "definition": "Services or items provided free of charge by the hotel"}
      ],
      "teacher_tip": "Practice pronunciation of these terms and have students create sentences using each vocabulary word in context."
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise 3: Hotel Booking Conversation",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete the hotel booking conversation with the correct words from the box.",
      "word_bank": ["reservation", "available", "confirmed", "amenities", "rate", "checkout", "deposit", "preferences", "upgrade", "policy"],
      "sentences": [
        {"text": "I'd like to make a _____ for next Tuesday night, please.", "answer": "reservation"},
        {"text": "Let me check what rooms are _____ for those dates.", "answer": "available"},
        {"text": "What's your nightly _____ for a standard double room?", "answer": "rate"},
        {"text": "Do you have any special _____ such as a gym or pool?", "answer": "amenities"},
        {"text": "I'll need a credit card to secure your booking and take a _____.", "answer": "deposit"},
        {"text": "Your reservation has been _____ for March 15th to 17th.", "answer": "confirmed"},
        {"text": "What time is _____ on the final day of my stay?", "answer": "checkout"},
        {"text": "Do you have any room _____ such as smoking or non-smoking?", "answer": "preferences"},
        {"text": "Is there a possibility of an _____ to a suite if available?", "answer": "upgrade"},
        {"text": "What's your cancellation _____ if my plans change?", "answer": "policy"}
      ],
      "teacher_tip": "Role-play this conversation with students taking turns as hotel staff and guests, focusing on polite and professional language."
    },
    {
      "type": "multiple-choice",
      "title": "Exercise 4: Hotel Booking Scenarios",
      "icon": "fa-check-square",
      "time": 6,
      "instructions": "Choose the best response for each hotel booking situation.",
      "questions": [
        {
          "text": "A guest asks about early check-in. What's the most professional response?",
          "options": [
            {"label": "A", "text": "That's impossible, come back at 3 PM", "correct": false},
            {"label": "B", "text": "Let me check our availability and see what we can arrange", "correct": true},
            {"label": "C", "text": "You'll have to pay extra for that", "correct": false},
            {"label": "D", "text": "Why didn't you mention this when booking?", "correct": false}
          ]
        },
        {
          "text": "How should you respond when a guest complains about room temperature?",
          "options": [
            {"label": "A", "text": "I'll send maintenance to check the thermostat immediately", "correct": true},
            {"label": "B", "text": "The air conditioning works fine in other rooms", "correct": false},
            {"label": "C", "text": "You probably don't know how to use it properly", "correct": false},
            {"label": "D", "text": "It's the same temperature as every other room", "correct": false}
          ]
        },
        {
          "text": "What's the best way to handle a booking modification request?",
          "options": [
            {"label": "A", "text": "Cancel everything and start over", "correct": false},
            {"label": "B", "text": "Check availability and explain any policy implications clearly", "correct": true},
            {"label": "C", "text": "Refuse because the booking is already confirmed", "correct": false},
            {"label": "D", "text": "Charge a modification fee immediately", "correct": false}
          ]
        },
        {
          "text": "When explaining hotel amenities, you should:",
          "options": [
            {"label": "A", "text": "Only mention the basic facilities", "correct": false},
            {"label": "B", "text": "Highlight features that match the guest's interests", "correct": true},
            {"label": "C", "text": "List every single amenity available", "correct": false},
            {"label": "D", "text": "Wait for guests to ask specific questions", "correct": false}
          ]
        },
        {
          "text": "If a guest's credit card is declined, what should you do?",
          "options": [
            {"label": "A", "text": "Announce it loudly so others can hear", "correct": false},
            {"label": "B", "text": "Discreetly suggest trying another payment method", "correct": true},
            {"label": "C", "text": "Immediately cancel their reservation", "correct": false},
            {"label": "D", "text": "Ask them why their card doesn't work", "correct": false}
          ]
        },
        {
          "text": "The most important factor in providing excellent hotel service is:",
          "options": [
            {"label": "A", "text": "Following company policies exactly", "correct": false},
            {"label": "B", "text": "Anticipating and meeting guest needs proactively", "correct": true},
            {"label": "C", "text": "Upselling additional services", "correct": false},
            {"label": "D", "text": "Processing transactions quickly", "correct": false}
          ]
        },
        {
          "text": "When a guest asks for restaurant recommendations, you should:",
          "options": [
            {"label": "A", "text": "Only suggest the hotel's own restaurant", "correct": false},
            {"label": "B", "text": "Provide options based on their preferences and budget", "correct": true},
            {"label": "C", "text": "Give them a general guidebook", "correct": false},
            {"label": "D", "text": "Tell them to search online", "correct": false}
          ]
        },
        {
          "text": "How should you handle a group booking inquiry?",
          "options": [
            {"label": "A", "text": "Treat it the same as individual bookings", "correct": false},
            {"label": "B", "text": "Offer group rates and discuss special requirements", "correct": true},
            {"label": "C", "text": "Refer them to corporate sales immediately", "correct": false},
            {"label": "D", "text": "Require full payment upfront", "correct": false}
          ]
        },
        {
          "text": "What's the best approach for handling special requests?",
          "options": [
            {"label": "A", "text": "Promise everything is possible", "correct": false},
            {"label": "B", "text": "Document requests and communicate realistic expectations", "correct": true},
            {"label": "C", "text": "Ignore requests that seem difficult", "correct": false},
            {"label": "D", "text": "Charge extra fees for any special request", "correct": false}
          ]
        },
        {
          "text": "When explaining hotel policies to guests, you should:",
          "options": [
            {"label": "A", "text": "Focus on why policies exist and their benefits", "correct": true},
            {"label": "B", "text": "Simply state the rules without explanation", "correct": false},
            {"label": "C", "text": "Apologize for having policies", "correct": false},
            {"label": "D", "text": "Offer exceptions to make guests happy", "correct": false}
          ]
        }
      ],
      "teacher_tip": "Discuss each scenario and explore alternative responses, emphasizing cultural sensitivity and professional communication standards."
    },
    {
      "type": "dialogue",
      "title": "Exercise 5: Hotel Booking Phone Conversation",
      "icon": "fa-comments",
      "time": 7,
      "instructions": "Practice this hotel booking dialogue, focusing on professional tone and clear communication.",
      "dialogue": [
        {"speaker": "Hotel Staff", "text": "Good afternoon, Grand Plaza Hotel. This is Sarah speaking. How may I assist you today?"},
        {"speaker": "Guest", "text": "Hello, I'd like to make a reservation for a business trip next month."},
        {"speaker": "Hotel Staff", "text": "I'd be happy to help you with that. What are your preferred dates?"},
        {"speaker": "Guest", "text": "I need accommodation from March 15th to 18th, checking out on the 18th."},
        {"speaker": "Hotel Staff", "text": "Excellent. For how many guests will this reservation be?"},
        {"speaker": "Guest", "text": "Just for myself, so a single occupancy room would be perfect."},
        {"speaker": "Hotel Staff", "text": "Let me check our availability for those dates. Do you have any specific room preferences?"},
        {"speaker": "Guest", "text": "I'd prefer a quiet room with good Wi-Fi, as I'll be working during my stay."},
        {"speaker": "Hotel Staff", "text": "I can offer you a business room on our executive floor with complimentary high-speed internet."},
        {"speaker": "Guest", "text": "That sounds perfect. What's the rate for that room?"},
        {"speaker": "Hotel Staff", "text": "The rate is $180 per night, including breakfast and access to our business center."},
        {"speaker": "Guest", "text": "Excellent. Please go ahead and make the reservation under the name Johnson."}
      ],
      "expressions": [
        "I'd be happy to help you with that",
        "Let me check our availability",
        "Do you have any specific preferences?",
        "I can offer you",
        "That sounds perfect",
        "Please go ahead and",
        "How may I assist you?",
        "Just to confirm",
        "Is there anything else I can help you with?",
        "Thank you for choosing our hotel"
      ],
      "expression_instruction": "Use these professional expressions when practicing hotel booking conversations with different scenarios.",
      "teacher_tip": "Have students reverse roles and practice handling difficult situations like overbooking or special requests, emphasizing problem-solving language."
    },
    {
      "type": "true-false",
      "title": "Exercise 6: Hotel Booking Best Practices",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Decide whether each statement about hotel booking is true or false.",
      "statements": [
        {"text": "It's always cheaper to book hotels online than to call directly", "isTrue": false},
        {"text": "Business travelers should prioritize location over amenities", "isTrue": true},
        {"text": "Cancellation policies are the same for all hotel booking platforms", "isTrue": false},
        {"text": "Loyalty program members often receive room upgrades", "isTrue": true},
        {"text": "Hotel rates are fixed and never negotiable", "isTrue": false},
        {"text": "Reading guest reviews can help you make better booking decisions", "isTrue": true},
        {"text": "All hotels charge the same fees for Wi-Fi access", "isTrue": false},
        {"text": "Booking during peak season typically costs more", "isTrue": true},
        {"text": "Hotel star ratings are standardized worldwide", "isTrue": false},
        {"text": "Corporate rates are usually higher than standard rates", "isTrue": false}
      ],
      "teacher_tip": "Discuss why each statement is true or false, and encourage students to share experiences that support or contradict these statements."
    },
    {
      "type": "discussion",
      "title": "Exercise 7: Hotel Experience Discussion",
      "icon": "fa-users",
      "time": 10,
      "instructions": "Discuss these questions about hotel experiences and preferences with your teacher.",
      "questions": [
        {"text": "What factors do you consider most important when choosing a hotel for business travel?"},
        {"text": "Describe a memorable positive or negative hotel experience you've had. What made it special?"},
        {"text": "How do hotel booking apps and websites compare to traditional travel agents?"},
        {"text": "What amenities do you think are essential versus nice-to-have in a business hotel?"},
        {"text": "How has the hotel industry changed since the COVID-19 pandemic?"},
        {"text": "What cultural differences have you noticed in hotel service standards across different countries?"},
        {"text": "Do you prefer chain hotels or independent boutique hotels? Why?"},
        {"text": "How important are sustainability and eco-friendly practices when choosing accommodation?"},
        {"text": "What role do online reviews play in your hotel selection process?"},
        {"text": "How do you handle situations when your hotel reservation doesn't meet your expectations?"}
      ],
      "teacher_tip": "Encourage students to use the vocabulary and expressions from previous exercises while sharing personal experiences and opinions."
    },
    {
      "type": "error-correction",
      "title": "Exercise 8: Hotel Communication Errors",
      "icon": "fa-exclamation-triangle",
      "time": 8,
      "instructions": "Find and correct the errors in these hotel-related communications.",
      "sentences": [
        {"text": "I want to booking a room for tomorrow night please.", "correction": "I would like to book a room for tomorrow night, please."},
        {"text": "How much costs the presidential suite for one week?", "correction": "How much does the presidential suite cost for one week?"},
        {"text": "Can you telling me what time is the check-in?", "correction": "Can you tell me what time check-in is?"},
        {"text": "I have made a reservation but I not received confirmation.", "correction": "I have made a reservation but I have not received confirmation."},
        {"text": "The room service is working 24 hours per day?", "correction": "Is room service available 24 hours a day?"},
        {"text": "I would like cancel my reservation for next week.", "correction": "I would like to cancel my reservation for next week."},
        {"text": "Do you have any room available for the weekend?", "correction": "Do you have any rooms available for the weekend?"},
        {"text": "The hotel is located near to the airport?", "correction": "Is the hotel located near the airport?"},
        {"text": "I need a room which have a good view of the city.", "correction": "I need a room that has a good view of the city."},
        {"text": "What time does the breakfast serving until?", "correction": "What time is breakfast served until?"}
      ],
      "teacher_tip": "Focus on common grammatical errors in hotel communications and practice correct question formation and polite requests."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Accommodation", "meaning": "A place to stay, such as a hotel, motel, or guesthouse"},
    {"term": "Check-in/Check-out", "meaning": "The process of registering arrival/departure at a hotel"},
    {"term": "Concierge", "meaning": "Hotel staff who assists guests with services and recommendations"},
    {"term": "Corporate rate", "meaning": "Special discounted pricing for business travelers"},
    {"term": "Double occupancy", "meaning": "Room rate based on two people sharing"},
    {"term": "Folio", "meaning": "Detailed bill showing all hotel charges"},
    {"term": "Guest services", "meaning": "Department handling guest requests and assistance"},
    {"term": "Hospitality", "meaning": "The business of providing accommodation and services to travelers"},
    {"term": "Incidentals", "meaning": "Additional charges beyond the room rate"},
    {"term": "Loyalty program", "meaning": "Rewards system for frequent hotel guests"},
    {"term": "No-show", "meaning": "Guest who fails to arrive for their reservation"},
    {"term": "Overbooking", "meaning": "Accepting more reservations than available rooms"},
    {"term": "Peak season", "meaning": "Period of highest demand and rates"},
    {"term": "Room service", "meaning": "Food and beverage delivery to guest rooms"},
    {"term": "Walk-in", "meaning": "Guest seeking accommodation without prior reservation"}
  ]
}

13. Generate a structured JSON worksheet following the EXACT format shown in the Golden Example above. Your output must match this quality, creativity, and attention to detail. The Golden Example demonstrates perfect exercise design, meaningful content, practical vocabulary, realistic scenarios, and valuable teacher tips.

CRITICAL REQUIREMENTS VERIFICATION:
1. Exercise 1 (reading): Content MUST be 280-320 words. Count words carefully.
2. Exercise 2 (matching): EXACTLY 10 items to match.
3. Exercise 3 (fill-in-blanks): EXACTLY 10 sentences and 10 words in word bank.
4. Exercise 4 (multiple-choice): EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other – no duplicates or similar variations allowed. Only one option per question is correct.
5. Exercise 5 (dialogue): AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions.
6. Exercise 6 (true-false): EXACTLY 10 statements.
7. Exercise 7 (discussion): EXACTLY 10 discussion questions.
8. Exercise 8 (error-correction): EXACTLY 10 sentences with errors.
9. Vocabulary sheet: EXACTLY 15 terms with definitions.

RETURN ONLY VALID JSON. NO MARKDOWN. NO ADDITIONAL TEXT.`;

    // Generate worksheet using OpenAI with complete prompt structure
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Changed back to GPT-4o
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
      max_tokens: 5000
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
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save worksheet to database with FULL PROMPT (SYSTEM + USER)
    try {
      // CREATE FULL PROMPT - this is what should be saved to database
      const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
      
      // Sanitize form data
      const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
      
      const { data: worksheet, error: worksheetError } = await supabase.rpc(
        'insert_worksheet_bypass_limit',
        {
          p_prompt: fullPrompt, // NOW SAVING FULL PROMPT (SYSTEM + USER)
          p_form_data: sanitizedFormData,
          p_ai_response: jsonContent?.substring(0, 50000) || '', // Limit response size
          p_html_content: JSON.stringify(worksheetData),
          p_user_id: userId || null,
          p_ip_address: ip,
          p_status: 'created',
          p_title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet', // Limit title length
          p_generation_time_seconds: null
        }
      );

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        console.log('Worksheet generated and saved successfully with ID:', worksheetId);
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
