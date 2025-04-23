
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
             - Reading comprehension
             - Vocabulary practice
             - Grammar exercises
             - Role-play or dialogue exercises
             - Multiple choice questions
             - Gap-filling exercises
          4. Each exercise should have:
             - Clear instructions
             - Teacher tips
             - Estimated completion time
          Format the response in semantic HTML with appropriate tags.
          Each exercise should be in a separate <section> with a proper heading.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const htmlContent = aiResponse.choices[0].message.content;

    // Save worksheet to database
    const { data: worksheet, error: worksheetError } = await supabase
      .from('worksheets')
      .insert({
        prompt,
        html_content: htmlContent,
        user_id: userId,
        ip_address: ip,
        status: 'created'
      })
      .select('id')
      .single();

    if (worksheetError) throw worksheetError;

    // Track generation event
    await supabase.from('events').insert({
      type: 'generate',
      event_type: 'generate',
      worksheet_id: worksheet.id,
      user_id: userId,
      metadata: { prompt, ip },
      ip_address: ip
    });

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
