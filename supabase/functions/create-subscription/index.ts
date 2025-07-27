
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    // Initialize Supabase with anon key for user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep('User error', userError);
      throw userError;
    }

    const user = userData.user;
    if (!user?.email) {
      logStep('User not authenticated');
      throw new Error('User not authenticated');
    }

    logStep('User authenticated', { email: user.email });

    // Parse request body
    const body = await req.json();
    const { planType, monthlyLimit, price, planName, couponCode } = body;

    logStep('Request body parsed', { planType, monthlyLimit, price, planName, couponCode });

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Find or create customer
    let customer;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep('Found existing customer', { customerId: customer.id });
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      logStep('Created new customer', { customerId: customer.id });
    }

    // Get the correct origin for redirect URLs
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://cdoyjgiyrfziejbrcvpx.supabase.co';
    logStep('Origin determined', { origin });

    // Create checkout session configuration
    const sessionConfig: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: `${monthlyLimit} worksheets per month`,
            },
            unit_amount: price * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        monthly_limit: monthlyLimit.toString(),
      },
    };

    // Handle coupon code if provided
    if (couponCode) {
      logStep('Processing coupon code', { couponCode });
      
      try {
        // Check if coupon exists and is valid
        const coupon = await stripe.coupons.retrieve(couponCode);
        logStep('Coupon found', { couponId: coupon.id, percentOff: coupon.percent_off, amountOff: coupon.amount_off });
        
        // Apply coupon to checkout session
        sessionConfig.discounts = [{
          coupon: couponCode
        }];
        
        logStep('Coupon applied to session');
      } catch (couponError) {
        logStep('Coupon error', { error: couponError.message });
        // Don't throw error, just proceed without coupon
        logStep('Proceeding without coupon');
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep('Checkout session created', { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    logStep('Error occurred', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
