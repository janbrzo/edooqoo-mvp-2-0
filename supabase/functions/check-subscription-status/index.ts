
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      throw new Error('User not authenticated');
    }

    const user = userData.user;
    logStep('User', user.email);

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      logStep('No customer found for user');
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const customer = customers.data[0];
    logStep('Found customer', customer.id);

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: storedSub } = await supabaseService
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('teacher_id', user.id)
      .single();

    let subscriptionId = storedSub?.stripe_subscription_id;

    if (!subscriptionId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        logStep('No subscriptions found for customer');
        return new Response(JSON.stringify({ subscribed: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      subscriptionId = subscriptions.data[0].id;
    }

    logStep('Found stored subscription', subscriptionId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep('Using subscription', `${subscriptionId} cancel_at_period_end: ${subscription.cancel_at_period_end}`);

    // NAPRAWIONE: Compute status correctly
    const stripeStatus = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    let newSubscriptionStatus = stripeStatus;
    if (stripeStatus === 'active' && cancelAtPeriodEnd) {
      newSubscriptionStatus = 'active_cancelled';
    }

    logStep('Computed status', {
      stripeStatus,
      cancelAtPeriodEnd,
      newSubscriptionStatus
    });

    // Determine plan details
    let subscriptionType = 'Unknown';
    let monthlyLimit = 0;
    const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;

    if (priceAmount === 900) {
      subscriptionType = 'Side-Gig';
      monthlyLimit = 15;
    } else if (priceAmount === 1900) {
      subscriptionType = 'Full-Time 30';
      monthlyLimit = 30;
    } else if (priceAmount === 3900) {
      subscriptionType = 'Full-Time 60';
      monthlyLimit = 60;
    } else if (priceAmount === 5900) {
      subscriptionType = 'Full-Time 90';
      monthlyLimit = 90;
    } else if (priceAmount === 7900) {
      subscriptionType = 'Full-Time 120';
      monthlyLimit = 120;
    }

    // NAPRAWIONE: Poprawiona logika is_tokens_frozen
    // active_cancelled powinno mieć is_tokens_frozen = FALSE
    // Tylko canceled i inne nieaktywne statusy powinny mieć TRUE
    const shouldFreezeTokens = !['active', 'active_cancelled'].includes(newSubscriptionStatus);

    logStep('Token freeze decision', {
      newSubscriptionStatus,
      shouldFreezeTokens
    });

    // Update profile
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        subscription_status: newSubscriptionStatus,
        monthly_worksheet_limit: monthlyLimit,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        is_tokens_frozen: shouldFreezeTokens, // NAPRAWIONE: Poprawna logika
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      logStep('ERROR: Failed to update profile', profileError);
      throw profileError;
    }

    // Update subscriptions table
    const { error: subError } = await supabaseService
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        email: user.email,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customer.id,
        subscription_status: newSubscriptionStatus,
        subscription_type: subscriptionType,
        monthly_limit: monthlyLimit,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'teacher_id',
        ignoreDuplicates: false 
      });

    if (subError) {
      logStep('ERROR: Failed to update subscriptions table', subError);
    } else {
      logStep('Subscriptions table updated with status', `${newSubscriptionStatus} and type: ${subscriptionType}`);
    }

    logStep('Successfully synced subscription data', {
      tokensFrozen: shouldFreezeTokens,
      subscriptionStatus: newSubscriptionStatus
    });

    return new Response(JSON.stringify({
      subscribed: newSubscriptionStatus === 'active' || newSubscriptionStatus === 'active_cancelled',
      subscription_type: subscriptionType,
      subscription_status: newSubscriptionStatus,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logStep('ERROR', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      subscribed: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
