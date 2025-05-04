/**
 * Edge function do generowania worksheetów
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";

// Import lokalnych modułów
import { parsePromptMetadata, determineExerciseCount } from "./utils/promptUtils.ts";
import { getExerciseTypesForCount } from "./utils/exerciseUtils.ts";
import { prepareSystemPrompt } from "./services/openaiService.ts";
import { validateAndFixWorksheetData, saveWorksheetToDatabase } from "./services/worksheetService.ts";

// Inicjalizacja klientów
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Nagłówki CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Główna funkcja serwująca
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pobranie danych z żądania
    const { prompt: rawPrompt, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rawPrompt) {
      throw new Error('Missing prompt parameter');
    }

    console.log('Received prompt:', rawPrompt);

    // Parsowanie metadanych z promptu
    const {
      lessonTopic,
      lessonGoal,
      teachingPreferences,
      studentProfile,
      mainStruggles
    } = parsePromptMetadata(rawPrompt);

    // Określenie liczby zadań na podstawie czasu lekcji
    const exerciseCount = determineExerciseCount(rawPrompt);
    
    // Pobranie typów zadań do wygenerowania
    const exerciseTypes = getExerciseTypesForCount(exerciseCount);
    
    // Przygotowanie i wysłanie promptu do OpenAI
    const systemPrompt = prepareSystemPrompt(
      lessonTopic,
      lessonGoal,
      teachingPreferences,
      studentProfile,
      mainStruggles,
      exerciseCount,
      exerciseTypes
    );

    // Generowanie worksheetu przy użyciu OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawPrompt }
      ],
      max_tokens: 5000
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Walidacja i poprawa danych worksheetu
    const worksheetData = await validateAndFixWorksheetData(
      jsonContent, 
      exerciseCount, 
      exerciseTypes,
      openai,
      rawPrompt
    );
    
    // Zapis worksheetu do bazy danych
    const savedWorksheetData = await saveWorksheetToDatabase(
      supabase,
      worksheetData,
      rawPrompt,
      userId,
      ip
    );

    // Zwrócenie danych worksheetu
    return new Response(JSON.stringify(savedWorksheetData || worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        stack: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
