
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function for detailed logging
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { planType, monthlyLimit, price, planName, discountCode } = await req.json();
    logStep("Request data received", { planType, monthlyLimit, price, planName, discountCode });

    // Validate input data
    if (!planType || !monthlyLimit || !price || !planName) {
      logStep("ERROR: Missing required fields", { planType, monthlyLimit, price, planName });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planType, monthlyLimit, price, or planName' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check Stripe configuration
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep("ERROR: Stripe secret key not configured");
      return new Response(
        JSON.stringify({ error: 'Payment service not configured. Please contact support.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    logStep("Stripe key verified");

    // Initialize Supabase with anon key for user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in to subscribe.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    logStep("Authenticating user");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: User authentication failed", { error: userError.message });
      return new Response(
        JSON.stringify({ error: 'Authentication failed. Please sign in again.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = userData.user;
    if (!user) {
      logStep("ERROR: No user found");
      return new Response(
        JSON.stringify({ error: 'User not found. Please sign in again.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!user.email) {
      logStep("ERROR: User has no email", { userId: user.id });
      return new Response(
        JSON.stringify({ 
          error: 'Email required for subscription. Please complete your registration with a valid email address.',
          requiresRegistration: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    logStep("Stripe initialized");

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      logStep("Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Create checkout session for subscription
    const origin = req.headers.get('origin') || 'https://localhost:3000';
    logStep("Creating checkout session", { origin, customerId });

    // Prepare checkout session configuration
    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
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
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        monthly_limit: monthlyLimit.toString(),
        price: price.toString()
      },
      // Enable discount codes in Stripe Checkout
      allow_promotion_codes: true,
    };

    // If a specific discount code is provided, validate and apply it
    if (discountCode) {
      try {
        // Find the promotion code in Stripe
        const promoCodes = await stripe.promotionCodes.list({
          code: discountCode,
          active: true,
          limit: 1,
        });

        if (promoCodes.data.length > 0) {
          const promoCode = promoCodes.data[0];
          sessionConfig.discounts = [{ promotion_code: promoCode.id }];
          logStep("Discount code applied", { discountCode, promoCodeId: promoCode.id });
        } else {
          logStep("WARNING: Invalid discount code provided", { discountCode });
          // Don't fail the request, just log the warning
        }
      } catch (discountError) {
        logStep("ERROR: Failed to apply discount code", { discountCode, error: discountError });
        // Don't fail the request, continue without discount
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created successfully", { 
      sessionId: session.id, 
      url: session.url?.substring(0, 50) + '...',
      discountApplied: !!discountCode 
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logStep("ERROR: Exception caught", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create subscription. Please try again or contact support.',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
