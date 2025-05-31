
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
    const { worksheetId, userId, successUrl, cancelUrl } = await req.json();

    if (!worksheetId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
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

    console.log('Creating Stripe checkout session for worksheet:', worksheetId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      allow_promotion_codes: true, // Enable discount codes
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Worksheet Export Access',
              description: 'One-time payment for downloading HTML and PDF versions of your worksheet',
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        worksheetId,
        userId,
      },
    });

    console.log('Stripe session created:', session.id);

    // Store payment record in database using user_identifier column
    const { data: paymentData, error: paymentError } = await supabase
      .from('export_payments')
      .insert({
        worksheet_id: worksheetId,
        stripe_session_id: session.id,
        user_identifier: userId, // Store as text identifier in the correct column
        status: 'pending',
        amount: 100,
        currency: 'usd',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to store payment information' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Payment record created:', paymentData.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        paymentId: paymentData?.id || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
