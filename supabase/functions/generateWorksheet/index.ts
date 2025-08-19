
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateInput, isValidWorksheetData } from './validators.ts'
import { handleRateLimit } from './rateLimiter.ts'
import { detectGeolocation } from './geolocation.ts'
import { 
  sanitizeInput, 
  generateSecureId, 
  validateIPAddress,
  SecurityError 
} from './security.ts'
import { 
  logRequest, 
  logError, 
  logResponse,
  calculateGenerationTime 
} from './helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, cf-connecting-ip',
}

interface RequestBody {
  prompt: string;
  formData: any;
  userId: string;
  studentId?: string;
}

serve(async (req) => {
  const startTime = Date.now();
  let requestId: string;
  
  try {
    requestId = generateSecureId();
    
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const openaiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
    const timeoutMs = parseInt(Deno.env.get('OPENAI_TIMEOUT_MS') || '60000');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown';
    
    if (!validateIPAddress(clientIP)) {
      throw new SecurityError('Invalid IP address');
    }

    logRequest(requestId, clientIP, req.headers.get('user-agent') || 'unknown');

    const requestBody = await req.json() as RequestBody;
    const { prompt, formData, userId, studentId } = requestBody;

    // Input validation
    const validationResult = validateInput(prompt, formData, userId);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt);
    const sanitizedUserId = sanitizeInput(userId);

    // Rate limiting
    const rateLimitResult = await handleRateLimit(clientIP, sanitizedUserId);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.error }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and email for teacher_email field
    let teacherEmail = null;
    if (sanitizedUserId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', sanitizedUserId)
          .single();
        
        if (profile?.email) {
          teacherEmail = profile.email;
          console.log('📧 Teacher email retrieved:', teacherEmail);
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch teacher email:', error);
      }
    }

    // Consume token
    if (sanitizedUserId) {
      const { data: consumed, error: tokenError } = await supabase
        .rpc('consume_token', {
          p_teacher_id: sanitizedUserId,
          p_worksheet_id: '00000000-0000-0000-0000-000000000000'
        });

      if (tokenError || !consumed) {
        console.log('❌ Token consumption failed:', tokenError);
        return new Response(
          JSON.stringify({ error: 'Insufficient tokens or daily limit reached' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Token consumed successfully');
    }

    // Detect geolocation
    const { country, city } = await detectGeolocation(clientIP);
    console.log(`🌍 Location detected: ${city}, ${country}`);

    // Generate content with OpenAI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    console.log(`🤖 Calling OpenAI with model: ${openaiModel}`);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert English teacher creating educational worksheets for adult learners. Always respond with valid JSON only, no additional text.

The JSON structure must be:
{
  "title": "Engaging worksheet title",
  "subtitle": "Brief description",
  "introduction": "Introduction paragraph explaining the lesson focus",
  "exercises": [array of exercise objects],
  "vocabulary_sheet": [array of vocabulary objects]
}

Exercise types and structures:
1. READING (always include): {"type": "reading", "title": "Reading Comprehension", "icon": "📖", "time": 15, "instructions": "Read the text and answer the questions", "content": "300-word text here", "questions": [{"text": "Question?", "answer": "Answer"}], "teacher_tip": "Teaching advice"}

2. VOCABULARY: {"type": "vocabulary", "title": "Vocabulary Practice", "icon": "📚", "time": 10, "instructions": "Instructions", "items": [{"word": "word", "definition": "definition", "example": "example sentence"}], "teacher_tip": "Teaching advice"}

3. FILL_IN_BLANKS: {"type": "fill_in_blanks", "title": "Fill in the Blanks", "icon": "✏️", "time": 10, "instructions": "Complete the sentences", "sentences": [{"text": "I ___ to work every day.", "answer": "go", "options": ["go", "goes", "going"]}], "teacher_tip": "Teaching advice"}

4. MULTIPLE_CHOICE: {"type": "multiple_choice", "title": "Multiple Choice", "icon": "☑️", "time": 8, "instructions": "Choose the correct answer", "questions": [{"question": "Question?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Why this is correct"}], "teacher_tip": "Teaching advice"}

5. MATCHING: {"type": "matching", "title": "Match the Items", "icon": "🔗", "time": 10, "instructions": "Match left with right", "pairs": [{"left": "Term", "right": "Definition"}], "teacher_tip": "Teaching advice"}

6. DIALOGUE: {"type": "dialogue", "title": "Dialogue Practice", "icon": "💬", "time": 12, "instructions": "Practice this conversation", "dialogue": [{"speaker": "A", "text": "Hello!"}, {"speaker": "B", "text": "Hi there!"}], "teacher_tip": "Teaching advice"}

Requirements:
- Always include ONE reading exercise with 300-word text and 5+ questions
- Lesson duration determines exercise count: 30min=4, 45min=6, 60min=8 exercises
- All exercises must have teacher_tip field
- vocabulary_sheet must have 8-12 terms relevant to the lesson
- Content must match the specified English level and lesson goals`
          },
          {
            role: 'user',
            content: sanitizedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    clearTimeout(timeoutId);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    console.log('📝 Generated content length:', generatedContent.length);

    // Parse and validate generated content
    let worksheetData;
    try {
      worksheetData = JSON.parse(generatedContent);
      
      if (!isValidWorksheetData(worksheetData)) {
        throw new Error('Invalid worksheet structure from AI');
      }
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Generate HTML content
    const htmlContent = generateWorksheetHTML(worksheetData);
    const generationTime = calculateGenerationTime(startTime);

    console.log(`📊 Generation completed in ${generationTime}s`);

    // Save to database with teacher_email
    const { data: insertData, error: insertError } = await supabase
      .rpc('insert_worksheet_bypass_limit', {
        p_prompt: sanitizedPrompt,
        p_form_data: formData,
        p_ai_response: JSON.stringify(worksheetData),
        p_html_content: htmlContent,
        p_user_id: sanitizedUserId,
        p_ip_address: clientIP,
        p_status: 'completed',
        p_title: worksheetData.title,
        p_generation_time_seconds: generationTime,
        p_country: country || null,
        p_city: city || null,
        p_teacher_email: teacherEmail  // Pass teacher email to database
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to save worksheet to database');
    }

    // Update worksheet with student_id if provided
    if (studentId && insertData && insertData.length > 0) {
      const worksheetId = insertData[0].id;
      
      const { error: updateError } = await supabase
        .from('worksheets')
        .update({ student_id: studentId })
        .eq('id', worksheetId);
        
      if (updateError) {
        console.warn('⚠️ Failed to update student_id:', updateError);
      } else {
        console.log('✅ Student ID assigned to worksheet');
      }
    }

    const responseData = {
      ...worksheetData,
      id: insertData?.[0]?.id || null,
      generationTime,
      sourceCount: 1
    };

    logResponse(requestId, responseData, generationTime);

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const generationTime = calculateGenerationTime(startTime);
    logError(requestId || 'unknown', error, generationTime);
    
    console.error('💥 Error in generateWorksheet:', error);
    
    const statusCode = error instanceof SecurityError ? 400 : 
                      error.name === 'AbortError' ? 408 : 500;
    
    const errorMessage = error instanceof SecurityError ? error.message :
                        error.name === 'AbortError' ? 'Request timeout' :
                        'Internal server error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateWorksheetHTML(worksheet: any): string {
  if (!worksheet) return '';
  
  try {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${worksheet.title || 'English Worksheet'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 15px; }
        .introduction { background: #f9f9f9; padding: 15px; border-left: 4px solid #007acc; margin-bottom: 25px; }
        .exercise { margin-bottom: 30px; page-break-inside: avoid; }
        .exercise-header { background: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
        .exercise-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .exercise-time { color: #666; font-size: 14px; }
        .exercise-instructions { margin-bottom: 15px; }
        .question { margin-bottom: 10px; }
        .vocabulary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .vocabulary-table th, .vocabulary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .vocabulary-table th { background-color: #f2f2f2; font-weight: bold; }
        .teacher-tip { background: #e8f4fd; border: 1px solid #b3d7ff; border-radius: 5px; padding: 15px; margin-top: 10px; }
        .teacher-tip-title { font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        @media print { body { margin: 0; padding: 10mm; } .teacher-tip { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${worksheet.title || 'English Worksheet'}</div>
        <div class="subtitle">${worksheet.subtitle || ''}</div>
        <div class="introduction">${worksheet.introduction || ''}</div>
    </div>`;

    if (worksheet.exercises && Array.isArray(worksheet.exercises)) {
      worksheet.exercises.forEach((exercise: any, index: number) => {
        html += `
    <div class="exercise">
        <div class="exercise-header">
            <div class="exercise-title">${exercise.icon || '📝'} ${exercise.title || `Exercise ${index + 1}`}</div>
            <div class="exercise-time">⏱️ ${exercise.time || 10} minutes</div>
        </div>
        <div class="exercise-instructions">${exercise.instructions || ''}</div>`;
        
        if (exercise.content) {
          html += `<div>${exercise.content}</div>`;
        }
        
        if (exercise.questions && Array.isArray(exercise.questions)) {
          exercise.questions.forEach((question: any, qIndex: number) => {
            html += `<div class="question">${qIndex + 1}. ${question.question || question.text || ''}</div>`;
          });
        }
        
        if (exercise.teacher_tip) {
          html += `
        <div class="teacher-tip">
            <div class="teacher-tip-title">💡 Teacher Tip:</div>
            <div>${exercise.teacher_tip}</div>
        </div>`;
        }
        
        html += `</div>`;
      });
    }

    if (worksheet.vocabulary_sheet && Array.isArray(worksheet.vocabulary_sheet) && worksheet.vocabulary_sheet.length > 0) {
      html += `
    <div class="exercise">
        <div class="exercise-header">
            <div class="exercise-title">📖 Vocabulary</div>
        </div>
        <table class="vocabulary-table">
            <tr>
                <th>Term</th>
                <th>Meaning</th>
            </tr>`;
      
      worksheet.vocabulary_sheet.forEach((item: any) => {
        html += `
            <tr>
                <td>${item.term || ''}</td>
                <td>${item.meaning || ''}</td>
            </tr>`;
      });
      
      html += `
        </table>
    </div>`;
    }

    html += `
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        Created with edooqoo.com
    </div>
</body>
</html>`;

    return html;
    
  } catch (error) {
    console.error('Error generating HTML:', error);
    return `<html><body><h1>${worksheet.title || 'English Worksheet'}</h1><p>Error generating content</p></body></html>`;
  }
}
