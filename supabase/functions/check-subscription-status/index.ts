
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CHECK-SUBSCRIPTION] Function started');

    // Initialize Supabase with anon key for user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;

    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');

    console.log('[CHECK-SUBSCRIPTION] User:', user.email);

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) throw new Error('Stripe key not configured');

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Find customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      console.log('[CHECK-SUBSCRIPTION] No Stripe customer found');
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          subscription_type: 'Free Demo',
          message: 'No subscription found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = customers.data[0].id;
    console.log('[CHECK-SUBSCRIPTION] Found customer:', customerId);

    // Get ALL active subscriptions (not just first one)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 100, // Get all active subscriptions
    });

    console.log('[CHECK-SUBSCRIPTION] Found active subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      console.log('[CHECK-SUBSCRIPTION] No active subscriptions');
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          subscription_type: 'Free Demo',
          message: 'No active subscription found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If multiple active subscriptions, find the highest value one and cancel others
    let bestSubscription = subscriptions.data[0];
    let bestAmount = subscriptions.data[0].items.data[0].price.unit_amount || 0;

    if (subscriptions.data.length > 1) {
      console.log('[CHECK-SUBSCRIPTION] Multiple active subscriptions found, selecting highest and cleaning up');
      
      // Find the subscription with highest amount
      for (let i = 1; i < subscriptions.data.length; i++) {
        const currentAmount = subscriptions.data[i].items.data[0].price.unit_amount || 0;
        if (currentAmount > bestAmount) {
          bestSubscription = subscriptions.data[i];
          bestAmount = currentAmount;
        }
      }

      // Cancel all other subscriptions that are not the best one
      for (const subscription of subscriptions.data) {
        if (subscription.id !== bestSubscription.id) {
          console.log('[CHECK-SUBSCRIPTION] Canceling duplicate subscription:', subscription.id);
          await stripe.subscriptions.cancel(subscription.id);
        }
      }
    }

    const subscription = bestSubscription;
    console.log('[CHECK-SUBSCRIPTION] Using subscription:', subscription.id, 'with amount:', bestAmount);

    // IMPROVED PLAN RECOGNITION: Use metadata first, fallback to price
    let planType = 'unknown';
    let subscriptionType = 'Unknown Plan';
    let monthlyLimit = 0;

    // Check if subscription has metadata (new subscriptions will have this)
    if (subscription.metadata?.plan_type && subscription.metadata?.monthly_limit) {
      planType = subscription.metadata.plan_type;
      monthlyLimit = parseInt(subscription.metadata.monthly_limit);
      
      if (planType === 'side-gig') {
        subscriptionType = 'Side-Gig';
      } else if (planType === 'full-time') {
        subscriptionType = `Full-Time ${monthlyLimit}`;
      }
      
      console.log('[CHECK-SUBSCRIPTION] Using metadata for plan detection:', { planType, monthlyLimit, subscriptionType });
    } else {
      // Fallback to price detection for older subscriptions
      console.log('[CHECK-SUBSCRIPTION] No metadata found, using price fallback');
      const amount = bestAmount;
      
      // Enhanced price recognition including upgrade prices
      if (amount === 900) {
        planType = 'side-gig';
        subscriptionType = 'Side-Gig';
        monthlyLimit = 15;
      } else if (amount === 1000) { // $10 upgrade from side-gig to full-time 30
        planType = 'full-time';
        subscriptionType = 'Full-Time 30';
        monthlyLimit = 30;
      } else if (amount === 1900) {
        planType = 'full-time';
        subscriptionType = 'Full-Time 30';
        monthlyLimit = 30;
      } else if (amount === 2000) { // $20 upgrade from full-time 30 to 60
        planType = 'full-time';
        subscriptionType = 'Full-Time 60';
        monthlyLimit = 60;
      } else if (amount === 3000) { // $30 upgrade from side-gig to full-time 60
        planType = 'full-time';
        subscriptionType = 'Full-Time 60';
        monthlyLimit = 60;
      } else if (amount === 3900) {
        planType = 'full-time';
        subscriptionType = 'Full-Time 60';
        monthlyLimit = 60;
      } else if (amount === 5900) {
        planType = 'full-time';
        subscriptionType = 'Full-Time 90';
        monthlyLimit = 90;
      } else if (amount === 7900) {
        planType = 'full-time';
        subscriptionType = 'Full-Time 120';
        monthlyLimit = 120;
      } else {
        // For unknown amounts, try to get info from product/price
        try {
          const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
          if (price.metadata?.plan_type && price.metadata?.monthly_limit) {
            planType = price.metadata.plan_type;
            monthlyLimit = parseInt(price.metadata.monthly_limit);
            subscriptionType = planType === 'side-gig' ? 'Side-Gig' : `Full-Time ${monthlyLimit}`;
          }
        } catch (e) {
          console.log('[CHECK-SUBSCRIPTION] Could not retrieve price metadata:', e.message);
        }
      }
    }

    console.log('[CHECK-SUBSCRIPTION] Determined plan:', { planType, subscriptionType, monthlyLimit, amount: bestAmount });

    // Use service role key to update data
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get current profile to check for token upgrade
    const { data: currentProfile, error: profileFetchError } = await supabaseService
      .from('profiles')
      .select('subscription_type, token_balance, monthly_worksheet_limit')
      .eq('id', user.id)
      .single();

    if (profileFetchError) {
      console.error('[CHECK-SUBSCRIPTION] Error fetching current profile:', profileFetchError);
    }

    // Check if this is an upgrade and we need to add tokens
    let shouldAddTokens = false;
    let tokensToAdd = 0;

    if (currentProfile && subscriptionType !== 'Unknown Plan') {
      const currentType = currentProfile.subscription_type;
      const currentLimit = currentProfile.monthly_worksheet_limit || 0;
      
      // Check if this is an upgrade (higher monthly limit)
      if (monthlyLimit > currentLimit && currentType !== subscriptionType) {
        // Calculate tokens to add (difference in monthly limits)
        tokensToAdd = monthlyLimit - currentLimit;
        shouldAddTokens = true;
        console.log('[CHECK-SUBSCRIPTION] Upgrade detected, adding tokens:', { tokensToAdd, from: currentType, to: subscriptionType });
      }
    }

    // Update subscription record
    const { error: subError } = await supabaseService
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        plan_type: planType,
        monthly_limit: monthlyLimit,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      });

    if (subError) {
      console.error('[CHECK-SUBSCRIPTION] Error updating subscription:', subError);
    }

    // Update profile with token addition if needed
    const profileUpdate: any = {
      subscription_type: subscriptionType,
      subscription_status: subscription.status,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      monthly_worksheet_limit: monthlyLimit,
      updated_at: new Date().toISOString()
    };

    // Add tokens if this is an upgrade
    if (shouldAddTokens && tokensToAdd > 0) {
      profileUpdate.token_balance = (currentProfile.token_balance || 0) + tokensToAdd;
      console.log('[CHECK-SUBSCRIPTION] Adding tokens to profile:', { current: currentProfile.token_balance, adding: tokensToAdd, new: profileUpdate.token_balance });
    }

    const { error: profileError } = await supabaseService
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (profileError) {
      console.error('[CHECK-SUBSCRIPTION] Error updating profile:', profileError);
    }

    // Log token transaction if tokens were added
    if (shouldAddTokens && tokensToAdd > 0) {
      const { error: tokenError } = await supabaseService
        .from('token_transactions')
        .insert({
          teacher_id: user.id,
          transaction_type: 'upgrade',
          amount: tokensToAdd,
          description: `Subscription upgrade to ${subscriptionType}`
        });

      if (tokenError) {
        console.error('[CHECK-SUBSCRIPTION] Error logging token transaction:', tokenError);
      }
    }

    console.log('[CHECK-SUBSCRIPTION] Successfully synced subscription data');

    return new Response(
      JSON.stringify({
        subscribed: true,
        subscription_type: subscriptionType,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_limit: monthlyLimit,
        tokens_added: shouldAddTokens ? tokensToAdd : 0,
        message: 'Subscription status synchronized'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CHECK-SUBSCRIPTION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
