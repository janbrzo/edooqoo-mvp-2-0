
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-EXPORT-PAYMENT] ${step}${detailsStr}`);
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

    const { sessionId } = await req.json();
    logStep('Request body parsed', { sessionId });

    if (!sessionId) {
      throw new Error("Missing required parameter: sessionId");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep('Stripe instance created');

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep('Session retrieved', { 
      status: session.payment_status, 
      worksheetId: session.metadata?.worksheetId 
    });

    if (session.payment_status === 'paid') {
      logStep('Payment confirmed as paid');
      
      return new Response(
        JSON.stringify({ 
          status: 'paid',
          worksheetId: session.metadata?.worksheetId,
          exportType: session.metadata?.exportType,
          amount: session.amount_total,
          sessionId: sessionId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      logStep('Payment not completed', { status: session.payment_status });
      
      return new Response(
        JSON.stringify({ 
          status: session.payment_status,
          worksheetId: session.metadata?.worksheetId 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in verify-export-payment', { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
