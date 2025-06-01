
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Security utilities
function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 3, windowMs: number = 300000): boolean { // 3 requests per 5 minutes
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worksheetId, userId, successUrl, cancelUrl } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

    // Input validation
    if (!worksheetId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: worksheetId and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate UUID formats
    if (!isValidUUID(worksheetId) || !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ID format provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URLs if provided
    if (successUrl && !isValidURL(successUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid success URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (cancelUrl && !isValidURL(cancelUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid cancel URL provided' }),
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

    console.log('Creating Stripe checkout session for worksheet:', worksheetId.substring(0, 8) + '...');

    // Create Stripe checkout session with coupon support
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      allow_promotion_codes: true, // Enable discount codes including 1CENT
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
      success_url: successUrl ? `${successUrl}?session_id={CHECKOUT_SESSION_ID}` : `${req.headers.get('origin') || 'https://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || req.headers.get('origin') || 'https://localhost:3000',
      metadata: {
        worksheetId,
        userId,
      },
      // Enable customer email collection in Stripe
      customer_creation: 'always',
      billing_address_collection: 'auto',
    });

    console.log('Stripe session created successfully');

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
