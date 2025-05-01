
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS');
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    // Check for Supabase credentials
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { worksheetId, rating, comment, userId } = await req.json();
    
    console.log('Received feedback submission:', { worksheetId, rating, comment, userId });
    
    // Validate required fields
    if (!worksheetId || typeof rating !== 'number' || !userId) {
      console.error("Missing required fields:", { worksheetId, rating, userId });
      return new Response(JSON.stringify({ error: "Missing required fields: worksheetId, rating, or userId" }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Insert feedback into the database
    console.log('Inserting feedback into database...');
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        worksheet_id: worksheetId,
        user_id: userId,
        rating,
        comment: comment || null,
        status: 'submitted'
      })
      .select();
    
    if (error) {
      console.error("Error inserting feedback:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("Feedback submitted successfully:", data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in submitFeedback function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
