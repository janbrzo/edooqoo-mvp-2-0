
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'
import { RateLimiter } from './security.ts';
import { validatePaymentRequest } from './validation.ts';
import { createStripeSession } from './stripe-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { worksheetId, userId, successUrl, cancelUrl } = requestData;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

    console.log('Payment request received:', { 
      worksheetId: worksheetId?.substring(0, 8) + '...', 
      userId: userId?.substring(0, 8) + '...', 
      ip 
    });

    // Validate request
    const validation = validatePaymentRequest(requestData);
    if (!validation.isValid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting
    const rateLimitKey = `${ip}_${userId}`;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP/User: ${ip}/${userId.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe with corrected key name
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Initializing Stripe...');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create Stripe session
    const defaultSuccessUrl = successUrl || `${req.headers.get('origin') || 'https://localhost:3000'}/payment-success`;
    const defaultCancelUrl = cancelUrl || req.headers.get('origin') || 'https://localhost:3000';
    
    const session = await createStripeSession(
      stripe,
      worksheetId,
      userId,
      defaultSuccessUrl,
      defaultCancelUrl
    );

    console.log('Stripe session created successfully:', session.id);

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

    console.log('Payment record created successfully');

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
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'Failed to create checkout session' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
