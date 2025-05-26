
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EXPORT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const stripeKey = Deno.env.get("Stripe_Secret_Key");
    if (!stripeKey) {
      throw new Error("Stripe_Secret_Key is not configured");
    }
    logStep('Stripe key verified');

    const { worksheetId, exportType, amount } = await req.json();
    logStep('Request body parsed', { worksheetId, exportType, amount });

    if (!worksheetId || !exportType || !amount) {
      throw new Error("Missing required parameters: worksheetId, exportType, amount");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep('Stripe instance created');

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    logStep('Origin determined', { origin });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Worksheet ${exportType.toUpperCase()} Download`,
              description: `Download access for worksheet in ${exportType.toUpperCase()} format`,
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&worksheet_id=${worksheetId}`,
      cancel_url: `${origin}/`,
      metadata: {
        worksheetId: worksheetId,
        exportType: exportType,
      },
    });

    logStep('Checkout session created', { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-export-payment', { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
