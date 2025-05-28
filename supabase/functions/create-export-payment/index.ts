
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exportType, worksheetTitle, allowPromotionCodes = true } = await req.json();
    
    console.log('Creating export payment for:', { exportType, worksheetTitle });

    const stripeKey = Deno.env.get("Stripe_Secret_Key");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${exportType.toUpperCase()} Export - ${worksheetTitle}`,
              description: `Export your worksheet "${worksheetTitle}" as a professional ${exportType.toUpperCase()} file`,
            },
            unit_amount: 299, // $2.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: allowPromotionCodes,
      success_url: `${req.headers.get("origin")}/export-success?session_id={CHECKOUT_SESSION_ID}&export_type=${exportType}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        export_type: exportType,
        worksheet_title: worksheetTitle,
      },
    });

    console.log('Stripe session created:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
