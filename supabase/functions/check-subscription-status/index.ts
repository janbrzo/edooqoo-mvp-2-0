
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

    // Use service role to get existing subscription record
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get stored subscription record to find stripe_subscription_id
    const { data: storedSubscription } = await supabaseService
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('teacher_id', user.id)
      .single();

    let subscription = null;

    // PRIORITY 1: Try to fetch the stored subscription by ID
    if (storedSubscription?.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(storedSubscription.stripe_subscription_id);
        console.log('[CHECK-SUBSCRIPTION] Found stored subscription:', subscription.id);
      } catch (error) {
        console.log('[CHECK-SUBSCRIPTION] Stored subscription not found in Stripe, searching all');
      }
    }

    // PRIORITY 2: If stored subscription not found, get all active subscriptions and pick the best one
    if (!subscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });

      if (subscriptions.data.length === 0) {
        console.log('[CHECK-SUBSCRIPTION] No active subscriptions');
        
        await supabaseService
          .from('profiles')
          .update({
            subscription_type: 'Free Demo',
            subscription_status: 'cancelled',
            is_tokens_frozen: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        return new Response(
          JSON.stringify({ 
            subscribed: false, 
            subscription_type: 'Free Demo',
            message: 'No active subscription found' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Priority: cancel_at_period_end = true first, then latest current_period_end
      const cancelledSubs = subscriptions.data.filter(sub => sub.cancel_at_period_end);
      if (cancelledSubs.length > 0) {
        subscription = cancelledSubs.sort((a, b) => b.current_period_end - a.current_period_end)[0];
      } else {
        subscription = subscriptions.data.sort((a, b) => b.current_period_end - a.current_period_end)[0];
      }
    }

    console.log('[CHECK-SUBSCRIPTION] Using subscription:', subscription.id, 'cancel_at_period_end:', subscription.cancel_at_period_end);

    // Get subscription details
    const amount = subscription.items.data[0].price.unit_amount || 0;
    
    let planType = 'unknown';
    let subscriptionType = 'Unknown Plan';
    let monthlyLimit = 0;

    if (amount === 900) {
      planType = 'side-gig';
      subscriptionType = 'Side-Gig';
      monthlyLimit = 15;
    } else if (amount >= 1900) {
      planType = 'full-time';
      if (amount === 1900) {
        monthlyLimit = 30;
        subscriptionType = 'Full-Time 30';
      } else if (amount === 3900) {
        monthlyLimit = 60;
        subscriptionType = 'Full-Time 60';
      } else if (amount === 5900) {
        monthlyLimit = 90;
        subscriptionType = 'Full-Time 90';
      } else if (amount === 7900) {
        monthlyLimit = 120;
        subscriptionType = 'Full-Time 120';
      } else {
        monthlyLimit = 30;
        subscriptionType = 'Full-Time 30';
      }
    }

    // FIXED: Determine normalized subscription status (active vs active_cancelled)
    let newSubscriptionStatus: string;
    if (subscription.status === 'active') {
      newSubscriptionStatus = subscription.cancel_at_period_end ? 'active_cancelled' : 'active';
    } else {
      newSubscriptionStatus = subscription.status;
    }
    console.log('[CHECK-SUBSCRIPTION] Computed status:', { 
      stripeStatus: subscription.status, 
      cancelAtPeriodEnd: subscription.cancel_at_period_end, 
      newSubscriptionStatus 
    });

    // FIXED: Update subscription record with correct status in BOTH tables
    const { error: subError } = await supabaseService
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        email: user.email,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        subscription_status: newSubscriptionStatus, // FIXED: correctly sets active_cancelled
        subscription_type: planType,               
        monthly_limit: monthlyLimit,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'teacher_id',
        ignoreDuplicates: false 
      });

    if (subError) {
      console.error('[CHECK-SUBSCRIPTION] Error updating subscription:', subError);
    } else {
      console.log('[CHECK-SUBSCRIPTION] Subscriptions table updated with status:', newSubscriptionStatus);
    }

    // Update profile - synchronize subscription data and unfreeze tokens
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        subscription_status: newSubscriptionStatus, 
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_worksheet_limit: monthlyLimit,
        is_tokens_frozen: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[CHECK-SUBSCRIPTION] Error updating profile:', profileError);
    }

    console.log('[CHECK-SUBSCRIPTION] Successfully synced subscription data');

    return new Response(
      JSON.stringify({
        subscribed: true,
        subscription_type: subscriptionType,
        subscription_status: newSubscriptionStatus,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_limit: monthlyLimit,
        message: 'Subscription status synchronized'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
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
