import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseClient } from '../_shared/supabase/client.ts';
import { createClient } from '@supabase/supabase-js';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

serve(async (req) => {
  // Handle CORS pre-flight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    const { data: { user } } = await supabase.auth.getUser(jwt);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get the request body
    const { prompt, formData, systemPrompt, ipAddress, title } = await req.json();

    // Validate that all required data is present
    if (!prompt || !formData || !systemPrompt || !ipAddress || !title) {
      console.error('Missing required data. Request body:', { prompt, formData, systemPrompt, ipAddress, title });
      return new Response(JSON.stringify({ error: 'Missing required data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const startTime = performance.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-2025-06-10',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate worksheet content' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const aiResponse = await response.json();
    const endTime = performance.now();
    const generationTimeSeconds = Math.round((endTime - startTime) / 1000);

    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      console.error('No choices returned from OpenAI API. Full response:', aiResponse);
      return new Response(JSON.stringify({ error: 'No content generated' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const aiContent = aiResponse.choices[0].message.content;

    // Call the Supabase function to bypass RLS and insert the worksheet data
    const { data, error } = await supabaseClient.functions.invoke('insert-worksheet-bypass-limit', {
      body: {
        prompt: prompt,
        form_data: formData,
        ai_response: aiContent,
        html_content: '',
        user_id: user.id,
        ip_address: ipAddress,
        status: 'generated',
        title: title,
        generation_time_seconds: generationTimeSeconds
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save worksheet' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Return the generated worksheet data
    return new Response(
      JSON.stringify({ data }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
