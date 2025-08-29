
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { validateRequest } from './validators.ts';
import { checkRateLimit } from './rateLimiter.ts';
import { validateSecurity } from './security.ts';
import { getLocationFromIP } from './geolocation.ts';
import { logInfo, logError, logSuccess } from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let worksheetId: string | null = null;

  try {
    // Security validation
    const securityCheck = await validateSecurity(req);
    if (!securityCheck.isValid) {
      logError('Security validation failed', securityCheck.error);
      return new Response(JSON.stringify({ error: securityCheck.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { formData, user, userProfile } = securityCheck;
    logInfo('Request validated', { userId: user.id, hasProfile: !!userProfile });

    // Request validation
    const validation = validateRequest(formData);
    if (!validation.isValid) {
      logError('Request validation failed', validation.errors);
      return new Response(JSON.stringify({ error: 'Invalid request data', details: validation.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = await checkRateLimit(user.id, clientIP);
    if (!rateLimitCheck.allowed) {
      logError('Rate limit exceeded', { userId: user.id, clientIP });
      return new Response(JSON.stringify({ error: rateLimitCheck.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Geolocation
    const location = await getLocationFromIP(clientIP);
    logInfo('Location data retrieved', location);

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      logError('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create comprehensive prompt with all AI instructions
    const prompt = createComprehensivePrompt(formData);
    logInfo('Prompt created', { promptLength: prompt.length });

    // Call OpenAI API
    logInfo('Calling OpenAI API');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: getSystemPrompt()
          },
          { 
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      logError('OpenAI API error', { status: openAIResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to generate worksheet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices[0].message.content;
    logInfo('OpenAI response received', { responseLength: aiResponse.length });

    // Parse AI response
    let parsedWorksheet;
    try {
      parsedWorksheet = JSON.parse(aiResponse);
    } catch (parseError) {
      logError('Failed to parse AI response', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse worksheet data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML content
    const htmlContent = generateHTMLContent(parsedWorksheet);
    const title = parsedWorksheet.title || formData.lessonTopic || 'English Worksheet';

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const generationTime = Math.round((Date.now() - startTime) / 1000);

    // Store worksheet using bypass function
    const { data: worksheetData, error: insertError } = await supabase.rpc('insert_worksheet_bypass_limit', {
      p_prompt: prompt,
      p_form_data: formData,
      p_ai_response: aiResponse,
      p_html_content: htmlContent,
      p_user_id: user.id,
      p_ip_address: clientIP,
      p_status: 'completed',
      p_title: title,
      p_generation_time_seconds: generationTime,
      p_country: location.country,
      p_city: location.city,
      p_teacher_email: user.email
    });

    if (insertError) {
      logError('Database insert error', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save worksheet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    worksheetId = worksheetData?.[0]?.id;
    logSuccess('Worksheet generated successfully', { 
      worksheetId, 
      generationTime: `${generationTime}s`,
      title 
    });

    return new Response(JSON.stringify({
      success: true,
      worksheet: parsedWorksheet,
      htmlContent,
      worksheetId,
      generationTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const generationTime = Math.round((Date.now() - startTime) / 1000);
    logError('Unexpected error in generateWorksheet', error, { worksheetId, generationTime });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      worksheetId: worksheetId || null,
      generationTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemPrompt(): string {
  return `You are an expert English teacher and worksheet creator. Your task is to create comprehensive, engaging, and pedagogically sound English learning worksheets.

CRITICAL: You must respond with valid JSON only. No additional text, explanations, or markdown formatting outside the JSON structure.

LANGUAGE STYLE INSTRUCTIONS:
- Language Style 1-2 (Very Casual): Use slang, contractions, informal expressions, everyday language
- Language Style 3-4 (Casual): Use relaxed, friendly tone with some contractions, conversational style
- Language Style 5-6 (Neutral): Use balanced, clear language, moderate formality
- Language Style 7-8 (Formal): Use professional tone, complete sentences, proper grammar
- Language Style 9-10 (Very Formal): Use academic style, sophisticated vocabulary, complex structures

CONTENT QUALITY GUIDELINES:
- Create authentic, real-world scenarios and contexts
- Use varied and engaging exercise types
- Include practical vocabulary relevant to the topic
- Ensure exercises progress from simple to complex
- Make content culturally appropriate and inclusive
- Focus on communicative competence, not just grammar
- Include both receptive and productive skills

WARMUP QUESTIONS GUIDELINES:
- Create 3-5 engaging questions that introduce the topic
- Questions should be discussion-based and encourage student participation
- Make questions relevant to students' experiences and interests
- Use appropriate language level for the specified CEFR level
- Questions should activate prior knowledge and create interest in the topic

STRUCTURE REQUIREMENTS:
Your response must be a valid JSON object with this exact structure:
{
  "title": "worksheet title",
  "subtitle": "engaging subtitle",
  "introduction": "brief lesson introduction",
  "warmup_questions": ["question1", "question2", "question3"],
  "exercises": [
    {
      "id": 1,
      "type": "exercise_type",
      "title": "exercise title",
      "instructions": "clear instructions",
      "content": "exercise content or questions array"
    }
  ],
  "vocabulary_sheet": [
    {
      "term": "vocabulary word",
      "meaning": "definition or explanation"
    }
  ]
}

EXERCISE TYPES AVAILABLE:
- reading: Reading comprehension with text and questions
- multiple_choice: Multiple choice questions
- fill_in_blanks: Fill in the blank exercises
- matching: Matching exercises
- dialogue: Dialogue completion or creation
- writing: Writing prompts and tasks
- grammar: Grammar practice exercises

Ensure all content is educationally valuable, engaging, and appropriate for the specified English level and lesson duration.`;
}

function createComprehensivePrompt(formData: any): string {
  const prompt = `
LESSON DETAILS:
- Lesson Duration: ${formData.lessonTime}
- English Level: ${formData.englishLevel}
- Topic: ${formData.lessonTopic}
- Focus/Goal: ${formData.lessonGoal}
- Teaching Preferences: ${formData.teachingPreferences || 'None specified'}
- Additional Information: ${formData.additionalInformation || 'None provided'}
- Language Style: ${formData.languageStyle}/10 (1=very casual, 10=very formal)

Please generate a comprehensive English lesson worksheet based on these requirements. Follow the language style specified and ensure the content matches the English level and lesson duration.`;

  return prompt.trim();
}

function generateHTMLContent(worksheet: any): string {
  // Generate basic HTML structure for the worksheet
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${worksheet.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .exercise { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .exercise-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .vocabulary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .vocab-item { margin-bottom: 8px; }
        .vocab-term { font-weight: bold; color: #0066cc; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${worksheet.title}</h1>
        <h2>${worksheet.subtitle}</h2>
        <p>${worksheet.introduction}</p>
    </div>
`;

  // Add warmup questions
  if (worksheet.warmup_questions && worksheet.warmup_questions.length > 0) {
    html += `
    <div class="exercise">
        <div class="exercise-title">Warm-up Discussion</div>
        <ol>`;
    worksheet.warmup_questions.forEach((question: string) => {
      html += `<li>${question}</li>`;
    });
    html += `</ol>
    </div>`;
  }

  // Add exercises
  if (worksheet.exercises && worksheet.exercises.length > 0) {
    worksheet.exercises.forEach((exercise: any) => {
      html += `
    <div class="exercise">
        <div class="exercise-title">${exercise.title}</div>
        <p><strong>Instructions:</strong> ${exercise.instructions}</p>
        <div>${typeof exercise.content === 'string' ? exercise.content : JSON.stringify(exercise.content)}</div>
    </div>`;
    });
  }

  // Add vocabulary sheet
  if (worksheet.vocabulary_sheet && worksheet.vocabulary_sheet.length > 0) {
    html += `
    <div class="vocabulary">
        <h3>Vocabulary</h3>`;
    worksheet.vocabulary_sheet.forEach((item: any) => {
      html += `
        <div class="vocab-item">
            <span class="vocab-term">${item.term}:</span> ${item.meaning}
        </div>`;
    });
    html += `</div>`;
  }

  html += `
</body>
</html>`;

  return html;
}
