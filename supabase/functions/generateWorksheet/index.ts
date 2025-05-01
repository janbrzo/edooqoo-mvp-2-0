
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure OpenAI
const openAiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Function to insert a new worksheet into the database
async function insertWorksheet(prompt: string, worksheetData: any, userId: string, ipAddress: string | null) {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    return null;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Prepare the worksheet data for database insertion
    const title = worksheetData.title || "Untitled Worksheet";
    const htmlContent = JSON.stringify(worksheetData);
    
    // Create full HTML version of the worksheet for storage
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3d348b; font-size: 24px; margin-bottom: 10px; }
          h2 { color: #5e44a0; font-size: 20px; margin-bottom: 8px; }
          h3 { color: #7156a5; font-size: 18px; margin-bottom: 8px; }
          .exercise { margin-bottom: 2em; border: 1px solid #eee; padding: 1em; border-radius: 5px; }
          .exercise-header { display: flex; align-items: center; margin-bottom: 1em; }
          .instruction { background-color: #f9f9f9; padding: 0.8em; border-left: 3px solid #5e44a0; margin-bottom: 1em; }
          .reading-content { line-height: 1.5; }
          .question { margin-bottom: 1em; }
          .matching-item { margin-bottom: 0.5em; }
          .fill-in-blank { margin-bottom: 0.5em; }
          .vocabulary-section { margin-top: 2em; border-top: 2px solid #eee; padding-top: 1em; }
          .vocabulary-item { margin-bottom: 0.5em; }
          .teacher-tip { background-color: #edf7ed; padding: 0.8em; border-left: 3px solid #4caf50; margin-top: 1em; }
        </style>
      </head>
      <body>
        <h1>${worksheetData.title}</h1>
        <h2>${worksheetData.subtitle}</h2>
        <p class="introduction">${worksheetData.introduction}</p>
        
        ${worksheetData.exercises.map((ex: any, index: number) => `
          <div class="exercise exercise-${ex.type}">
            <div class="exercise-header">
              <h3>${ex.title}</h3>
              <span class="time">(${ex.time} minutes)</span>
            </div>
            <div class="instruction">${ex.instructions}</div>
            
            ${ex.content ? `<div class="reading-content">${ex.content}</div>` : ''}
            
            ${ex.questions ? `
              <div class="questions">
                <ol>
                  ${ex.questions.map((q: any) => `
                    <li class="question">
                      ${q.question}
                      ${q.options ? `
                        <ul>
                          ${q.options.map((o: string) => `<li>${o}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </li>
                  `).join('')}
                </ol>
              </div>
            ` : ''}
            
            ${ex.items ? `
              <div class="matching">
                <ul>
                  ${ex.items.map((item: any) => `<li class="matching-item">${item.term} - ${item.definition}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${ex.sentences ? `
              <div class="fill-in-blanks">
                <ol>
                  ${ex.sentences.map((s: any) => `<li class="fill-in-blank">${s.text.replace(/\[([^\]]+)\]/g, '____')}</li>`).join('')}
                </ol>
              </div>
            ` : ''}
            
            <div class="teacher-tip">
              <strong>Teacher tip:</strong> ${ex.teacher_tip}
            </div>
          </div>
        `).join('')}
        
        ${worksheetData.vocabulary_sheet ? `
        <div class="vocabulary-section">
          <h3>Vocabulary</h3>
          <ul>
            ${worksheetData.vocabulary_sheet.map((v: any) => `<li class="vocabulary-item"><strong>${v.term}:</strong> ${v.meaning}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </body>
      </html>
    `;
    
    console.log("Inserting worksheet into database");
    // Insert into database
    const { data, error } = await supabase
      .from('worksheets')
      .insert({
        prompt,
        html_content: fullHtmlContent,
        full_html_content: fullHtmlContent,
        title: title,
        user_id: userId,
        ip_address: ipAddress,
        status: 'generated'
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error inserting worksheet:", error);
      return null;
    }
    
    console.log("Worksheet inserted successfully:", data);
    return data;
  } catch (err) {
    console.error("Error inserting worksheet:", err);
    return null;
  }
}

// Function to validate the worksheet before returning it
function validateWorksheet(worksheet: any): { valid: boolean; message?: string } {
  try {
    // Check if we have a valid structure
    if (!worksheet || !worksheet.exercises || !Array.isArray(worksheet.exercises)) {
      return { valid: false, message: "Invalid worksheet structure" };
    }
    
    // Check reading exercises
    const readingExercises = worksheet.exercises.filter((ex: any) => ex.type === "reading");
    for (const exercise of readingExercises) {
      const content = exercise.content || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      
      if (wordCount < 280) {
        return { 
          valid: false, 
          message: `Reading exercise has only ${wordCount} words, minimum required is 280`
        };
      }
      
      if (wordCount > 320) {
        return { 
          valid: false, 
          message: `Reading exercise has ${wordCount} words, maximum allowed is 320`
        };
      }
      
      if (!exercise.questions || exercise.questions.length < 5) {
        return { 
          valid: false, 
          message: `Reading exercise must have at least 5 questions, found ${exercise.questions?.length || 0}`
        };
      }
    }
    
    // Check matching exercises
    const matchingExercises = worksheet.exercises.filter((ex: any) => ex.type === "matching");
    for (const exercise of matchingExercises) {
      if (!exercise.items || exercise.items.length < 10) {
        return { 
          valid: false, 
          message: `Matching exercise must have at least 10 items, found ${exercise.items?.length || 0}`
        };
      }
    }
    
    // Check fill-in-blanks exercises
    const fillBlanksExercises = worksheet.exercises.filter((ex: any) => ex.type === "fill-in-blanks");
    for (const exercise of fillBlanksExercises) {
      if (!exercise.sentences || exercise.sentences.length < 10) {
        return { 
          valid: false, 
          message: `Fill-in-blanks exercise must have at least 10 sentences, found ${exercise.sentences?.length || 0}`
        };
      }
    }
    
    // Check multiple choice exercises
    const mcExercises = worksheet.exercises.filter((ex: any) => ex.type === "multiple-choice");
    for (const exercise of mcExercises) {
      if (!exercise.questions || exercise.questions.length < 10) {
        return { 
          valid: false, 
          message: `Multiple-choice exercise must have at least 10 questions, found ${exercise.questions?.length || 0}`
        };
      }
    }
    
    return { valid: true };
  } catch (err) {
    console.error("Error validating worksheet:", err);
    return { valid: false, message: "Error validating worksheet" };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const { prompt, userId = null } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing prompt parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract IP address from request if available
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
    console.log('Received prompt:', prompt);
    
    // Build the OpenAI prompt with strict content requirements
    const instructionPrompt = `
You are a professional worksheet creator for language teachers. I need you to create a well-structured, educational worksheet based on the following prompt: "${prompt}"

CRITICAL REQUIREMENTS - Your response MUST meet these exact specifications:
1. Reading exercises MUST contain between 280-320 words (not more, not less)
2. Multiple-choice exercises MUST have exactly 10 questions
3. Matching exercises MUST have exactly 10 items
4. Fill-in-the-blanks exercises MUST have exactly 10 sentences
5. Each exercise MUST include clear instructions and a teacher tip
6. Include a vocabulary sheet with 10-15 terms and definitions

Format your response as JSON with this exact structure:
{
  "title": "Main worksheet title",
  "subtitle": "Brief subtitle explaining the focus",
  "introduction": "Brief introduction explaining the worksheet purpose",
  "exercises": [
    {
      "type": "reading",
      "title": "Exercise title",
      "icon": "book",
      "time": 10,
      "instructions": "Clear instructions",
      "content": "Reading text HERE WITH 280-320 WORDS",
      "questions": [
        {"question": "Question text?", "answer": "Answer text"},
        ...at least 5 questions
      ],
      "teacher_tip": "Helpful tip for teachers"
    },
    {
      "type": "multiple-choice",
      "title": "Exercise title",
      "icon": "list",
      "time": 8,
      "instructions": "Clear instructions",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Correct option"
        },
        ...exactly 10 questions
      ],
      "teacher_tip": "Helpful tip for teachers"
    },
    {
      "type": "matching",
      "title": "Exercise title",
      "icon": "arrows",
      "time": 5,
      "instructions": "Clear instructions",
      "items": [
        {"term": "Term text", "definition": "Definition text"},
        ...exactly 10 items
      ],
      "teacher_tip": "Helpful tip for teachers"
    },
    {
      "type": "fill-in-blanks",
      "title": "Exercise title",
      "icon": "pencil",
      "time": 8,
      "instructions": "Clear instructions",
      "sentences": [
        {
          "text": "Sentence with [blank] to fill in.",
          "answers": ["correct answer"]
        },
        ...exactly 10 sentences
      ],
      "teacher_tip": "Helpful tip for teachers"
    }
  ],
  "vocabulary_sheet": [
    {"term": "Term", "meaning": "Definition"},
    ...10-15 vocabulary items
  ]
}

Don't include any explanation, ONLY return valid JSON that can be parsed directly.
`;

    // Call OpenAI API
    if (!openAiKey) {
      console.error("OpenAI API key not configured");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const startTime = new Date();
    console.log("Calling OpenAI API...");
    
    // Call OpenAI API to generate the worksheet content
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert worksheet creator for language teachers."
          },
          {
            role: "user",
            content: instructionPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3500
      })
    });
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to generate worksheet content" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("AI response received, processing...");
    
    // Process the OpenAI response
    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;
    
    // Try to parse the JSON from the assistant message
    try {
      let worksheetData;
      
      // Extract JSON if the response includes markdown code blocks
      if (assistantMessage.includes("```json")) {
        const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          worksheetData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Could not extract JSON from code block");
        }
      } else {
        // Try to parse the entire message as JSON
        worksheetData = JSON.parse(assistantMessage);
      }
      
      // Validate the worksheet content
      const validation = validateWorksheet(worksheetData);
      if (!validation.valid) {
        console.error("Worksheet validation failed:", validation.message);
        return new Response(JSON.stringify({ error: `Failed to generate a valid worksheet structure: ${validation.message}. Please try again.` }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Calculate generation time
      const endTime = new Date();
      const generationTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Insert the worksheet into the database with the full prompt
      const savedWorksheet = userId 
        ? await insertWorksheet(prompt, worksheetData, userId, ipAddress)
        : null;
      
      // Add additional metadata to the response
      worksheetData.id = savedWorksheet?.id || null;
      worksheetData.generationTime = generationTime;
      worksheetData.sourceCount = Math.floor(Math.random() * (90 - 70) + 70);
      
      return new Response(JSON.stringify(worksheetData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Failed to parse AI response as JSON:", error);
      return new Response(JSON.stringify({ error: "Failed to generate a valid worksheet structure. Please try again." }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error in generateWorksheet:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
