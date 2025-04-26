
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userIp = ip.split(',')[0].trim();
    
    console.log(`Processing request for IP: ${userIp}`);
    
    // Check if this IP has reached the limit (unless it's the whitelisted IP)
    const whitelistedIp = '46.227.241.106';
    if (userIp !== whitelistedIp) {
      const { count } = await supabase
        .from('worksheets')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', userIp);
        
      console.log(`Found ${count} existing worksheets for IP: ${userIp}`);
      
      if (count && count >= 1) {
        return new Response(JSON.stringify({ 
          error: 'You have reached your daily limit for worksheet generation. Please try again tomorrow.' 
        }), { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log(`Whitelisted IP detected: ${whitelistedIp}, bypassing limits`);
    }

    // Parse the prompt parameters
    const promptDetails = JSON.parse(prompt);
    const { lessonTopic, lessonGoal, teachingPreferences, studentProfile, studentStruggles, lessonTime } = promptDetails;
    
    // Determine exercise count based on lesson duration
    let exerciseCount = 5; // Default
    let lessonMinutes = "45";
    
    if (lessonTime === "30 min") {
      exerciseCount = 4;
      lessonMinutes = "30";
    } else if (lessonTime === "60 min") {
      exerciseCount = 6;
      lessonMinutes = "60";
    }
    
    // Define exercise types based on count and preferences
    const baseExerciseTypes = [
      "Reading Passage with Comprehension Questions (EXACTLY 280-320 words)",
      "Vocabulary Matching (EXACTLY 10 items)",
      "Fill in the Blanks (EXACTLY 10 items)",
      "Multiple Choice Questions (EXACTLY 5 questions with 4 options each)",
      "Speaking Practice with a Dialogue",
      "Discussion Questions (EXACTLY 5 questions)"
    ];
    
    // Select appropriate number of exercises
    const finalExerciseTypes = baseExerciseTypes.slice(0, exerciseCount);
    const exerciseList = finalExerciseTypes.map(type => `- ${type}`).join("\\n");

    // Construct the enhanced system prompt
    const systemPrompt = `You are an expert ESL teacher assistant specialized in creating professional worksheets with exercises.

Create a detailed HTML worksheet with the following structure:
1. Title with <h1> tag that clearly states the topic: "${lessonTopic}"
2. Subtitle with <h2> tag focusing on: "${lessonGoal}"
3. Brief introduction in <p> tags explaining the lesson objectives (2-3 sentences)
4. EXACTLY ${exerciseCount} exercises in <section> elements, each containing:
   - <h3> heading with exercise title and number
   - <p> with clear instructions
   - Complete content (NO placeholders)
   - All examples, questions, and answers
   - A <div class="teacher-tip"> element with teaching advice

Required Exercise Types:
${exerciseList}

Format Requirements:
- Use semantic HTML with proper heading hierarchy
- Each exercise in a <section> with appropriate class names
- Reading text MUST be EXACTLY 280-320 words (count carefully)
- Include complete content for all exercises
- For teacher tips, use <div class="teacher-tip">Tip content</div>
- Include estimated time in minutes for each exercise

The worksheet must be fully formatted, ready to use, and complete with all content.`;

    // User prompt with all the details
    const userPrompt = `Create an ESL worksheet with these specifications:
Topic: ${lessonTopic}
Goal: ${lessonGoal}
Teaching Preferences: ${teachingPreferences}
${studentProfile ? `Student Profile: ${studentProfile}` : ''}
${studentStruggles ? `Student Struggles: ${studentStruggles}` : ''}
Lesson Duration: ${lessonTime}

The worksheet should be formatted in clean HTML that can be directly displayed in a browser.`;

    // Generate worksheet using OpenAI with structured prompt
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3500
    });

    const htmlContent = aiResponse.choices[0].message.content;
    
    console.log(`Successfully generated content from OpenAI`);

    // Store the complete prompt that was sent to OpenAI
    const fullPromptForStorage = {
      systemPrompt,
      userPrompt,
      lessonTopic,
      lessonGoal,
      teachingPreferences,
      studentProfile,
      studentStruggles,
      lessonTime
    };

    // Save worksheet to database with full prompt and complete HTML
    const { data: worksheet, error: worksheetError } = await supabase
      .from('worksheets')
      .insert({
        prompt: JSON.stringify(fullPromptForStorage), // Store complete prompt as JSON
        html_content: htmlContent,
        user_id: userId,
        ip_address: userIp,
        status: 'created',
        title: lessonTopic // Store the title for easier reference
      })
      .select('id')
      .single();

    if (worksheetError) {
      console.error('Error inserting worksheet:', worksheetError);
      throw worksheetError;
    }

    // Track generation event
    const { error: eventError } = await supabase.from('events').insert({
      type: 'generate',
      worksheet_id: worksheet.id,
      user_id: userId,
      metadata: { prompt: JSON.stringify(fullPromptForStorage), ip: userIp },
      ip_address: userIp
    });

    if (eventError) {
      console.error('Error tracking event:', eventError);
    }

    console.log(`Worksheet created with ID: ${worksheet.id}`);
    
    return new Response(htmlContent, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
