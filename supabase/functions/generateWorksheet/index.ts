
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount } from './helpers.ts';
import { validateExercise } from './validators.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('=== EDGE FUNCTION START ===');

  try {
    const requestData = await req.json();
    console.log('=== REQUEST DATA RECEIVED ===');
    console.log('Request keys:', Object.keys(requestData));
    
    const { prompt, formData, userId } = requestData;
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!prompt) {
      console.error('Missing prompt parameter');
      throw new Error('Missing prompt parameter');
    }

    console.log('=== PROCESSING PROMPT ===');
    console.log('Prompt length:', prompt.length);

    let exerciseCount = 6;
    let lessonTime = '60 min';
    
    if (formData && formData.lessonTime) {
      lessonTime = formData.lessonTime;
      if (lessonTime === '30 min') {
        exerciseCount = 4;
      } else if (lessonTime === '45 min') {
        exerciseCount = 6;
      } else if (lessonTime === '60 min') {
        exerciseCount = 8;
      }
    }
    
    console.log(`=== EXERCISE CONFIGURATION ===`);
    console.log(`Lesson time: ${lessonTime}, Exercise count: ${exerciseCount}`);
    
    const exerciseTypes = getExerciseTypesForCount(exerciseCount);
    console.log('Exercise types:', exerciseTypes);
    
    console.log('=== CALLING OPENAI API ===');
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert ESL English language teacher specialized in creating high-quality English language worksheets for individual (one-on-one) tutoring sessions.

CRITICAL REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises. No fewer, no more.
2. Use ONLY these exercise types: ${exerciseTypes.join(', ')}
3. Number exercises sequentially starting from Exercise 1.
4. NO PLACEHOLDER TEXT OR GENERIC CONTENT - everything must be specific to the topic.
5. RETURN ONLY VALID JSON - no markdown formatting, no code blocks, no explanations.

SPECIFIC EXERCISE REQUIREMENTS:

For "discussion" exercises:
- Create 10 meaningful, thought-provoking questions related to the topic
- Each question should encourage extended conversation
- Questions must be specific, not generic like "Discussion question 5?"
- Example: "How would you handle a difficult customer complaint in a hotel setting?" NOT "Discussion question 5?"

For "error-correction" exercises:
- Create 10 realistic sentences with common grammatical errors
- Errors should be related to the topic and appropriate for the level
- Each sentence should contain a clear, identifiable error to correct
- Example: "The hotel guest was very satisfy with the service" NOT "This sentence 1 has an error in it"

For "true-false" exercises:
- Create factual statements related to the topic
- Mix true and false statements naturally
- Statements should test comprehension and knowledge

For ALL exercises:
- Content must be topic-specific and meaningful
- Avoid generic templates or placeholder text
- Each item should be unique and well-crafted

RETURN ONLY THIS JSON STRUCTURE (no markdown, no code blocks):

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
      "content": "Content text of exactly 280-320 words goes here",
      "questions": [
        {"text": "Meaningful question 1 about the text", "answer": "Answer 1"},
        {"text": "Meaningful question 2 about the text", "answer": "Answer 2"},
        {"text": "Meaningful question 3 about the text", "answer": "Answer 3"},
        {"text": "Meaningful question 4 about the text", "answer": "Answer 4"},
        {"text": "Meaningful question 5 about the text", "answer": "Answer 5"}
      ],
      "teacher_tip": "Practical advice for teachers on how to use this exercise effectively."
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term 1", "meaning": "Definition 1"},
    {"term": "Term 2", "meaning": "Definition 2"}
  ]
}

CRITICAL: Return ONLY the JSON object. No additional text, no markdown formatting, no code blocks.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000
    });

    console.log('=== OPENAI RESPONSE RECEIVED ===');
    const jsonContent = aiResponse.choices[0].message.content?.trim();
    console.log('Response length:', jsonContent?.length || 0);
    console.log('Response first 100 chars:', jsonContent?.substring(0, 100));
    
    if (!jsonContent) {
      console.error('Empty response from OpenAI');
      throw new Error('Empty response from AI');
    }
    
    console.log('=== PARSING JSON RESPONSE ===');
    let worksheetData;
    
    try {
      let cleanedJson = jsonContent;
      
      // Remove markdown code blocks if present
      if (cleanedJson.includes('```json')) {
        console.log('Removing markdown json blocks');
        cleanedJson = cleanedJson.replace(/^.*?```json\s*/, '').replace(/\s*```.*$/, '');
      } else if (cleanedJson.includes('```')) {
        console.log('Removing markdown blocks');
        cleanedJson = cleanedJson.replace(/^.*?```\s*/, '').replace(/\s*```.*$/, '');
      }
      
      cleanedJson = cleanedJson.trim();
      
      // Find JSON boundaries
      const jsonStart = cleanedJson.indexOf('{');
      const jsonEnd = cleanedJson.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleanedJson = cleanedJson.substring(jsonStart, jsonEnd);
        console.log('Cleaned JSON first 100 chars:', cleanedJson.substring(0, 100));
        
        worksheetData = JSON.parse(cleanedJson);
        console.log('=== JSON PARSE SUCCESS ===');
        console.log('Worksheet title:', worksheetData.title);
        console.log('Exercises count:', worksheetData.exercises?.length || 0);
      } else {
        console.error('Could not find valid JSON boundaries');
        console.error('jsonStart:', jsonStart, 'jsonEnd:', jsonEnd);
        throw new Error('Could not find valid JSON in response');
      }
      
      // Validate structure
      if (!worksheetData || typeof worksheetData !== 'object') {
        console.error('Invalid worksheet object');
        throw new Error('Parsed data is not a valid object');
      }
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        console.error('Missing required properties');
        console.error('Has title:', !!worksheetData.title);
        console.error('Has exercises:', !!worksheetData.exercises);
        console.error('Is exercises array:', Array.isArray(worksheetData.exercises));
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      console.log('=== VALIDATING EXERCISES ===');
      for (let i = 0; i < worksheetData.exercises.length; i++) {
        const exercise = worksheetData.exercises[i];
        console.log(`Validating exercise ${i + 1}: ${exercise.type}`);
        
        try {
          validateExercise(exercise);
          
          // Fix problematic exercises
          if (exercise.type === 'discussion' && exercise.questions) {
            exercise.questions = exercise.questions.map((q: string, index: number) => {
              if (q.includes(`Discussion question ${index + 1}?`) || q.includes('Discussion question')) {
                console.warn(`Fixed generic discussion question: ${q}`);
                return `How would you apply this topic in your professional context? (Question ${index + 1})`;
              }
              return q;
            });
          }
          
          if (exercise.type === 'error-correction' && exercise.sentences) {
            exercise.sentences = exercise.sentences.map((s: any, index: number) => {
              if (s.text && (s.text.includes(`This sentence ${index + 1}`) || s.text.includes('This sentence'))) {
                console.warn(`Fixed generic error correction sentence: ${s.text}`);
                return {
                  text: `The presentation was very helpfull for understanding the topic.`,
                  answer: `The presentation was very helpful for understanding the topic.`
                };
              }
              return s;
            });
          }
          
        } catch (validationError) {
          console.error(`Validation failed for exercise ${i + 1}:`, validationError.message);
        }
      }
      
      // Ensure correct exercise count
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        
        if (worksheetData.exercises.length > exerciseCount) {
          worksheetData.exercises = worksheetData.exercises.slice(0, exerciseCount);
          console.log(`Trimmed exercises to ${worksheetData.exercises.length}`);
        }
      }
      
      // Fix exercise titles
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      // Ensure vocabulary sheet
      if (!worksheetData.vocabulary_sheet || worksheetData.vocabulary_sheet.length === 0) {
        worksheetData.vocabulary_sheet = [
          {"term": "Professional", "meaning": "Related to work or career"},
          {"term": "Efficient", "meaning": "Working in a well-organized way"},
          {"term": "Collaborate", "meaning": "Work together with others"},
          {"term": "Innovation", "meaning": "New ideas or methods"},
          {"term": "Strategy", "meaning": "A plan to achieve goals"}
        ];
      }
      
      console.log(`=== WORKSHEET COMPLETE ===`);
      console.log(`Final exercise count: ${worksheetData.exercises.length}`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Parse error:', parseError.message);
      console.error('Raw content length:', jsonContent.length);
      console.error('Raw content sample:', jsonContent.substring(0, 500));
      throw new Error(`Failed to generate a valid worksheet structure: ${parseError.message}`);
    }

    const worksheetId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    worksheetData.id = worksheetId;

    const processingTime = Date.now() - startTime;
    console.log(`=== SUCCESS - Processing time: ${processingTime}ms ===`);
    
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`=== ERROR after ${processingTime}ms ===`);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while generating the worksheet',
        details: error.stack,
        processingTime: processingTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
