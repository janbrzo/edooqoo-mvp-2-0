
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (timestamp: string, step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${timestamp} ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const timestamp = new Date().toISOString();
  
  try {
    logStep(timestamp, 'Webhook received');

    const stripe = new Stripe(Deno.env.get('Stripe_Secret_Key') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !endpointSecret) {
      throw new Error('Missing signature or webhook secret');
    }

    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    logStep(timestamp, 'Event verified successfully', { type: event.type, id: event.id });

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' || 
        event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      logStep(timestamp, 'Processing subscription event', {
        subscriptionId: subscription.id,
        customerId: customerId,
        status: subscription.status,
        eventType: event.type,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

      // Get customer details
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      if (!customer.email) {
        throw new Error('Customer email not found');
      }

      logStep(timestamp, 'Customer found', { email: customer.email, customerId });

      // Find user profile
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, available_tokens, total_tokens_received, subscription_status')
        .eq('email', customer.email)
        .single();

      if (profileError || !profile) {
        throw new Error(`Profile not found for email: ${customer.email}`);
      }

      logStep(timestamp, 'Profile found', {
        userId: profile.id,
        currentTokens: profile.available_tokens,
        currentTotalReceived: profile.total_tokens_received,
        currentSubscriptionStatus: profile.subscription_status
      });

      // Determine plan from subscription price
      let subscriptionType = 'Unknown';
      let monthlyLimit = 0;
      let tokensToAdd = 0;
      const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;

      if (priceAmount === 900) { // $9.00
        subscriptionType = 'Side-Gig';
        monthlyLimit = 15;
        tokensToAdd = 15;
      } else if (priceAmount === 1900) { // $19.00
        subscriptionType = 'Full-Time 30';
        monthlyLimit = 30;
        tokensToAdd = 30;
      } else if (priceAmount === 3900) { // $39.00
        subscriptionType = 'Full-Time 60';
        monthlyLimit = 60;
        tokensToAdd = 60;
      } else if (priceAmount === 5900) { // $59.00
        subscriptionType = 'Full-Time 90';
        monthlyLimit = 90;
        tokensToAdd = 90;
      } else if (priceAmount === 7900) { // $79.00
        subscriptionType = 'Full-Time 120';
        monthlyLimit = 120;
        tokensToAdd = 120;
      }

      logStep(timestamp, 'Plan determined', {
        subscriptionType,
        monthlyLimit,
        tokensToAdd,
        priceAmount
      });

      // KLUCZOWA ZMIANA: Sprawdź czy finalize-upgrade już przetworzyło upgrade
      let shouldAddTokens = false;
      let finalTokensToAdd = 0;

      // Check if this is an upgrade that was already processed by finalize-upgrade
      const { data: processedSession } = await supabaseService
        .from('processed_upgrade_sessions')
        .select('*')
        .eq('teacher_id', profile.id)
        .eq('new_plan_type', subscriptionType)
        .order('processed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (processedSession) {
        logStep(timestamp, 'Upgrade already processed by finalize-upgrade', {
          sessionId: processedSession.session_id,
          tokensAdded: processedSession.tokens_added,
          processedAt: processedSession.processed_at
        });
        // Nie dodawaj tokenów - już zostały dodane przez finalize-upgrade
        shouldAddTokens = false;
        finalTokensToAdd = 0;
      } else {
        // Determine if tokens should be added based on subscription lifecycle
        const wasInactive = ['incomplete', 'past_due', 'canceled', 'unpaid'].includes(profile.subscription_status || '');
        const isNowActive = subscription.status === 'active';
        
        if (event.type === 'customer.subscription.created') {
          shouldAddTokens = true;
          finalTokensToAdd = tokensToAdd;
          logStep(timestamp, 'New subscription - tokens will be added', { tokensToAdd });
        } else if (wasInactive && isNowActive && !subscription.cancel_at_period_end) {
          shouldAddTokens = true;
          finalTokensToAdd = tokensToAdd;
          logStep(timestamp, 'Subscription reactivated - tokens will be added', { tokensToAdd });
        } else {
          shouldAddTokens = false;
          finalTokensToAdd = 0;
          logStep(timestamp, 'Not adding tokens - subscription update without reactivation', {
            wasInactive,
            isNowActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
        }
      }

      // NAPRAWIONE: Determine correct subscription status
      let newSubscriptionStatus = subscription.status;
      if (subscription.status === 'active' && subscription.cancel_at_period_end) {
        newSubscriptionStatus = 'active_cancelled';
        logStep(timestamp, 'Subscription is active but set to cancel at period end');
      }

      if (subscription.status === 'active' && subscription.cancel_at_period_end && 
          profile.subscription_status === 'active') {
        logStep(timestamp, 'Detected cancellation - subscription was active, now cancelled', {
          oldPlanType: profile.subscription_status
        });
      }

      logStep(timestamp, finalTokensToAdd > 0 ? `${finalTokensToAdd} tokens will be added` : 'No tokens will be added');

      // Calculate new token amounts
      const newAvailableTokens = shouldAddTokens 
        ? profile.available_tokens + finalTokensToAdd 
        : profile.available_tokens;
      const newTotalReceived = shouldAddTokens 
        ? (profile.total_tokens_received || 0) + finalTokensToAdd 
        : (profile.total_tokens_received || 0);

      // Update profile
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_type: subscriptionType,
          subscription_status: newSubscriptionStatus, // NAPRAWIONE: Poprawny status
          monthly_worksheet_limit: monthlyLimit,
          available_tokens: newAvailableTokens,
          total_tokens_received: newTotalReceived,
          is_tokens_frozen: subscription.status !== 'active',
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep(timestamp, 'ERROR: Failed to update profile', updateError);
        throw updateError;
      }

      logStep(timestamp, 'Profile updated successfully', {
        newAvailableTokens,
        newTotalReceived,
        subscriptionType,
        subscriptionStatus: newSubscriptionStatus,
        tokensFrozen: subscription.status !== 'active'
      });

      // Add token transaction if tokens were added
      if (shouldAddTokens && finalTokensToAdd > 0) {
        const { error: transactionError } = await supabaseService
          .from('token_transactions')
          .insert({
            teacher_id: profile.id,
            transaction_type: 'purchase',
            amount: finalTokensToAdd,
            description: `${event.type === 'customer.subscription.created' ? 'New' : 'Renewed'} ${subscriptionType} subscription`,
            reference_id: null
          });

        if (transactionError) {
          logStep(timestamp, 'WARNING: Failed to log token transaction', transactionError);
        } else {
          logStep(timestamp, 'Token transaction logged successfully');
        }
      }

      // Log subscription event (tylko jeśli nie było już logowane przez finalize-upgrade)
      if (!processedSession) {
        const { error: eventError } = await supabaseService
          .from('subscription_events')
          .insert({
            teacher_id: profile.id,
            email: customer.email,
            event_type: event.type,
            stripe_event_id: event.id,
            old_plan_type: profile.subscription_status || 'Unknown',
            new_plan_type: subscriptionType,
            tokens_added: finalTokensToAdd,
            event_data: {
              subscription_id: subscription.id,
              customer_id: customerId,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              processed_by: 'stripe-webhook'
            }
          });

        if (eventError) {
          logStep(timestamp, 'WARNING: Failed to log subscription event', eventError);
        } else {
          logStep(timestamp, 'Subscription event logged successfully');
        }
      }

      // NAPRAWIONE: Update subscriptions table with correct status
      const { error: subError } = await supabaseService
        .from('subscriptions')
        .upsert({
          teacher_id: profile.id,
          email: customer.email,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          subscription_status: newSubscriptionStatus, // NAPRAWIONE: Użyj poprawnego statusu
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
        logStep(timestamp, 'ERROR: Failed to upsert subscription record', subError);
        // Don't throw - profile was updated successfully
      } else {
        logStep(timestamp, 'Subscriptions table updated successfully');
      }
    }

    logStep(timestamp, 'Webhook processed successfully', { eventType: event.type });

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    logStep(timestamp, 'ERROR in webhook processing', { 
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        received: false 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
