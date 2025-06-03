
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getExerciseTypesForCount, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';
import { isValidUUID, sanitizeInput, validatePrompt } from './validation.ts';
import { RateLimiter } from './rateLimiter.ts';
import { generateWorksheetWithAI } from './openaiService.ts';
import { saveWorksheetToDatabase } from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GENERATE WORKSHEET REQUEST ===');
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    console.log('Request data:', { 
      promptLength: prompt?.length, 
      hasFormData: !!formData, 
      userId: userId?.substring(0, 8) + '...',
      ip 
    });
    
    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      console.error('Prompt validation failed:', promptValidation.error);
      return new Response(
        JSON.stringify({ error: promptValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
      console.error('Invalid userId format:', userId);
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    console.log('Sanitized prompt preview:', sanitizedPrompt.substring(0, 100) + '...');

    // Parse the lesson time from the prompt to determine exercise count
    let finalExerciseCount = 8; // Always generate 8 first
    let shouldTrimTo6 = false;
    
    if (sanitizedPrompt.includes('45 min')) {
      shouldTrimTo6 = true;
      finalExerciseCount = 6; // Final count will be 6
      console.log('Detected 45 min lesson - will trim to 6 exercises');
    } else if (sanitizedPrompt.includes('60 min')) {
      finalExerciseCount = 8; // Final count will be 8
      console.log('Detected 60 min lesson - will keep 8 exercises');
    }
    
    // Always use the 8-exercise set for generation
    const exerciseTypes = getExerciseTypesForCount(8);
    console.log('Exercise types for generation:', exerciseTypes);
    
    // Generate worksheet using OpenAI
    console.log('Calling OpenAI service...');
    const jsonContent = await generateWorksheetWithAI(sanitizedPrompt, exerciseTypes);
    
    console.log('=== AI RESPONSE ANALYSIS ===');
    console.log('Raw response length:', jsonContent?.length || 0);
    console.log('Response starts with:', jsonContent?.substring(0, 150));
    console.log('Response ends with:', jsonContent?.substring(-150));
    console.log('Contains ```json:', jsonContent?.includes('```json'));
    console.log('Contains ```:', jsonContent?.includes('```'));
    
    // Parse the JSON response with enhanced error handling
    let worksheetData;
    try {
      console.log('=== PARSING JSON RESPONSE ===');
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      console.log('Successfully parsed worksheet:', {
        title: worksheetData.title,
        exerciseCount: worksheetData.exercises.length,
        hasVocabSheet: !!worksheetData.vocabulary_sheet
      });
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        try {
          validateExercise(exercise);
        } catch (validationError) {
          console.warn(`Exercise validation warning: ${validationError.message}`);
          // Continue with other exercises rather than failing completely
        }
      }
      
      // Always generate 8 exercises, then trim if needed for 45 min
      if (worksheetData.exercises.length !== 8) {
        console.warn(`Expected 8 exercises but got ${worksheetData.exercises.length}`);
        // If we don't have exactly 8, this is an error - no additional generation
        if (worksheetData.exercises.length < 8) {
          throw new Error('AI did not generate the required 8 exercises');
        } else if (worksheetData.exercises.length > 8) {
          worksheetData.exercises = worksheetData.exercises.slice(0, 8);
        }
      }
      
      // Trim to 6 exercises for 45 min lessons (remove last 2: discussion, error-correction)
      if (shouldTrimTo6) {
        worksheetData.exercises = worksheetData.exercises.slice(0, 6);
        console.log('Trimmed from 8 to 6 exercises for 45 min lesson');
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log(`Final exercise count: ${worksheetData.exercises.length} (expected: ${finalExerciseCount})`);
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('=== PARSING FAILED ===');
      console.error('Parse error:', parseError.message);
      console.error('Response content type:', typeof jsonContent);
      console.error('Response preview (first 2000 chars):', jsonContent?.substring(0, 2000));
      console.error('Response preview (last 500 chars):', jsonContent?.substring(-500));
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate a valid worksheet structure. Please try again.',
          details: parseError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save worksheet to database
    console.log('Saving worksheet to database...');
    const worksheetId = await saveWorksheetToDatabase(
      sanitizedPrompt,
      formData,
      jsonContent,
      worksheetData,
      userId,
      ip
    );

    if (worksheetId) {
      worksheetData.id = worksheetId;
      console.log('Worksheet saved with ID:', worksheetId);
    }

    console.log('=== REQUEST COMPLETED SUCCESSFULLY ===');
    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== REQUEST FAILED ===');
    console.error('Error in generateWorksheet:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError,
        details: error.message
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
