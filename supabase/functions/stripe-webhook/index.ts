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
    // ENHANCED DEBUG LOGGING
    logStep('=== WEBHOOK RECEIVED ===', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    });

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

    // Deduplicate events
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

    // ADDED: Handle upgrade payments through checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.action === 'upgrade') {
        logStep('Processing upgrade payment', { sessionId: session.id, subscriptionId: session.metadata.subscription_id });

        const subscriptionId = session.metadata.subscription_id;
        const targetPlanPrice = parseFloat(session.metadata.target_plan_price || '0');
        const targetPlanName = session.metadata.target_plan_name || '';
        const targetMonthlyLimit = parseInt(session.metadata.target_monthly_limit || '0');
        const upgradeTokens = parseInt(session.metadata.upgrade_tokens || '0');

        if (!subscriptionId) {
          logStep('ERROR: No subscription ID in upgrade metadata');
          throw new Error('No subscription ID found in upgrade metadata');
        }

        try {
          // Update the existing subscription with new price
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
              id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
              price_data: {
                currency: 'usd',
                product_data: {
                  name: targetPlanName,
                  description: `${targetMonthlyLimit} worksheets per month`,
                },
                unit_amount: targetPlanPrice * 100, // Full target plan price
                recurring: {
                  interval: 'month',
                },
              },
            }],
            proration_behavior: 'none', // No additional prorating since we handled it with one-time payment
            billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
          });

          logStep('Subscription upgraded successfully', { 
            subscriptionId: updatedSubscription.id,
            newAmount: targetPlanPrice * 100
          });

          // Find user by email from customer
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          const email = customer.email;

          if (!email) {
            logStep('ERROR: No email found for upgrade customer');
            throw new Error('No email found for customer');
          }

          // Find user profile by email
          const { data: profile, error: profileError } = await supabaseService
            .from('profiles')
            .select('id, available_tokens, subscription_type, total_tokens_received')
            .eq('email', email)
            .single();

          if (profileError || !profile) {
            logStep('ERROR: User profile not found for upgrade', { email, error: profileError });
            throw new Error(`User profile not found for email: ${email}`);
          }

          // Add upgrade tokens and update subscription info
          const newAvailableTokens = profile.available_tokens + upgradeTokens;
          const newTotalReceived = (profile.total_tokens_received || 0) + upgradeTokens;

          // Determine subscription type from target plan price
          let subscriptionType = 'Unknown';
          if (targetPlanPrice === 9) {
            subscriptionType = 'Side-Gig';
          } else if (targetPlanPrice === 19) {
            subscriptionType = 'Full-Time 30';
          } else if (targetPlanPrice === 39) {
            subscriptionType = 'Full-Time 60';
          } else if (targetPlanPrice === 59) {
            subscriptionType = 'Full-Time 90';
          } else if (targetPlanPrice === 79) {
            subscriptionType = 'Full-Time 120';
          }

          const { error: updateError } = await supabaseService
            .from('profiles')
            .update({
              subscription_type: subscriptionType,
              subscription_status: 'active', // Upgrade makes subscription active
              monthly_worksheet_limit: targetMonthlyLimit,
              available_tokens: newAvailableTokens,
              total_tokens_received: newTotalReceived,
              is_tokens_frozen: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (updateError) {
            logStep('ERROR: Failed to update profile after upgrade', updateError);
            throw updateError;
          }

          // FIXED: Update subscriptions table with full subscription type name
          const subscriptionData = {
            teacher_id: profile.id,
            email: email,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customer.id,
            subscription_status: 'active',
            subscription_type: subscriptionType, // FIXED: Use full name like "Full-Time 30"
            monthly_limit: targetMonthlyLimit,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: subError } = await supabaseService
            .from('subscriptions')
            .upsert(subscriptionData, { 
              onConflict: 'teacher_id',
              ignoreDuplicates: false 
            });

          if (subError) {
            logStep('ERROR: Failed to update subscriptions table', subError);
          } else {
            logStep('Subscriptions table updated after upgrade with full type name');
          }

          // Log upgrade event
          const { error: eventError } = await supabaseService
            .from('subscription_events')
            .insert({
              teacher_id: profile.id,
              email: email,
              event_type: 'checkout.session.completed',
              old_plan_type: profile.subscription_type || 'Unknown',
              new_plan_type: subscriptionType,
              tokens_added: upgradeTokens,
              stripe_event_id: event.id,
              event_data: {
                session_id: session.id,
                subscription_id: subscriptionId,
                target_plan_price: targetPlanPrice,
                upgrade_tokens: upgradeTokens
              }
            });

          if (eventError) {
            logStep('WARNING: Failed to log upgrade event', eventError);
          }

          // Add token transaction record with teacher_email - FIXED
          const { error: transactionError } = await supabaseService
            .from('token_transactions')
            .insert({
              teacher_id: profile.id,
              teacher_email: email,  // FIXED: Add teacher_email
              transaction_type: 'purchase',
              amount: upgradeTokens,
              description: `Upgrade to ${subscriptionType} - tokens added`,
              reference_id: null
            });

          if (transactionError) {
            logStep('WARNING: Failed to log upgrade token transaction', transactionError);
          }

          logStep('Upgrade processed successfully', { 
            newSubscriptionType: subscriptionType,
            tokensAdded: upgradeTokens,
            newAvailableTokens
          });

          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });

        } catch (stripeError: any) {
          logStep('ERROR: Failed to update subscription during upgrade', stripeError);
          throw stripeError;
        }
      }
      
      // Handle other checkout.session.completed events (non-upgrade)
      logStep('Non-upgrade checkout session completed', { sessionId: session.id });
    }

    // Handle subscription creation and updates (existing logic)
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

      // FIXED: Determine plan based on amount with full names
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

      // FIXED: Enhanced fallback logic for billing periods to prevent NULL errors
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
          currentPeriodStart = new Date().toISOString(); // HARD FALLBACK to now
        }
      } else {
        // HARD FALLBACK: If Stripe doesn't provide start date, use now
        currentPeriodStart = new Date().toISOString();
        logStep('WARNING: No current_period_start from Stripe, using fallback', { fallbackStart: currentPeriodStart });
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
          // HARD FALLBACK: 30 days from now
          subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          currentPeriodEnd = subscriptionExpiresAt;
        }
      } else {
        // HARD FALLBACK: If Stripe doesn't provide end date, use 30 days from now
        subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        currentPeriodEnd = subscriptionExpiresAt;
        logStep('WARNING: No current_period_end from Stripe, using fallback', { fallbackEnd: subscriptionExpiresAt });
      }

      // FIXED: Determine subscription status based on cancel_at_period_end
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

      // FIXED: Determine old plan type for events - check if it's first purchase
      let oldPlanType = 'Free Demo'; // FIXED: Default for first purchase
      
      if (event.type === 'customer.subscription.updated' && event.data.previous_attributes) {
        const previousAttributes = event.data.previous_attributes as any;
        
        // Check if cancel_at_period_end changed - means cancellation or reactivation
        if ('cancel_at_period_end' in previousAttributes) {
          const wasCancelledBefore = previousAttributes.cancel_at_period_end;
          const isNowCancelled = subscription.cancel_at_period_end;
          
          if (wasCancelledBefore && !isNowCancelled) {
            // Reactivation - subscription was cancelled, now active
            oldPlanType = profile.subscription_type ? `${profile.subscription_type}_cancelled` : 'Inactive';
            logStep('Detected reactivation - subscription was cancelled, now active', { oldPlanType });
          } else if (!wasCancelledBefore && isNowCancelled) {
            // Cancellation - subscription was active, now cancelled
            oldPlanType = profile.subscription_type || subscriptionType;
            logStep('Detected cancellation - subscription was active, now cancelled', { oldPlanType });
            
            // ENHANCED: Log subscription_events for cancel action - CRITICAL for tracking cancellations
            const eventNewPlanType = `${subscriptionType}_cancelled`;
            logStep('Logging cancellation event', {
              oldPlanType,
              eventNewPlanType,
              subscriptionId: subscription.id
            });

            const { error: cancelEventError } = await supabaseService
              .from('subscription_events')
              .insert({
                teacher_id: profile.id,
                email: email, // CRITICAL: Always include email  
                event_type: 'customer.subscription.updated',
                old_plan_type: oldPlanType,
                new_plan_type: eventNewPlanType,
                tokens_added: 0,
                stripe_event_id: event.id,
                event_data: {
                  subscription_id: subscription.id,
                  customer_id: customer.id,
                  cancel_at_period_end: subscription.cancel_at_period_end,
                  status: subscription.status,
                  action: 'cancellation',
                  period_start: subscription.current_period_start || null,
                  period_end: subscription.current_period_end || null
                }
              });
              
            if (cancelEventError) {
              logStep('ERROR: Failed to log cancellation event', cancelEventError);
              // ADDED: Force retry for cancellation events - they are critical
              try {
                await supabaseService
                  .from('subscription_events')
                  .insert({
                    teacher_id: profile.id,
                    email: email,
                    event_type: 'customer.subscription.updated',
                    old_plan_type: oldPlanType,
                    new_plan_type: eventNewPlanType,
                    tokens_added: 0,
                    stripe_event_id: `${event.id}_cancel_retry`,
                    event_data: { action: 'cancellation_retry', original_error: cancelEventError.message }
                  });
                logStep('Cancellation event logged successfully on retry');
              } catch (retryError) {
                logStep('ERROR: Even retry failed for cancellation event', retryError);
              }
            } else {
              logStep('Cancellation event logged successfully - MAIN PATH', { 
                eventNewPlanType,
                oldPlan: oldPlanType,
                newPlan: eventNewPlanType 
              });
            }
          } else {
            // Other changes - use current type from profile
            oldPlanType = profile.subscription_type || subscriptionType;
          }
        } else {
          // Other subscription changes - use current type
          oldPlanType = profile.subscription_type || subscriptionType;
        }
      } else if (event.type === 'customer.subscription.created') {
        // FIXED: For new subscriptions, check if user had previous cancelled subscription
        if (profile.subscription_status === 'cancelled') {
          oldPlanType = 'Inactive'; // User had cancelled subscription
          logStep('New subscription after cancelled subscription - using Inactive', { oldPlanType });
        } else {
          oldPlanType = 'Free Demo'; // FIXED: First time purchase
          logStep('First subscription purchase - using Free Demo', { oldPlanType });
        }
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

      // ENHANCED: Always log subscription event - CRITICAL for tracking all subscription changes
      const eventNewPlanType = newSubscriptionStatus === 'active_cancelled' 
        ? `${subscriptionType}_cancelled` 
        : subscriptionType;

      logStep('Preparing to log subscription event', {
        eventType: event.type,
        oldPlanType,
        eventNewPlanType,
        tokensAdded: shouldAddTokens ? tokensToAdd : 0,
        hasCurrentPeriods: !!(subscription.current_period_start && subscription.current_period_end)
      });

      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert({
          teacher_id: profile.id,
          email: email, // CRITICAL: Always include email
          event_type: event.type,
          old_plan_type: oldPlanType, // FIXED: Uses "Free Demo" for first purchase
          new_plan_type: eventNewPlanType, 
          tokens_added: shouldAddTokens ? tokensToAdd : 0,
          stripe_event_id: event.id,
          event_data: {
            subscription_id: subscription.id,
            customer_id: customer.id,
            amount: amount,
            currency: price.currency,
            period_start: subscription.current_period_start || null, // FIXED: Handle null values
            period_end: subscription.current_period_end || null, // FIXED: Handle null values
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status,
            current_period_start_fallback: currentPeriodStart, // ADDED: Our fallback values
            current_period_end_fallback: currentPeriodEnd // ADDED: Our fallback values
          }
        });

      if (eventError) {
        logStep('ERROR: Failed to log subscription event', eventError);
        // ADDED: Force retry with minimal data if main insert fails
        try {
          await supabaseService
            .from('subscription_events')
            .insert({
              teacher_id: profile.id,
              email: email,
              event_type: event.type,
              old_plan_type: oldPlanType,
              new_plan_type: eventNewPlanType,
              tokens_added: shouldAddTokens ? tokensToAdd : 0,
              stripe_event_id: `${event.id}_retry`,
              event_data: { minimal: true, original_error: eventError.message }
            });
          logStep('Subscription event logged successfully on retry');
        } catch (retryError) {
          logStep('ERROR: Even retry failed for subscription event', retryError);
        }
      } else {
        logStep('Subscription event logged successfully - MAIN PATH', {
          eventType: event.type,
          oldPlan: oldPlanType,
          newPlan: eventNewPlanType
        });
      }

      // Add token transaction record only if tokens were added
      if (shouldAddTokens) {
        const { error: transactionError } = await supabaseService
          .from('token_transactions')
          .insert({
            teacher_id: profile.id,
            teacher_email: email,  // FIXED: Add teacher_email
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

      // FIXED: Update/Create subscriptions table record with enhanced fallback protection
      const subscriptionData = {
        teacher_id: profile.id,
        email: email,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        subscription_status: newSubscriptionStatus, // FIXED: correctly uses active_cancelled
        subscription_type: subscriptionType, // FIXED: uses full plan name like "Full-Time 30"
        monthly_limit: monthlyLimit,
        current_period_start: currentPeriodStart, // FIXED: Always has a value now
        current_period_end: currentPeriodEnd, // FIXED: Always has a value now
        updated_at: new Date().toISOString()
      };

      logStep('Attempting to upsert subscriptions table', { 
        subscriptionData: {
          ...subscriptionData,
          // Log the critical fields that were causing NULL errors
          current_period_start_provided: !!currentPeriodStart,
          current_period_end_provided: !!currentPeriodEnd
        }
      });

      const { error: subError } = await supabaseService
        .from('subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'stripe_subscription_id',  // FIXED: Use correct unique constraint
          ignoreDuplicates: false 
        });

      if (subError) {
        logStep('ERROR: Failed to upsert subscription record', subError);
        // Don't throw here - we want the webhook to succeed even if subscriptions table fails
      } else {
        logStep('Subscription record upserted successfully with full type name', { 
          teacherId: profile.id, 
          subscriptionId: subscription.id,
          status: newSubscriptionStatus,
          type: subscriptionType,
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodEnd
        });
      }
    }

    // Handle subscription deletion/cancellation - only when actually finished
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      logStep('Processing subscription deletion', { 
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        endedAt: subscription.ended_at,
        canceledAt: subscription.canceled_at
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

      // Set status to 'cancelled' only when subscription actually ended
      const shouldSetCancelled = subscription.ended_at !== null;
      const finalStatus = shouldSetCancelled ? 'cancelled' : 'active_cancelled';
      const finalType = shouldSetCancelled ? 'Inactive' : profile.subscription_type;

      logStep('Determining final status', { shouldSetCancelled, finalStatus, finalType });

      // Freeze tokens and update subscription status
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_status: finalStatus,
          subscription_type: finalType,
          is_tokens_frozen: shouldSetCancelled, // Freeze only if actually ended
          monthly_worksheet_limit: shouldSetCancelled ? 0 : undefined,
          monthly_worksheets_used: shouldSetCancelled ? 0 : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep('ERROR: Failed to update profile on cancellation', updateError);
        throw updateError;
      }

      // ENHANCED: Log cancellation event with email - CRITICAL for tracking deletions
      const deletionNewPlanType = shouldSetCancelled ? 'Inactive' : `${profile.subscription_type}_cancelled`;
      
      logStep('Logging deletion event', {
        oldPlanType: profile.subscription_type || 'Unknown',
        deletionNewPlanType,
        shouldSetCancelled,
        endedAt: subscription.ended_at
      });

      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert({
          teacher_id: profile.id,
          email: email, // CRITICAL: Always include email
          event_type: 'customer.subscription.deleted',
          old_plan_type: profile.subscription_type || 'Unknown',
          new_plan_type: deletionNewPlanType,
          tokens_added: 0,
          stripe_event_id: event.id,
          event_data: {
            subscription_id: subscription.id,
            customer_id: customer.id,
            cancelled_at: subscription.canceled_at,
            ended_at: subscription.ended_at,
            final_status: finalStatus,
            tokens_frozen: shouldSetCancelled
          }
        });

      if (eventError) {
        logStep('ERROR: Failed to log deletion event', eventError);
        // ADDED: Force retry for deletion events - they are critical
        try {
          await supabaseService
            .from('subscription_events')
            .insert({
              teacher_id: profile.id,
              email: email,
              event_type: 'customer.subscription.deleted',
              old_plan_type: profile.subscription_type || 'Unknown',
              new_plan_type: deletionNewPlanType,
              tokens_added: 0,
              stripe_event_id: `${event.id}_delete_retry`,
              event_data: { action: 'deletion_retry', original_error: eventError.message }
            });
          logStep('Deletion event logged successfully on retry');
        } catch (retryError) {
          logStep('ERROR: Even retry failed for deletion event', retryError);
        }
      } else {
        logStep('Deletion event logged successfully - MAIN PATH', {
          oldPlan: profile.subscription_type || 'Unknown',
          newPlan: deletionNewPlanType,
          finalStatus
        });
      }

      // FIXED: Update subscriptions table status with correct unique key
      logStep('Updating subscriptions table for cancellation', { 
        subscriptionId: subscription.id, 
        finalStatus, 
        shouldSetCancelled 
      });
      
      const { error: subError } = await supabaseService
        .from('subscriptions')
        .update({
          subscription_status: finalStatus, // Uses active_cancelled or cancelled
          subscription_type: shouldSetCancelled ? 'inactive' : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);  // FIXED: Use correct unique constraint

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
