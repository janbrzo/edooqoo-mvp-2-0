
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateRequest } from './validators.ts'
import { isRateLimited } from './rateLimiter.ts'
import { getGeolocation } from './geolocation.ts'
import { validateSecurity } from './security.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get language style description and instructions
const getLanguageStyleInstructions = (languageStyleValue: number): string => {
  const value = languageStyleValue || 5;
  
  let description = "";
  let instructions = "";
  
  if (value <= 2) {
    description = "(very casual - slang, contractions)";
    instructions = `
- Use very casual, conversational language with contractions (I'm, you're, can't, won't)
- Include everyday slang and informal expressions where appropriate
- Use shorter, simpler sentences and relaxed grammar
- Examples: "Hey, what's up?", "That's awesome!", "No way!", "Let's grab a coffee"`;
  } else if (value <= 4) {
    description = "(casual - relaxed, friendly)";
    instructions = `
- Use casual, relaxed language with frequent contractions
- Include friendly, informal expressions
- Use conversational tone and everyday vocabulary
- Examples: "How's it going?", "That's great!", "Sounds good!", "Want to hang out?"`;
  } else if (value <= 6) {
    description = "(neutral - balanced style)";
    instructions = `
- Use neutral, balanced language that's friendly but not too casual
- Mix contractions with full forms naturally
- Use common idioms and everyday expressions
- Examples: "How are you doing?", "That sounds great!", "I'd love to", "Let's meet up"`;
  } else if (value <= 8) {
    description = "(formal - professional tone)";
    instructions = `
- Use more formal, professional language with proper grammar
- Prefer full forms over contractions (I am, you are, cannot, will not)
- Use sophisticated vocabulary and complete sentence structures
- Examples: "How are you today?", "That is excellent!", "I would be pleased to", "Shall we arrange a meeting?"`;
  } else {
    description = "(very formal - academic style)";
    instructions = `
- Use very formal, professional language with proper grammar
- Always use full forms, avoid contractions completely
- Use sophisticated vocabulary and complex sentence structures
- Examples: "Good morning, how are you today?", "That is truly excellent!", "I would be delighted to", "Would you care to arrange a formal meeting?"`;
  }
  
  return `${value}/10 ${description}${instructions}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting worksheet generation...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
    const openaiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get request data and validate
    const { prompt, formDataForStorage, userId, studentId } = await req.json()
    console.log('📝 Received request:', { prompt: prompt?.substring(0, 100) + '...', userId, studentId })
    
    validateRequest(prompt, formDataForStorage, userId)
    
    // Security validation
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    await validateSecurity(supabase, userId, clientIP)
    
    // Rate limiting check
    if (await isRateLimited(supabase, userId, clientIP)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Parse language style from prompt for instructions
    let languageStyleValue = 5;
    const languageStyleMatch = prompt.match(/languageStyle:\s*(\d+)\/10/);
    if (languageStyleMatch) {
      languageStyleValue = parseInt(languageStyleMatch[1]);
    }

    // Enhanced system prompt with all AI instructions
    const systemPrompt = `You are an expert English teacher creating lesson worksheets for 1-on-1 adult English lessons. 

LANGUAGE STYLE GUIDELINES:
${getLanguageStyleInstructions(languageStyleValue)}

CONTENT QUALITY INSTRUCTIONS:
- DIVERSITY: Ensure each exercise has completely different examples, scenarios, and contexts. Never repeat similar situations, names, places, or topics across exercises.
- VARIETY: Use diverse vocabulary, varied sentence structures, and different real-life contexts in each exercise.
- NATURAL LANGUAGE: Write in natural, authentic English that people actually use in real conversations and situations.

WARMUP QUESTIONS REQUIREMENT:
Include a "warmup_questions" section with exactly 4 conversation starter questions that are personal and opinion-based, directly related to the lesson topic. These should help students think about the topic and engage them at the beginning of the lesson. Make question number 1 and 2 generic and question number 3 and 4 specific.

Create a comprehensive English lesson worksheet based on the provided parameters. The worksheet should include diverse exercises, clear instructions, and appropriate difficulty level.

Return your response as valid JSON with this exact structure:
{
  "title": "Lesson title",
  "subtitle": "Brief subtitle",
  "introduction": "Lesson introduction paragraph",
  "warmup_questions": [
    "Question 1 (generic)",
    "Question 2 (generic)", 
    "Question 3 (specific)",
    "Question 4 (specific)"
  ],
  "exercises": [
    {
      "type": "exercise_type",
      "title": "Exercise Title",
      "icon": "📝",
      "time": 10,
      "instructions": "Clear instructions",
      "content": "Exercise content or questions",
      "teacher_tip": "Helpful tip for teacher"
    }
  ],
  "vocabulary_sheet": [
    {
      "term": "vocabulary word",
      "meaning": "definition"
    }
  ]
}

Available exercise types: reading, multiple_choice, fill_in_blanks, matching, dialogue, vocabulary, grammar_focus, conversation_practice, writing, role_play, pronunciation.

Guidelines:
- Create 4-7 varied exercises
- Include vocabulary sheet with 8-12 terms
- Each exercise should have realistic timing (5-15 minutes)
- All content should match the specified English level
- Use the specified language style consistently
- Make exercises engaging and practical for adult learners`

    // Clean user prompt - remove our internal formatting
    const cleanedPrompt = prompt.replace(/languageStyle:\s*\d+\/10[^\n]*/g, '').trim()

    console.log('🤖 Calling OpenAI API...')
    const startTime = Date.now()
    
    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API Error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const generationTime = Math.round((Date.now() - startTime) / 1000)
    
    console.log('✅ OpenAI response received, generation time:', generationTime, 'seconds')
    
    if (!openaiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response format')
    }

    // Parse and validate JSON response
    let worksheetData
    try {
      const content = openaiData.choices[0].message.content.trim()
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('No JSON found in OpenAI response')
      }
      
      worksheetData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      throw new Error(`Failed to parse worksheet JSON: ${parseError.message}`)
    }

    // Get geolocation data
    const { country, city } = await getGeolocation(clientIP)

    // Get user email for teacher_email field
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const teacherEmail = userData?.user?.email || null

    // Generate title from worksheet data or form data
    const worksheetTitle = worksheetData.title || 
                          formDataForStorage?.lessonTopic || 
                          'English Lesson Worksheet'

    console.log('💾 Saving worksheet to database...')
    
    // Save worksheet to database using RPC
    const { data: insertResult, error: insertError } = await supabase.rpc(
      'insert_worksheet_bypass_limit',
      {
        p_prompt: prompt,
        p_form_data: formDataForStorage,
        p_ai_response: JSON.stringify(worksheetData),
        p_html_content: '', // Will be generated on frontend
        p_user_id: userId,
        p_ip_address: clientIP,
        p_status: 'completed',
        p_title: worksheetTitle,
        p_generation_time_seconds: generationTime,
        p_country: country,
        p_city: city,
        p_teacher_email: teacherEmail
      }
    )

    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    console.log('✅ Worksheet saved successfully:', insertResult)

    // If studentId provided, update the worksheet with student assignment
    if (studentId && insertResult?.[0]?.id) {
      const { error: updateError } = await supabase
        .from('worksheets')
        .update({ student_id: studentId })
        .eq('id', insertResult[0].id)
        .eq('teacher_id', userId)

      if (updateError) {
        console.warn('⚠️ Failed to assign student to worksheet:', updateError)
      } else {
        console.log('✅ Worksheet assigned to student:', studentId)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      worksheet: worksheetData,
      worksheetId: insertResult?.[0]?.id,
      generationTime,
      sourceCount: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in generate-worksheet function:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
