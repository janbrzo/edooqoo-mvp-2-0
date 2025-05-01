
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    if (!supabaseUrl || !supabaseServiceRole) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Get the request body
    const { worksheetId, rating, comment, userId } = await req.json();
    
    if (!worksheetId || !rating || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Submitting feedback for worksheet ${worksheetId} from user ${userId}: rating=${rating}, comment=${comment}`);
    
    // Insert the feedback into the database
    const { data, error } = await supabase.from('feedbacks').insert({
      worksheet_id: worksheetId,
      user_id: userId,
      rating,
      comment,
      status: 'submitted'
    }).select();
    
    if (error) {
      console.error('Error inserting feedback:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit feedback' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
