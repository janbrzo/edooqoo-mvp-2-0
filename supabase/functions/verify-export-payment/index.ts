
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeSecretKey) {
      console.error('Missing Stripe_Secret_Key');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Verifying payment session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Session status:', session.payment_status);

    // Update payment status in database
    const { data: paymentData, error: updateError } = await supabase
      .from('export_payments')
      .update({
        status: session.payment_status === 'paid' ? 'paid' : 'failed',
        stripe_payment_intent_id: session.payment_intent as string,
        user_email: session.customer_details?.email,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (session.payment_status === 'paid') {
      // Generate download session token
      const sessionToken = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: downloadSession, error: sessionError } = await supabase
        .from('download_sessions')
        .insert({
          payment_id: paymentData.id,
          worksheet_id: paymentData.worksheet_id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating download session:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create download session' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Download session created:', downloadSession.id);

      return new Response(
        JSON.stringify({ 
          status: 'paid',
          sessionToken: sessionToken,
          worksheetId: paymentData.worksheet_id,
          expiresAt: downloadSession.expires_at
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: session.payment_status,
        worksheetId: paymentData.worksheet_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify payment' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
