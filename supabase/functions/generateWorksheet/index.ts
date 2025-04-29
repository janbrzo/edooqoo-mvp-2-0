
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
    
    console.log(`Processing request for IP: ${ip}`);
    
    // Check if this IP has reached the limit (unless it's the whitelisted IP)
    if (ip !== '46.227.241.106') {
      const { count } = await supabase
        .from('worksheets')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip);
        
      console.log(`Found ${count} existing worksheets for IP: ${ip}`);
      
      if (count && count >= 1) {
        return new Response(JSON.stringify({ 
          error: 'You have reached your daily limit for worksheet generation. Please try again tomorrow.' 
        }), { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log(`Whitelisted IP detected: ${ip}, bypassing limits`);
    }

    // Generate worksheet using OpenAI with a structured prompt
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert ESL teacher assistant that creates detailed worksheets with exercises. 
          Create a worksheet with the following structure:
          1. Title and subtitle that clearly state the topic and focus
          2. Brief introduction explaining the lesson objectives
          3. 4-6 varied exercises that include:
             - Reading comprehension (with a text of EXACTLY 280-320 words)
             - Vocabulary practice
             - Grammar exercises
             - Role-play or dialogue exercises
             - Multiple choice questions
             - Gap-filling exercises
          4. Each exercise should have:
             - Clear instructions
             - Complete content (full text passages, all questions, all options, etc.)
             - Teacher tips
             - Estimated completion time
          Format the response in semantic HTML with appropriate tags.
          Each exercise should be in a separate <section> with a proper heading.
          DO NOT skip any parts or leave placeholders - create COMPLETE exercises with full content.
          The worksheet must be fully ready to use without any further editing needed.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3500
    });

    const htmlContent = aiResponse.choices[0].message.content;
    
    console.log(`Successfully generated content from OpenAI`);

    // Save worksheet to database with the full prompt
    const { data: worksheet, error: worksheetError } = await supabase
      .from('worksheets')
      .insert({
        prompt: prompt, // Store the full prompt sent to OpenAI
        html_content: htmlContent,
        user_id: userId,
        ip_address: ip,
        status: 'created'
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
      event_type: 'generate',
      worksheet_id: worksheet.id,
      user_id: userId,
      metadata: { prompt, ip },
      ip_address: ip
    });

    if (eventError) {
      console.error('Error tracking event:', eventError);
    }

    console.log(`Worksheet created with ID: ${worksheet.id}`);
    
    // Return the generated HTML content to the client
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
