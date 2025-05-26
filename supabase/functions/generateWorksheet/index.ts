import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // Rate Limiting
    const { data: rateLimitData, error: rateLimitError } = await supabaseClient
      .from('rate_limits')
      .select('count, last_reset')
      .eq('user_id', userId)
      .single();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Error fetching rate limit:', rateLimitError);
      throw new Error('Failed to check rate limit');
    }

    const now = new Date();
    const resetTime = new Date();
    resetTime.setUTCHours(24, 0, 0, 0); // UTC midnight

    let count = 0;
    let lastReset = now.toISOString();

    if (rateLimitData) {
      count = rateLimitData.count;
      lastReset = rateLimitData.last_reset;
    }

    const lastResetDate = new Date(lastReset);

    if (now > resetTime && lastResetDate < resetTime) {
      // Reset the count if the current time is past midnight UTC and the last reset was before midnight UTC
      count = 0;
      lastReset = now.toISOString();
    }

    if (count >= 10) {
      console.warn('Rate limit exceeded for user:', userId);
      return new Response(JSON.stringify({ error: 'You have reached your daily limit for worksheet generation. Please try again tomorrow.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment the count
    count++;

    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .upsert({
        user_id: userId,
        count: count,
        last_reset: lastReset,
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error('Error updating rate limit:', updateError);
      throw new Error('Failed to update rate limit');
    }

    const systemPrompt = `You are an expert English teacher creating worksheets for adult 1-on-1 lessons. Create a comprehensive worksheet in JSON format with the following structure:

{
  "title": "Clear, engaging title",
  "subtitle": "Brief subtitle describing the focus",
  "introduction": "Brief introduction paragraph explaining the lesson goals",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "📖",
      "time": 15,
      "instructions": "Read the passage and answer the questions below.",
      "content": "Generate a passage between 280 and 320 words on the given topic",
      "questions": [
        {"text": "Question 1", "answer": "Answer 1"},
        {"text": "Question 2", "answer": "Answer 2"},
        {"text": "Question 3", "answer": "Answer 3"},
        {"text": "Question 4", "answer": "Answer 4"},
        {"text": "Question 5", "answer": "Answer 5"}
      ],
      "teacher_tip": "Teaching guidance for this exercise"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Word 1", "meaning": "Definition 1"},
    {"term": "Word 2", "meaning": "Definition 2"}
  ]
}

CRITICAL REQUIREMENTS:
- Reading exercise content must be exactly 280-320 words
- Include exactly 5 comprehension questions
- All exercises must have teacher_tip field
- Return ONLY valid JSON, no additional text or explanations
- Ensure all quotes are properly escaped`;

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received, processing...');

    let content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from AI');
    }

    // Clean up the response to ensure it's valid JSON
    content = content.trim();
    
    // Remove any markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON content between first { and last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.substring(firstBrace, lastBrace + 1);
    }

    let worksheetData;
    try {
      worksheetData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', content);
      
      // Try to fix common JSON issues
      try {
        // Fix common escape issues
        const fixedContent = content
          .replace(/\\'/g, "'")
          .replace(/([^\\])"/g, '$1\\"')
          .replace(/\\n/g, '\\\\n');
        
        worksheetData = JSON.parse(fixedContent);
      } catch (secondParseError) {
        console.error('Second parse attempt failed:', secondParseError);
        throw new Error('Failed to generate a valid worksheet structure. Please try again.');
      }
    }

    // Validate the worksheet structure
    if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
      throw new Error('Invalid worksheet structure: missing exercises array');
    }

    // Ensure all required fields are present
    if (!worksheetData.title) worksheetData.title = 'English Worksheet';
    if (!worksheetData.subtitle) worksheetData.subtitle = 'Practice Exercise';
    if (!worksheetData.introduction) worksheetData.introduction = 'Complete the exercises below to practice your English skills.';

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
