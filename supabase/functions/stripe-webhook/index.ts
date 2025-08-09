
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionEventData {
  event_type: string;
  old_plan_type?: string;
  new_plan_type?: string;
  tokens_added?: number;
  stripe_event_id?: string;
  event_data?: any;
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    console.error('[STRIPE-WEBHOOK] Webhook secret not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Webhook received`);

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get('Stripe_Secret_Key') || '', {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Event verified successfully - {\"type\":\"${event.type}\",\"id\":\"${event.id}\"}`);

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, stripe, supabase);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, stripe, supabase);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, stripe, supabase);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, stripe, supabase);
        break;
      case 'invoice.payment_succeeded':
        console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Invoice payment succeeded - processing as potential renewal`);
        await handleInvoicePaymentSucceeded(event, stripe, supabase);
        break;
      default:
        console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Webhook error:`, err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(event: any, stripe: Stripe, supabase: any) {
  const session = event.data.object;
  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Processing checkout completion - {\"sessionId\":\"${session.id}\",\"mode\":\"${session.mode}\"}`);
  
  if (session.mode === 'subscription') {
    // For subscription checkouts, the subscription creation event will handle the logic
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Subscription checkout - delegating to subscription.created event`);
  }
}

async function handleInvoicePaymentSucceeded(event: any, stripe: Stripe, supabase: any) {
  const invoice = event.data.object;
  
  if (!invoice.subscription) {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} WARNING: Invoice has no subscription ID, skipping - {\"invoiceId\":\"${invoice.id}\"}`);
    return;
  }

  // Retrieve the customer
  const customer = await stripe.customers.retrieve(invoice.customer);
  if (customer.deleted) {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Customer deleted, skipping`);
    return;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Customer found - {\"email\":\"${customer.email}\",\"customerId\":\"${customer.id}\"}`);
  
  // Find user in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, available_tokens, total_tokens_received, subscription_status')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile not found for email:`, customer.email);
    return;
  }

  // For renewals, add tokens equal to the monthly limit
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const priceAmount = subscription.items.data[0].price.unit_amount || 0;

  let tokensToAdd = 0;
  let subscriptionType = 'Unknown Plan';

  if (priceAmount === 900) {
    tokensToAdd = 15;
    subscriptionType = 'Side-Gig';
  } else if (priceAmount === 1900) {
    tokensToAdd = 30;
    subscriptionType = 'Full-Time 30';
  } else if (priceAmount === 3900) {
    tokensToAdd = 60;
    subscriptionType = 'Full-Time 60';
  } else if (priceAmount === 5900) {
    tokensToAdd = 90;
    subscriptionType = 'Full-Time 90';
  } else if (priceAmount === 7900) {
    tokensToAdd = 120;
    subscriptionType = 'Full-Time 120';
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Renewal detected - adding tokens - {\"tokensToAdd\":${tokensToAdd},\"subscriptionType\":\"${subscriptionType}\"}`);

  const newAvailableTokens = profile.available_tokens + tokensToAdd;
  const newTotalReceived = profile.total_tokens_received + tokensToAdd;

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      available_tokens: newAvailableTokens,
      total_tokens_received: newTotalReceived,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error updating profile for renewal:`, updateError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Renewal processed successfully - {\"newTokens\":${newAvailableTokens}}`);
  }

  // Log renewal event
  await supabase.from('subscription_events').insert({
    teacher_id: profile.id,
    email: customer.email,
    event_type: 'renewed',
    new_plan_type: subscriptionType,
    tokens_added: tokensToAdd,
    stripe_event_id: event.id,
    event_data: { invoice_id: invoice.id, subscription_id: subscription.id }
  });
}

async function handleSubscriptionCreated(event: any, stripe: Stripe, supabase: any) {
  const subscription = event.data.object;
  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Processing subscription event - {\"subscriptionId\":\"${subscription.id}\",\"customerId\":\"${subscription.customer}\",\"status\":\"${subscription.status}\",\"eventType\":\"${event.type}\",\"cancelAtPeriodEnd\":${subscription.cancel_at_period_end}}`);

  // Retrieve the customer
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (customer.deleted) return;

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Customer found - {\"email\":\"${customer.email}\",\"customerId\":\"${customer.id}\"}`);
  
  // Find user in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, available_tokens, total_tokens_received, subscription_status')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile not found for email:`, customer.email);
    return;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile found - {\"userId\":\"${profile.id}\",\"currentTokens\":${profile.available_tokens},\"currentTotalReceived\":${profile.total_tokens_received},\"currentSubscriptionStatus\":\"${profile.subscription_status}\"}`);

  // Determine plan details
  const priceAmount = subscription.items.data[0].price.unit_amount || 0;
  let tokensToAdd = 0;
  let planType = 'unknown';
  let subscriptionType = 'Unknown Plan';
  let monthlyLimit = 0;

  if (priceAmount === 900) {
    tokensToAdd = 15;
    planType = 'side-gig';
    subscriptionType = 'Side-Gig';
    monthlyLimit = 15;
  } else if (priceAmount === 1900) {
    tokensToAdd = 30;
    planType = 'full-time';
    subscriptionType = 'Full-Time 30';
    monthlyLimit = 30;
  } else if (priceAmount === 3900) {
    tokensToAdd = 60;
    planType = 'full-time';
    subscriptionType = 'Full-Time 60';
    monthlyLimit = 60;
  } else if (priceAmount === 5900) {
    tokensToAdd = 90;
    planType = 'full-time';
    subscriptionType = 'Full-Time 90';
    monthlyLimit = 90;
  } else if (priceAmount === 7900) {
    tokensToAdd = 120;
    planType = 'full-time';
    subscriptionType = 'Full-Time 120';
    monthlyLimit = 120;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Plan determined - {\"subscriptionType\":\"${subscriptionType}\",\"monthlyLimit\":${monthlyLimit},\"tokensToAdd\":${tokensToAdd},\"priceAmount\":${priceAmount}}`);

  // Determine old plan type for subscription events - FIXED logic
  let oldPlanType = 'Free Demo'; // Default for first-time subscriptions
  if (profile.subscription_status === 'cancelled' || profile.subscription_status === 'active_cancelled') {
    oldPlanType = 'Inactive'; // Only use Inactive if subscription was previously cancelled/expired
  }
  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} First subscription purchase - using Free Demo - {\"oldPlanType\":\"${oldPlanType}\"}`);

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Adding tokens for new subscription`);

  const newAvailableTokens = profile.available_tokens + tokensToAdd;
  const newTotalReceived = profile.total_tokens_received + tokensToAdd;

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Tokens will be added - {\"tokensToAdd\":${tokensToAdd},\"newAvailableTokens\":${newAvailableTokens},\"newTotalReceived\":${newTotalReceived}}`);

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_type: subscriptionType,
      subscription_status: 'active',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      monthly_worksheet_limit: monthlyLimit,
      available_tokens: newAvailableTokens,
      total_tokens_received: newTotalReceived,
      is_tokens_frozen: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error updating profile:`, updateError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile updated successfully - {\"newAvailableTokens\":${newAvailableTokens},\"newTotalReceived\":${newTotalReceived},\"subscriptionType\":\"${subscriptionType}\",\"subscriptionStatus\":\"active\",\"tokensFrozen\":false}`);
  }

  // Log subscription event
  const eventData: SubscriptionEventData = {
    event_type: 'created',
    old_plan_type: oldPlanType,
    new_plan_type: subscriptionType,
    tokens_added: tokensToAdd,
    stripe_event_id: event.id,
    event_data: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      amount: priceAmount
    }
  };

  const { error: eventError } = await supabase
    .from('subscription_events')
    .insert({
      teacher_id: profile.id,
      email: customer.email,
      ...eventData
    });

  if (eventError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error logging subscription event:`, eventError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Subscription event logged successfully`);
  }

  // Add token transaction record
  const { error: transactionError } = await supabase
    .from('token_transactions')
    .insert({
      teacher_id: profile.id,
      transaction_type: 'purchase',
      amount: tokensToAdd,
      description: `New subscription: ${subscriptionType}`,
      reference_id: null
    });

  if (transactionError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error logging token transaction:`, transactionError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Token transaction logged successfully - {\"tokensAdded\":${tokensToAdd}}`);
  }

  // Update subscriptions table with FIXED logic to include required fields
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      teacher_id: profile.id,
      email: customer.email,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      subscription_status: 'active',
      subscription_type: subscriptionType, // FIXED: Full plan name
      monthly_limit: monthlyLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'teacher_id',
      ignoreDuplicates: false
    });

  if (subError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} ERROR: Failed to upsert subscription record - ${JSON.stringify(subError)}`);
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Webhook processed successfully - {\"eventType\":\"${event.type}\"}`);
}

async function handleSubscriptionUpdated(event: any, stripe: Stripe, supabase: any) {
  const subscription = event.data.object;
  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Processing subscription event - {\"subscriptionId\":\"${subscription.id}\",\"customerId\":\"${subscription.customer}\",\"status\":\"${subscription.status}\",\"eventType\":\"${event.type}\",\"cancelAtPeriodEnd\":${subscription.cancel_at_period_end}}`);

  // Retrieve the customer
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (customer.deleted) return;

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Customer found - {\"email\":\"${customer.email}\",\"customerId\":\"${customer.id}\"}`);
  
  // Find user in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, available_tokens, total_tokens_received, subscription_status, subscription_type')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile not found for email:`, customer.email);
    return;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile found - {\"userId\":\"${profile.id}\",\"currentTokens\":${profile.available_tokens},\"currentTotalReceived\":${profile.total_tokens_received},\"currentSubscriptionStatus\":\"${profile.subscription_status}\"}`);

  // Determine plan details
  const priceAmount = subscription.items.data[0].price.unit_amount || 0;
  let tokensToAdd = 0;
  let planType = 'unknown';
  let subscriptionType = 'Unknown Plan';
  let monthlyLimit = 0;

  if (priceAmount === 900) {
    tokensToAdd = 15;
    planType = 'side-gig';
    subscriptionType = 'Side-Gig';
    monthlyLimit = 15;
  } else if (priceAmount === 1900) {
    tokensToAdd = 30;
    planType = 'full-time';
    subscriptionType = 'Full-Time 30';
    monthlyLimit = 30;
  } else if (priceAmount === 3900) {
    tokensToAdd = 60;
    planType = 'full-time';
    subscriptionType = 'Full-Time 60';
    monthlyLimit = 60;
  } else if (priceAmount === 5900) {
    tokensToAdd = 90;
    planType = 'full-time';
    subscriptionType = 'Full-Time 90';
    monthlyLimit = 90;
  } else if (priceAmount === 7900) {
    tokensToAdd = 120;
    planType = 'full-time';
    subscriptionType = 'Full-Time 120';
    monthlyLimit = 120;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Plan determined - {\"subscriptionType\":\"${subscriptionType}\",\"monthlyLimit\":${monthlyLimit},\"tokensToAdd\":${tokensToAdd},\"priceAmount\":${priceAmount}}`);

  // Determine token logic and subscription status changes
  const wasInactive = ['cancelled', 'active_cancelled'].includes(profile.subscription_status);
  const isNowActive = subscription.status === 'active';
  const willAddTokens = wasInactive && isNowActive && !subscription.cancel_at_period_end;

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Not adding tokens - subscription update without reactivation - {\"wasInactive\":${wasInactive},\"isNowActive\":${isNowActive},\"cancelAtPeriodEnd\":${subscription.cancel_at_period_end}}`);

  let newAvailableTokens = profile.available_tokens;
  let newTotalReceived = profile.total_tokens_received;
  let eventType = 'updated';
  let oldPlanType = profile.subscription_type || 'Unknown';

  if (willAddTokens) {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Tokens will be added for reactivation - {\"tokensToAdd\":${tokensToAdd}}`);
    newAvailableTokens += tokensToAdd;
    newTotalReceived += tokensToAdd;
    eventType = 'reactivated';
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} No tokens will be added`);
  }

  // Determine subscription status based on Stripe data
  let newSubscriptionStatus: string;
  if (subscription.status === 'active') {
    if (subscription.cancel_at_period_end) {
      newSubscriptionStatus = 'active_cancelled';
      if (profile.subscription_status === 'active') {
        console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Detected cancellation - subscription was active, now cancelled - {\"oldPlanType\":\"${oldPlanType}\"}`);
        eventType = 'cancelled';
        console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Subscription is active but set to cancel at period end`);
      }
    } else {
      newSubscriptionStatus = 'active';
      if (profile.subscription_status?.includes('cancelled')) {
        console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Detected reactivation - subscription was cancelled, now active - {\"oldPlanType\":\"${oldPlanType}_cancelled\"}`);
        eventType = 'reactivated';
        oldPlanType = `${oldPlanType}_cancelled`;
      }
    }
  } else {
    newSubscriptionStatus = subscription.status;
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_type: subscriptionType,
      subscription_status: newSubscriptionStatus,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      monthly_worksheet_limit: monthlyLimit,
      available_tokens: newAvailableTokens,
      total_tokens_received: newTotalReceived,
      is_tokens_frozen: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error updating profile:`, updateError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile updated successfully - {\"newAvailableTokens\":${newAvailableTokens},\"newTotalReceived\":${newTotalReceived},\"subscriptionType\":\"${subscriptionType}\",\"subscriptionStatus\":\"${newSubscriptionStatus}\",\"tokensFrozen\":false}`);
  }

  // Log subscription event
  const eventData: SubscriptionEventData = {
    event_type: eventType,
    old_plan_type: oldPlanType,
    new_plan_type: subscriptionType,
    tokens_added: willAddTokens ? tokensToAdd : 0,
    stripe_event_id: event.id,
    event_data: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      cancel_at_period_end: subscription.cancel_at_period_end,
      amount: priceAmount
    }
  };

  const { error: eventError } = await supabase
    .from('subscription_events')
    .insert({
      teacher_id: profile.id,
      email: customer.email,
      ...eventData
    });

  if (eventError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error logging subscription event:`, eventError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Subscription event logged successfully`);
  }

  // Update subscriptions table with FIXED logic to properly determine status and include required fields
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      teacher_id: profile.id,
      email: customer.email,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      subscription_status: newSubscriptionStatus, // FIXED: Uses the same logic as profiles
      subscription_type: subscriptionType, // FIXED: Full plan name
      monthly_limit: monthlyLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'teacher_id',
      ignoreDuplicates: false
    });

  if (subError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} ERROR: Failed to upsert subscription record - ${JSON.stringify(subError)}`);
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Webhook processed successfully - {\"eventType\":\"${event.type}\"}`);
}

async function handleSubscriptionDeleted(event: any, stripe: Stripe, supabase: any) {
  const subscription = event.data.object;
  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Processing subscription deletion - {\"subscriptionId\":\"${subscription.id}\",\"customerId\":\"${subscription.customer}\",\"endedAt\":${subscription.ended_at},\"canceledAt\":${subscription.canceled_at}}`);

  // Find user by email
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (customer.deleted) return;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Profile not found for email:`, customer.email);
    return;
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Processing cancellation for profile - {\"userId\":\"${profile.id}\",\"email\":\"${profile.email}\"}`);

  // Determine if we should set status to cancelled (subscription actually ended)
  const shouldSetCancelled = subscription.ended_at || subscription.canceled_at;
  const finalStatus = shouldSetCancelled ? 'cancelled' : 'active_cancelled';
  const finalType = shouldSetCancelled ? 'Inactive' : subscription.type;

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Determining final status - {\"shouldSetCancelled\":${shouldSetCancelled},\"finalStatus\":\"${finalStatus}\",\"finalType\":\"${finalType}\"}`);

  // Update profile
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      subscription_type: shouldSetCancelled ? 'Inactive' : profile.subscription_type,
      subscription_status: finalStatus,
      is_tokens_frozen: shouldSetCancelled ? true : false,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (profileUpdateError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error updating profile for cancellation:`, profileUpdateError);
  }

  // Log cancellation event
  const { error: eventError } = await supabase
    .from('subscription_events')
    .insert({
      teacher_id: profile.id,
      email: profile.email,
      event_type: shouldSetCancelled ? 'expired' : 'cancelled',
      old_plan_type: profile.subscription_type || 'Unknown',
      new_plan_type: shouldSetCancelled ? 'Inactive' : profile.subscription_type,
      tokens_added: 0,
      stripe_event_id: event.id,
      event_data: {
        subscription_id: subscription.id,
        ended_at: subscription.ended_at,
        canceled_at: subscription.canceled_at
      }
    });

  if (eventError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error logging cancellation event:`, eventError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Cancellation event logged successfully`);
  }

  // Update subscriptions table
  const { error: subscriptionUpdateError } = await supabase
    .from('subscriptions')
    .update({
      subscription_status: finalStatus,
      subscription_type: shouldSetCancelled ? 'Inactive' : subscription.type,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subscriptionUpdateError) {
    console.error(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Error updating subscriptions table:`, subscriptionUpdateError);
  } else {
    console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Subscriptions table updated for cancellation`);
  }

  console.log(`[STRIPE-WEBHOOK] ${new Date().toISOString()} Webhook processed successfully - {\"eventType\":\"${event.type}\"}`);
}
