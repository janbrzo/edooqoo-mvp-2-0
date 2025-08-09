import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const currentTime = new Date().toISOString();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[STRIPE-WEBHOOK] ${currentTime} Webhook received`);
    
    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    const stripe = new Stripe(Deno.env.get('Stripe_Secret_Key') || '', {
      apiVersion: '2023-10-16',
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
      console.log(`[STRIPE-WEBHOOK] ${currentTime} Event verified successfully`, { type: event.type, id: event.id });
    } catch (err) {
      console.error(`[STRIPE-WEBHOOK] ${currentTime} Webhook signature verification failed:`, err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[STRIPE-WEBHOOK] ${currentTime} Processing subscription event`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          eventType: event.type,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

        // Find user by customer ID
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.deleted) {
          console.error(`[STRIPE-WEBHOOK] ${currentTime} Customer was deleted`);
          break;
        }

        console.log(`[STRIPE-WEBHOOK] ${currentTime} Customer found`, { 
          email: customer.email, 
          customerId: customer.id 
        });

        // Find profile by email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, available_tokens, total_tokens_received, subscription_status')
          .eq('email', customer.email)
          .single();

        if (profileError || !profile) {
          console.error(`[STRIPE-WEBHOOK] ${currentTime} Profile not found for email: ${customer.email}`);
          break;
        }

        console.log(`[STRIPE-WEBHOOK] ${currentTime} Profile found`, {
          userId: profile.id,
          currentTokens: profile.available_tokens,
          currentTotalReceived: profile.total_tokens_received,
          currentSubscriptionStatus: profile.subscription_status
        });

        // Determine subscription type and tokens from price
        const amount = subscription.items.data[0].price.unit_amount || 0;
        let subscriptionType = 'Unknown Plan';
        let monthlyLimit = 0;
        let tokensToAdd = 0;
        const priceAmount = amount;

        if (amount === 900) {
          subscriptionType = 'Side-Gig';
          monthlyLimit = 15;
          tokensToAdd = 15;
        } else if (amount >= 1900) {
          if (amount === 1900) {
            monthlyLimit = 30;
            subscriptionType = 'Full-Time 30';
            tokensToAdd = 30;
          } else if (amount === 3900) {
            monthlyLimit = 60;
            subscriptionType = 'Full-Time 60';
            tokensToAdd = 60;
          } else if (amount === 5900) {
            monthlyLimit = 90;
            subscriptionType = 'Full-Time 90';
            tokensToAdd = 90;
          } else if (amount === 7900) {
            monthlyLimit = 120;
            subscriptionType = 'Full-Time 120';
            tokensToAdd = 120;
          } else {
            monthlyLimit = 30;
            subscriptionType = 'Full-Time 30';
            tokensToAdd = 30;
          }
        }

        console.log(`[STRIPE-WEBHOOK] ${currentTime} Plan determined`, {
          subscriptionType,
          monthlyLimit,
          tokensToAdd,
          priceAmount
        });

        // Determine if we should add tokens based on subscription lifecycle
        let shouldAddTokens = false;
        const isNowActive = subscription.status === 'active';
        const wasInactive = !profile.subscription_status || 
                           ['cancelled', 'inactive'].includes(profile.subscription_status);

        // Check for subscription transitions
        let oldPlanType = profile.subscription_status;
        
        if (subscription.cancel_at_period_end && isNowActive) {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Subscription is active but set to cancel at period end`);
          oldPlanType = subscriptionType;
        } else if (!subscription.cancel_at_period_end && isNowActive && 
                   profile.subscription_status?.includes('cancelled')) {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Detected reactivation - subscription was cancelled, now active`, {
            oldPlanType: profile.subscription_status
          });
          oldPlanType = profile.subscription_status;
        } else if (subscription.cancel_at_period_end && isNowActive &&
                   !profile.subscription_status?.includes('cancelled')) {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Detected cancellation - subscription was active, now cancelled`, {
            oldPlanType: profile.subscription_status
          });
          oldPlanType = profile.subscription_status;
        }

        // Token addition logic - only add tokens for new subscriptions or reactivations
        if (event.type === 'customer.subscription.created' ||
            (event.type === 'customer.subscription.updated' && wasInactive && isNowActive)) {
          shouldAddTokens = true;
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Tokens will be added - new subscription or reactivation`);
        } else {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Not adding tokens - subscription update without reactivation`, {
            wasInactive,
            isNowActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
        }

        if (!shouldAddTokens) {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} No tokens will be added`);
        }

        // NAPRAWIONE: Determine proper subscription status for both tables
        let subscriptionStatusForSubscriptionsTable: string;
        let subscriptionStatusForProfiles: string;
        
        if (subscription.status === 'active') {
          if (subscription.cancel_at_period_end) {
            subscriptionStatusForSubscriptionsTable = 'active_cancelled';
            subscriptionStatusForProfiles = 'active_cancelled';
          } else {
            subscriptionStatusForSubscriptionsTable = 'active';
            subscriptionStatusForProfiles = 'active';
          }
        } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          subscriptionStatusForSubscriptionsTable = 'cancelled';
          subscriptionStatusForProfiles = 'cancelled';
        } else {
          subscriptionStatusForSubscriptionsTable = subscription.status;
          subscriptionStatusForProfiles = subscription.status;
        }

        // Calculate new token values
        const newAvailableTokens = shouldAddTokens ? 
          profile.available_tokens + tokensToAdd : 
          profile.available_tokens;
        const newTotalReceived = shouldAddTokens ? 
          profile.total_tokens_received + tokensToAdd : 
          profile.total_tokens_received;

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_type: subscriptionType,
            subscription_status: subscriptionStatusForProfiles,
            subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            monthly_worksheet_limit: monthlyLimit,
            available_tokens: newAvailableTokens,
            total_tokens_received: newTotalReceived,
            is_tokens_frozen: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`[STRIPE-WEBHOOK] ${currentTime} Error updating profile:`, updateError);
        } else {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Profile updated successfully`, {
            newAvailableTokens,
            newTotalReceived,
            subscriptionType,
            subscriptionStatus: subscriptionStatusForProfiles,
            tokensFrozen: false
          });
        }

        // Log subscription event
        const { error: eventError } = await supabase
          .from('subscription_events')
          .insert({
            teacher_id: profile.id,
            email: customer.email,
            event_type: event.type,
            stripe_event_id: event.id,
            old_plan_type: oldPlanType,
            new_plan_type: subscriptionType,
            tokens_added: shouldAddTokens ? tokensToAdd : 0,
            event_data: {
              subscription_id: subscription.id,
              customer_id: subscription.customer,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              amount: priceAmount
            }
          });

        if (eventError) {
          console.error(`[STRIPE-WEBHOOK] ${currentTime} Error logging subscription event:`, eventError);
        } else {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Subscription event logged successfully`);
        }

        // NAPRAWIONE: Update subscriptions table with proper status and required fields
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            teacher_id: profile.id,
            email: customer.email,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            subscription_status: subscriptionStatusForSubscriptionsTable, // NAPRAWIONE: właściwy status
            subscription_type: subscriptionType === 'Side-Gig' ? 'side-gig' : 
                              (subscriptionType.includes('Full-Time') ? 
                                `full-time-${monthlyLimit}` : 'unknown'),
            monthly_limit: monthlyLimit,
            // NAPRAWIONE: Zawsze podajemy current_period_start i current_period_end
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'teacher_id',
            ignoreDuplicates: false
          });

        if (subscriptionError) {
          console.error(`[STRIPE-WEBHOOK] ${currentTime} ERROR: Failed to upsert subscription record`, subscriptionError);
        } else {
          console.log(`[STRIPE-WEBHOOK] ${currentTime} Subscription record updated successfully with status:`, subscriptionStatusForSubscriptionsTable);
        }

        break;
      }

      // NAPRAWIONE: Nowa obsługa checkout.session.completed dla upgrade'ów
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        console.log(`[STRIPE-WEBHOOK] ${currentTime} Processing checkout session completed`, {
          sessionId: session.id,
          metadata: session.metadata
        });

        // Check if this is an upgrade payment
        if (session.metadata?.action === 'upgrade' && session.metadata?.subscription_id) {
          const subscriptionId = session.metadata.subscription_id;
          const targetPlanPrice = parseInt(session.metadata.target_plan_price || '0');
          const targetMonthlyLimit = parseInt(session.metadata.target_monthly_limit || '0');
          const targetPlanName = session.metadata.target_plan_name || '';
          const upgradeTokens = parseInt(session.metadata.upgrade_tokens || '0');
          const userId = session.metadata.supabase_user_id;

          console.log(`[STRIPE-WEBHOOK] ${currentTime} Processing upgrade payment`, {
            subscriptionId,
            targetPlanPrice,
            targetMonthlyLimit,
            upgradeTokens,
            userId
          });

          try {
            // Update the existing subscription to the new plan price
            const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
              items: [{
                id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: targetPlanName,
                  },
                  unit_amount: targetPlanPrice * 100,
                  recurring: {
                    interval: 'month',
                  },
                },
              }],
              proration_behavior: 'none',
              billing_cycle_anchor: 'unchanged',
            });

            console.log(`[STRIPE-WEBHOOK] ${currentTime} Subscription updated successfully`, {
              subscriptionId: updatedSubscription.id,
              newAmount: updatedSubscription.items.data[0].price.unit_amount
            });

            // Add upgrade tokens to user's account
            if (upgradeTokens > 0 && userId) {
              const { error: tokenError } = await supabase
                .from('profiles')
                .update({
                  available_tokens: supabase.raw(`available_tokens + ${upgradeTokens}`),
                  total_tokens_received: supabase.raw(`total_tokens_received + ${upgradeTokens}`),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

              if (tokenError) {
                console.error(`[STRIPE-WEBHOOK] ${currentTime} Error adding upgrade tokens:`, tokenError);
              } else {
                console.log(`[STRIPE-WEBHOOK] ${currentTime} Upgrade tokens added successfully:`, upgradeTokens);
              }
            }

          } catch (error) {
            console.error(`[STRIPE-WEBHOOK] ${currentTime} Error processing upgrade:`, error);
          }
        }
        break;
      }

      default:
        console.log(`[STRIPE-WEBHOOK] ${currentTime} Unhandled event type: ${event.type}`);
    }

    console.log(`[STRIPE-WEBHOOK] ${currentTime} Webhook processed successfully`, { eventType: event.type });
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error(`[STRIPE-WEBHOOK] ${currentTime} Error processing webhook:`, error);
    return new Response('Error processing webhook', { status: 500 });
  }
});
