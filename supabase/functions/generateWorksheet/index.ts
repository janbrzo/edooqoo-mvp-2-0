
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
    const { prompt, formData, userId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return new Response(
        JSON.stringify({ error: promptValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
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
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Parse the lesson time from the prompt to determine exercise count
    let finalExerciseCount = 8; // Always generate 8 first
    let shouldTrimTo6 = false;
    
    if (sanitizedPrompt.includes('45 min')) {
      shouldTrimTo6 = true;
      finalExerciseCount = 6; // Final count will be 6
    } else if (sanitizedPrompt.includes('60 min')) {
      finalExerciseCount = 8; // Final count will be 8
    }
    
    // Always use the 8-exercise set for generation
    const exerciseTypes = getExerciseTypesForCount(8);
    
    // Generate worksheet using OpenAI
    const jsonContent = await generateWorksheetWithAI(sanitizedPrompt, exerciseTypes);
    
    console.log('AI response received, processing...');
    console.log('Raw response length:', jsonContent?.length || 0);
    console.log('Response starts with:', jsonContent?.substring(0, 100));
    
    // Parse the JSON response with enhanced error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
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
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response content preview (first 1000 chars):', jsonContent?.substring(0, 1000));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save worksheet to database
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
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
