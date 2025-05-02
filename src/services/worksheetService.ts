
import { supabase } from "@/integrations/supabase/client";
import mockWorksheetData from "@/mockWorksheetData";

interface WorksheetParams {
  lessonTopic: string;
  lessonGoal: string;
  teachingPreferences: string;
  lessonTime: string;
  studentProfile?: string;
  studentStruggles?: string;
}

interface WorksheetFeedback {
  worksheetId: string;
  rating: number;
  feedback: string;
  userId: string;
}

/**
 * Takes user input params and generates worksheet content using OpenAI API.
 */
export async function generateWorksheet(params: WorksheetParams, userId: string, expectedExerciseCount: number = 8) {
  // If we're in development mode and want to use mock data instead of API
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockWorksheetData);
      }, 2000);
    });
  }

  try {
    // IP detection for rate limiting
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const userIp = ipData.ip;

    // Get expected exercise count based on selected lesson time
    // expectedExerciseCount parameter is used instead of this
    // const expectedExerciseCount = getExpectedExerciseCount(params.lessonTime);

    // Prepare prompt for ChatGPT
    const prompt = buildPrompt(params, expectedExerciseCount);

    // Call Edge Function to generate worksheet
    const { data: worksheetData, error } = await supabase.functions.invoke('generateWorksheet', {
      body: { 
        prompt, 
        userId,
        expectedExerciseCount
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`API error: ${error.message || error}`);
    }

    if (!worksheetData || !worksheetData.exercises) {
      throw new Error("No worksheet data returned from API");
    }

    console.log("API returned worksheet data:", worksheetData);

    // Track the generation event
    trackEvent('generate', worksheetData.id, userId);

    return worksheetData;
  } catch (error) {
    console.error("Worksheet generation error:", error);
    throw error;
  }
}

/**
 * Builds a prompt for the AI to generate a worksheet
 */
function buildPrompt(params: WorksheetParams, expectedExerciseCount: number): string {
  const { lessonTopic, lessonGoal, teachingPreferences, lessonTime, studentProfile, studentStruggles } = params;

  let prompt = `Create an English language learning worksheet on the topic: "${lessonTopic}". 
The goal of the lesson is: ${lessonGoal}. 
Teaching preferences: ${teachingPreferences}. 
Lesson duration: ${lessonTime}.`;

  if (studentProfile) {
    prompt += `\nStudent profile: ${studentProfile}.`;
  }

  if (studentStruggles) {
    prompt += `\nStudent struggles: ${studentStruggles}.`;
  }

  prompt += `\n
IMPORTANT REQUIREMENTS:
1. The worksheet MUST include EXACTLY ${expectedExerciseCount} exercises, no more, no less.
2. If including a reading text, it MUST be 280-320 words long (this is critical).
3. Include a vocabulary sheet with relevant terms.
4. Include teacher's tips for each exercise.
5. Each exercise should have a title, instructions and appropriate content.
6. Make sure all exercises are complete with detailed instructions and full content.
7. For matching exercises, include exactly 10 pairs of items.
8. For fill-in-blank exercises, include exactly 10 sentences and a word bank with at least 10 words.
9. For multiple choice exercises, include at least 5 questions with 4 options each.
10. For exercises with dialogues, include at least 10 exchanges.
11. For discussion exercises, include at least 10 questions.

QUALITY CHECK:
Before finalizing, please analyze and verify:
1. There are no grammar errors
2. There are no spelling mistakes
3. All instructions are clear and unambiguous
4. The difficulty level is appropriate
5. The worksheet includes specific vocabulary related to the topic
6. The formatting is consistent
7. No exercises are missing or incomplete

Return the worksheet as a JSON object with the following structure:
{
  "title": "Worksheet Title",
  "subtitle": "Concise description",
  "introduction": "Brief introduction to the worksheet topic",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 15,
      "instructions": "Read the text and answer the questions below.",
      "content": "Text content goes here (MUST be 280-320 words).",
      "questions": [
        {"text": "Question 1?", "answer": "Answer to question 1."},
        ...
      ],
      "teacher_tip": "Tip for teachers."
    },
    ...more exercises...
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    ...
  ]
}`;

  return prompt;
}

/**
 * Submit worksheet feedback
 */
export async function submitWorksheetFeedback(worksheetId: string, rating: number, feedback: string, userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('submitFeedback', {
      body: { worksheetId, rating, feedback, userId }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Track worksheet events
 */
export async function trackEvent(eventType: 'view' | 'generate' | 'download', worksheetId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('worksheet_events')
      .insert([
        {
          worksheet_id: worksheetId,
          event_type: eventType,
          user_id: userId
        }
      ]);

    if (error) throw error;
    console.log(`Event ${eventType} tracked successfully`);
  } catch (error) {
    console.error('Error tracking event:', error);
    // Don't throw - tracking errors should not affect user experience
  }
}

/**
 * Save worksheet to database
 */
export async function saveWorksheetToDatabase(worksheetData: any, userId: string, prompt: string) {
  try {
    // Get user IP for tracking
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const userIp = ipData.ip;
    
    const { data, error } = await supabase
      .from('worksheets')
      .insert([
        {
          html_content: JSON.stringify(worksheetData),
          user_id: userId,
          ip_address: userIp,
          status: 'completed',
          prompt: prompt,
          title: worksheetData.title || 'Unnamed Worksheet'
        }
      ]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving worksheet to database:', error);
    throw error;
  }
}

/**
 * Updates an edge function with the provided code
 */
export async function updateEdgeFunction(functionName: string, source: string) {
  try {
    // This is a development-only utility
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Function updates only allowed in development environment');
    }
    
    const { data, error } = await supabase.functions.invoke('update-function', {
      body: { name: functionName, source }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating ${functionName} function:`, error);
    throw error;
  }
}

/**
 * Gets worksheet by ID
 */
export async function getWorksheetById(id: string) {
  try {
    const { data, error } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error('Worksheet not found');
    }
    
    return {
      ...JSON.parse(data.html_content),
      id: data.id
    };
  } catch (error) {
    console.error('Error fetching worksheet:', error);
    throw error;
  }
}
