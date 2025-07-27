
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

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

    const body = await req.json();
    const { planType, monthlyLimit, price, planName, isUpgrade, additionalTokens } = body;

    logStep('Request body parsed', { planType, monthlyLimit, price, planName, isUpgrade, additionalTokens });

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

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

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://cdoyjgiyrfziejbrcvpx.supabase.co';
    logStep('Origin determined', { origin });

    let sessionConfig: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: `${monthlyLimit} worksheets per month${isUpgrade ? ' (Upgrade)' : ''}`,
            },
            unit_amount: price * 100,
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
        is_upgrade: isUpgrade?.toString() || 'false',
        additional_tokens: additionalTokens?.toString() || '0',
      },
    };

    // If it's an upgrade, handle existing subscription
    if (isUpgrade && additionalTokens > 0) {
      // Add tokens immediately upon successful payment
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Add additional tokens to user's balance
      await supabaseService
        .from('profiles')
        .update({
          token_balance: supabaseService.sql`token_balance + ${additionalTokens}`,
          monthly_worksheet_limit: monthlyLimit
        })
        .eq('id', user.id);

      // Log the upgrade transaction
      await supabaseService
        .from('token_transactions')
        .insert({
          teacher_id: user.id,
          transaction_type: 'upgrade',
          amount: additionalTokens,
          description: `Plan upgrade: ${additionalTokens} additional tokens added`
        });

      logStep('Upgrade tokens added', { userId: user.id, additionalTokens });
    }

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
