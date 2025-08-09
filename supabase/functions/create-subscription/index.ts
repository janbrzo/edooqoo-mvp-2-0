
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

// NAPRAWIONE: Mapowanie price_ID na plany
const PLAN_PRICE_IDS = {
  'side-gig': 'price_1Rr4ajH4Sb5mBNfbqE8tB3Il',
  'full-time-30': 'price_1Rr4apH4Sb5mBNfbZCKfQyov',
  'full-time-60': 'price_1RuA1gH4Sb5mBNfbCdkhQkhn',
  'full-time-90': 'price_1Rr4asH4Sb5mBNfbtF4eGtWF',
  'full-time-120': 'price_1Ru9x2H4Sb5mBNfbbVRTDR9V'
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
    const { planType, monthlyLimit, price, planName, upgradeTokens, isUpgrade } = body;

    logStep('Request body parsed', { planType, monthlyLimit, price, planName, upgradeTokens, isUpgrade });

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

    const existingStripeSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://cdoyjgiyrfziejbrcvpx.supabase.co';
    logStep('Origin determined', { origin });

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: supabaseSubscription, error: subError } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('email', user.email)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      logStep('Error checking Supabase subscription', subError);
      throw subError;
    }

    logStep('Supabase subscription check', { 
      found: !!supabaseSubscription, 
      subscriptionId: supabaseSubscription?.stripe_subscription_id 
    });

    if (existingStripeSubscriptions.data.length > 0 && isUpgrade) {
      // NAPRAWIONE: Bezpośredni upgrade przez Stripe API
      const existingSubscription = existingStripeSubscriptions.data[0];
      logStep('Upgrading existing subscription', { 
        subscriptionId: existingSubscription.id,
        supabaseRecordExists: !!supabaseSubscription
      });

      try {
        // Określ target price_id na podstawie planu
        let targetPriceId: string;
        
        if (planType === 'side-gig') {
          targetPriceId = PLAN_PRICE_IDS['side-gig'];
        } else if (planType === 'full-time') {
          if (monthlyLimit === 30) {
            targetPriceId = PLAN_PRICE_IDS['full-time-30'];
          } else if (monthlyLimit === 60) {
            targetPriceId = PLAN_PRICE_IDS['full-time-60'];
          } else if (monthlyLimit === 90) {
            targetPriceId = PLAN_PRICE_IDS['full-time-90'];
          } else if (monthlyLimit === 120) {
            targetPriceId = PLAN_PRICE_IDS['full-time-120'];
          } else {
            throw new Error(`Unsupported monthly limit: ${monthlyLimit}`);
          }
        } else {
          throw new Error(`Unsupported plan type: ${planType}`);
        }

        logStep('Determined target price ID', { targetPriceId, planType, monthlyLimit });

        // NAPRAWIONE: Bezpośredni upgrade subskrypcji
        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
          items: [{
            id: existingSubscription.items.data[0].id,
            price: targetPriceId,
          }],
          proration_behavior: 'always_invoice',
          metadata: {
            supabase_user_id: user.id,
            plan_type: planType,
            monthly_limit: monthlyLimit.toString(),
            is_upgrade: 'true',
            upgrade_tokens: upgradeTokens ? upgradeTokens.toString() : '0',
          },
        });

        logStep('Subscription upgraded successfully', { 
          subscriptionId: updatedSubscription.id,
          newPriceId: targetPriceId
        });

        // Update Supabase subscription record if exists
        if (supabaseSubscription) {
          const { error: updateError } = await supabaseService
            .from('subscriptions')
            .update({
              subscription_type: planType === 'side-gig' ? 'side-gig' : `full-time-${monthlyLimit}`,
              monthly_limit: monthlyLimit,
              updated_at: new Date().toISOString()
            })
            .eq('teacher_id', supabaseSubscription.teacher_id);

          if (updateError) {
            logStep('Warning: Failed to update Supabase subscription record', updateError);
          } else {
            logStep('Supabase subscription record updated');
          }
        }

        return new Response(
          JSON.stringify({ success: true, subscription_id: updatedSubscription.id }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (stripeError: any) {
        logStep('Stripe upgrade error', { 
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param
        });

        // Fallback do Customer Portal jeśli bezpośredni upgrade się nie uda
        if (stripeError.message?.includes('inactive') || stripeError.message?.includes('no new subscriptions') || stripeError.code === 'resource_missing') {
          logStep('Direct upgrade failed - redirecting to customer portal for upgrade');
          
          try {
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: customer.id,
              return_url: `${origin}/profile`,
            });

            return new Response(
              JSON.stringify({ redirect_to_portal: true, url: portalSession.url }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          } catch (portalError: any) {
            logStep('Failed to create customer portal session', portalError);
            throw new Error('Unable to process upgrade. Please contact support.');
          }
        }

        throw stripeError;
      }

    } else {
      // Create new checkout session
      let targetPriceId: string;
      
      if (planType === 'side-gig') {
        targetPriceId = PLAN_PRICE_IDS['side-gig'];
      } else if (planType === 'full-time') {
        if (monthlyLimit === 30) {
          targetPriceId = PLAN_PRICE_IDS['full-time-30'];
        } else if (monthlyLimit === 60) {
          targetPriceId = PLAN_PRICE_IDS['full-time-60'];
        } else if (monthlyLimit === 90) {
          targetPriceId = PLAN_PRICE_IDS['full-time-90'];
        } else if (monthlyLimit === 120) {
          targetPriceId = PLAN_PRICE_IDS['full-time-120'];
        } else {
          throw new Error(`Unsupported monthly limit: ${monthlyLimit}`);
        }
      } else {
        throw new Error(`Unsupported plan type: ${planType}`);
      }

      const sessionConfig: any = {
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: targetPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        allow_promotion_codes: true,
        metadata: {
          supabase_user_id: user.id,
          plan_type: planType,
          monthly_limit: monthlyLimit.toString(),
          is_upgrade: isUpgrade ? 'true' : 'false',
          upgrade_tokens: upgradeTokens ? upgradeTokens.toString() : '0',
        },
      };

      logStep('Checkout session configuration created', { targetPriceId });

      const session = await stripe.checkout.sessions.create(sessionConfig);

      logStep('Checkout session created', { sessionId: session.id, url: session.url });

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: any) {
    logStep('Error occurred', { 
      message: error.message, 
      stack: error.stack,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
