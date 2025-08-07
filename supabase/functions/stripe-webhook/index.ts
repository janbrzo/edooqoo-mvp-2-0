
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${timestamp} ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received');

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('ERROR: Missing Stripe secret key');
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      logStep('ERROR: Missing Stripe signature');
      throw new Error('Missing stripe signature');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      logStep('ERROR: Missing webhook secret');
      throw new Error('Missing webhook secret');
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep('Event verified successfully', { type: event.type, id: event.id });
    } catch (err) {
      logStep('ERROR: Webhook signature verification failed', { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // POPRAWIONA DEDUPLIKACJA: Sprawdź kombinację stripe_event_id + event_type
    const { data: existingEvent, error: eventCheckError } = await supabaseService
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .eq('event_type', event.type)
      .single();

    if (eventCheckError && eventCheckError.code !== 'PGRST116') {
      logStep('ERROR: Failed to check existing event', eventCheckError);
      throw eventCheckError;
    }

    if (existingEvent) {
      logStep('Event already processed, skipping', { eventId: event.id, eventType: event.type });
      return new Response(JSON.stringify({ received: true, skipped: 'already_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle subscription creation and updates
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' ||
        event.type === 'invoice.payment_succeeded') {
      
      let subscription;
      
      if (event.type === 'invoice.payment_succeeded') {
        const invoiceSubscriptionId = event.data.object.subscription;
        if (!invoiceSubscriptionId) {
          logStep('WARNING: Invoice has no subscription ID, skipping', { invoiceId: event.data.object.id });
          return new Response(JSON.stringify({ received: true, skipped: 'no_subscription' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId as string);
      } else {
        subscription = event.data.object as Stripe.Subscription;
      }

      logStep('Processing subscription event', { 
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        eventType: event.type,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

      // Get customer details
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const email = customer.email;

      if (!email) {
        logStep('ERROR: No email found for customer');
        throw new Error('No email found for customer');
      }

      logStep('Customer found', { email, customerId: customer.id });

      // Find user profile by email
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, available_tokens, subscription_type, monthly_worksheet_limit, total_tokens_received, subscription_status')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        logStep('ERROR: User profile not found', { email, error: profileError });
        throw new Error(`User profile not found for email: ${email}`);
      }

      logStep('Profile found', { 
        userId: profile.id, 
        currentTokens: profile.available_tokens,
        currentTotalReceived: profile.total_tokens_received || 0,
        currentSubscriptionStatus: profile.subscription_status
      });

      // Determine subscription details from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      let subscriptionType = 'Unknown';
      let monthlyLimit = 0;
      let tokensToAdd = 0;

      // Determine plan based on amount
      if (amount === 900) { // $9.00 = Side-Gig
        subscriptionType = 'Side-Gig';
        monthlyLimit = 15;
        tokensToAdd = 15;
      } else if (amount === 1900) { // $19.00 = Full-Time 30
        subscriptionType = 'Full-Time 30';
        monthlyLimit = 30;
        tokensToAdd = 30;
      } else if (amount === 3900) { // $39.00 = Full-Time 60
        subscriptionType = 'Full-Time 60';
        monthlyLimit = 60;
        tokensToAdd = 60;
      } else if (amount === 5900) { // $59.00 = Full-Time 90
        subscriptionType = 'Full-Time 90';
        monthlyLimit = 90;
        tokensToAdd = 90;
      } else if (amount === 7900) { // $79.00 = Full-Time 120
        subscriptionType = 'Full-Time 120';
        monthlyLimit = 120;
        tokensToAdd = 120;
      }

      logStep('Plan determined', { 
        subscriptionType, 
        monthlyLimit, 
        tokensToAdd, 
        priceAmount: amount 
      });

      // Validate subscription dates before using them
      let subscriptionExpiresAt = null;
      let currentPeriodStart = null;
      let currentPeriodEnd = null;

      if (subscription.current_period_start && typeof subscription.current_period_start === 'number') {
        try {
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          logStep('Current period start calculated', { periodStart: currentPeriodStart });
        } catch (dateError) {
          logStep('WARNING: Could not parse subscription start date', { 
            current_period_start: subscription.current_period_start,
            error: dateError.message 
          });
          currentPeriodStart = new Date().toISOString();
        }
      }

      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        try {
          subscriptionExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
          currentPeriodEnd = subscriptionExpiresAt;
          logStep('Subscription expiry date calculated', { expiresAt: subscriptionExpiresAt });
        } catch (dateError) {
          logStep('WARNING: Could not parse subscription end date', { 
            current_period_end: subscription.current_period_end,
            error: dateError.message 
          });
          subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          currentPeriodEnd = subscriptionExpiresAt;
        }
      }

      // Determine subscription status based on cancel_at_period_end
      let newSubscriptionStatus: string;
      let shouldFreezeTokens = false;

      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          newSubscriptionStatus = 'active_cancelled';
          shouldFreezeTokens = false; // Don't freeze until actually cancelled
          logStep('Subscription is active but set to cancel at period end');
        } else {
          newSubscriptionStatus = 'active';
          shouldFreezeTokens = false;
        }
      } else {
        newSubscriptionStatus = subscription.status;
        shouldFreezeTokens = subscription.status === 'cancelled';
      }

      // Token deduplication logic - only add tokens for new subscriptions or reactivations
      let shouldAddTokens = false;
      let newAvailableTokens = profile.available_tokens;
      let newTotalReceived = profile.total_tokens_received || 0;

      if (event.type === 'customer.subscription.created') {
        // Always add tokens for new subscriptions
        shouldAddTokens = true;
        logStep('Adding tokens for new subscription');
      } else if (event.type === 'customer.subscription.updated') {
        // Only add tokens if subscription was reactivated (from cancelled to active)
        const wasInactive = !profile.subscription_status || 
                           profile.subscription_status === 'cancelled' || 
                           profile.subscription_status === 'past_due';
        const isNowActive = subscription.status === 'active';
        
        if (wasInactive && isNowActive && !subscription.cancel_at_period_end) {
          shouldAddTokens = true;
          logStep('Adding tokens for reactivated subscription');
        } else {
          logStep('Not adding tokens - subscription update without reactivation', {
            wasInactive,
            isNowActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
        }
      }

      if (shouldAddTokens) {
        newAvailableTokens = profile.available_tokens + tokensToAdd;
        newTotalReceived = (profile.total_tokens_received || 0) + tokensToAdd;
        logStep('Tokens will be added', { tokensToAdd, newAvailableTokens, newTotalReceived });
      } else {
        logStep('No tokens will be added');
      }

      // Update profile with subscription details
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_type: subscriptionType,
          subscription_status: newSubscriptionStatus,
          subscription_expires_at: subscriptionExpiresAt,
          monthly_worksheet_limit: monthlyLimit,
          available_tokens: newAvailableTokens,
          total_tokens_received: newTotalReceived,
          is_tokens_frozen: shouldFreezeTokens,
          monthly_worksheets_used: 0, // Reset monthly usage on subscription changes
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep('ERROR: Failed to update profile', updateError);
        throw updateError;
      }

      logStep('Profile updated successfully', { 
        newAvailableTokens,
        newTotalReceived,
        subscriptionType,
        subscriptionStatus: newSubscriptionStatus,
        tokensFrozen: shouldFreezeTokens
      });

      // Log subscription event with email included
      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert({
          teacher_id: profile.id,
          email: email,
          event_type: event.type,
          old_plan_type: profile.subscription_type || 'Free Demo',
          new_plan_type: subscriptionType,
          tokens_added: shouldAddTokens ? tokensToAdd : 0,
          stripe_event_id: event.id,
          event_data: {
            subscription_id: subscription.id,
            customer_id: customer.id,
            amount: amount,
            currency: price.currency,
            period_start: subscription.current_period_start,
            period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status
          }
        });

      if (eventError) {
        logStep('WARNING: Failed to log subscription event', eventError);
      } else {
        logStep('Subscription event logged successfully');
      }

      // Add token transaction record only if tokens were added
      if (shouldAddTokens) {
        const { error: transactionError } = await supabaseService
          .from('token_transactions')
          .insert({
            teacher_id: profile.id,
            transaction_type: 'purchase',
            amount: tokensToAdd,
            description: `Subscription tokens added - ${subscriptionType}`,
            reference_id: null
          });

        if (transactionError) {
          logStep('WARNING: Failed to log token transaction', transactionError);
        } else {
          logStep('Token transaction logged successfully', { tokensAdded: tokensToAdd });
        }
      }

      // POPRAWIONA LOGIKA: Update subscriptions table z prawidłową logiką upsert
      const subscriptionData = {
        teacher_id: profile.id,
        email: email,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        subscription_status: newSubscriptionStatus,
        subscription_type: subscriptionType.toLowerCase().replace(/\s+/g, '-'),
        monthly_limit: monthlyLimit,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      };

      // KLUCZOWA ZMIANA: Sprawdź czy istnieje rekord dla tego stripe_subscription_id
      const { data: existingSubscription } = await supabaseService
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (existingSubscription) {
        // Update istniejącego rekordu po stripe_subscription_id
        const { error: subError } = await supabaseService
          .from('subscriptions')
          .update(subscriptionData)
          .eq('stripe_subscription_id', subscription.id);

        if (subError) {
          logStep('WARNING: Failed to update existing subscription record', subError);
        } else {
          logStep('Existing subscription record updated successfully', { subscriptionId: subscription.id });
        }
      } else {
        // Insert nowego rekordu - może być kilka subskrypcji dla tego samego użytkownika
        const { error: subError } = await supabaseService
          .from('subscriptions')
          .insert(subscriptionData);

        if (subError) {
          logStep('WARNING: Failed to insert new subscription record', subError);
        } else {
          logStep('New subscription record created successfully', { subscriptionId: subscription.id });
        }
      }
    }

    // Handle subscription deletion/cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      logStep('Processing subscription deletion', { 
        subscriptionId: subscription.id,
        customerId: subscription.customer
      });

      // Get customer details
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const email = customer.email;

      if (!email) {
        logStep('ERROR: No email found for deleted subscription customer');
        throw new Error('No email found for customer');
      }

      // Find user profile by email
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, subscription_type')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        logStep('ERROR: User profile not found for deletion', { email, error: profileError });
        throw new Error(`User profile not found for email: ${email}`);
      }

      logStep('Processing cancellation for profile', { userId: profile.id, email });

      // Freeze tokens and update subscription status - set type to 'Inactive'
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          subscription_type: 'Inactive',
          is_tokens_frozen: true,
          monthly_worksheet_limit: 0,
          monthly_worksheets_used: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep('ERROR: Failed to update profile on cancellation', updateError);
        throw updateError;
      }

      // Log cancellation event with email
      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert({
          teacher_id: profile.id,
          email: email,
          event_type: 'customer.subscription.deleted',
          old_plan_type: profile.subscription_type || 'Unknown',
          new_plan_type: 'Inactive',
          tokens_added: 0,
          stripe_event_id: event.id,
          event_data: {
            subscription_id: subscription.id,
            customer_id: customer.id,
            cancelled_at: subscription.canceled_at,
            ended_at: subscription.ended_at
          }
        });

      if (eventError) {
        logStep('WARNING: Failed to log cancellation event', eventError);
      } else {
        logStep('Cancellation event logged successfully');
      }

      // Update subscriptions table status po stripe_subscription_id
      const { error: subError } = await supabaseService
        .from('subscriptions')
        .update({
          subscription_status: 'cancelled',
          subscription_type: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (subError) {
        logStep('WARNING: Failed to update subscriptions table on cancellation', subError);
      } else {
        logStep('Subscriptions table updated for cancellation');
      }
    }

    logStep('Webhook processed successfully', { eventType: event.type });
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('ERROR: Webhook processing failed', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
