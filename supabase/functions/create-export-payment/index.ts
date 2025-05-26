
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worksheetId, exportType, amount } = await req.json();
    
    if (!worksheetId || !exportType || !amount) {
      throw new Error('Missing required parameters');
    }

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    console.log('Creating Stripe checkout session for worksheet:', worksheetId);

    // Create or get the "free" coupon
    let freeCoupon;
    try {
      freeCoupon = await stripe.coupons.retrieve('free');
    } catch (error) {
      // Create the coupon if it doesn't exist
      freeCoupon = await stripe.coupons.create({
        id: 'free',
        name: 'Free Testing Coupon',
        percent_off: 100,
        duration: 'forever',
      });
      console.log('Created free coupon:', freeCoupon.id);
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Worksheet ${exportType.toUpperCase()} Download`,
              description: `Download access for worksheet in ${exportType.toUpperCase()} format`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}&worksheet_id=${worksheetId}`,
      cancel_url: `${req.headers.get('origin')}/`,
      metadata: {
        worksheetId,
        exportType,
      },
      // Enable discount codes
      allow_promotion_codes: true,
      // Optionally add the free coupon directly
      discounts: [],
    });

    console.log('Stripe session created:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment session'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
