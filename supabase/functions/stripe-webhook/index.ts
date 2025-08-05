
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logStep('No stripe signature');
      throw new Error('No stripe signature');
    }

    // Parse webhook body
    const body = await req.text();
    logStep('Received webhook body length:', body.length);

    // Verify webhook signature (in production, use webhook endpoint secret)
    let event;
    try {
      event = JSON.parse(body);
      logStep('Event type:', event.type);
    } catch (err) {
      logStep('Invalid JSON:', err);
      throw new Error('Invalid JSON');
    }

    // Initialize Supabase with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        logStep('Processing checkout.session.completed');
        await handleCheckoutCompleted(stripe, supabaseClient, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        logStep('Processing invoice.payment_succeeded');
        await handlePaymentSucceeded(stripe, supabaseClient, event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        logStep('Processing subscription event:', event.type);
        await handleSubscriptionEvent(stripe, supabaseClient, event.data.object, event.type);
        break;
      
      case 'customer.subscription.deleted':
        logStep('Processing subscription deleted');
        await handleSubscriptionDeleted(stripe, supabaseClient, event.data.object);
        break;
      
      default:
        logStep('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('Error occurred', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCheckoutCompleted(stripe: Stripe, supabaseClient: any, session: any) {
  logStep('Handling checkout completed for session:', session.id);
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer as string);
    if (!customer || customer.deleted) {
      throw new Error('Customer not found');
    }

    logStep('Customer email:', (customer as any).email);

    // Find user by email
    const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.users.find((u: any) => u.email === (customer as any).email);
    if (!user) {
      logStep('User not found for email:', (customer as any).email);
      return;
    }

    logStep('Found user:', user.id);

    // If this is a subscription checkout, get subscription details
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await processSubscription(supabaseClient, user.id, customer as any, subscription, session.metadata);
    }

  } catch (error) {
    logStep('Error handling checkout completed:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(stripe: Stripe, supabaseClient: any, invoice: any) {
  logStep('Handling payment succeeded for invoice:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (!customer || customer.deleted) return;

    // Find user by email
    const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.users.find((u: any) => u.email === (customer as any).email);
    if (!user) return;

    // This is a renewal - add monthly tokens
    await processSubscriptionRenewal(supabaseClient, user.id, customer as any, subscription);
  }
}

async function handleSubscriptionEvent(stripe: Stripe, supabaseClient: any, subscription: any, eventType: string) {
  logStep('Handling subscription event for subscription:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (!customer || customer.deleted) return;

  // Find user by email
  const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
  if (userError) throw userError;

  const user = users.users.find((u: any) => u.email === (customer as any).email);
  if (!user) return;

  await processSubscription(supabaseClient, user.id, customer as any, subscription);
}

async function handleSubscriptionDeleted(stripe: Stripe, supabaseClient: any, subscription: any) {
  logStep('Handling subscription deleted for subscription:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (!customer || customer.deleted) return;

  // Find user by email
  const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
  if (userError) throw userError;

  const user = users.users.find((u: any) => u.email === (customer as any).email);
  if (!user) return;

  // Freeze tokens when subscription is deleted
  await freezeUserTokens(supabaseClient, user.id, subscription.id);
}

async function processSubscription(supabaseClient: any, userId: string, customer: any, subscription: any, metadata: any = null) {
  logStep('Processing subscription for user:', userId);
  
  try {
    // Determine plan details
    const priceId = subscription.items.data[0].price.id;
    const amount = subscription.items.data[0].price.unit_amount || 0;
    
    let planType = 'unknown';
    let monthlyLimit = 0;
    let tokensToAdd = 0;
    let subscriptionType = 'Unknown Plan';

    // Check if this is an upgrade from metadata
    const isUpgrade = metadata?.is_upgrade === 'true';
    const upgradeTokens = metadata?.upgrade_tokens ? parseInt(metadata.upgrade_tokens) : 0;

    // Determine plan based on amount
    if (amount === 900) { // $9.00 - Side-Gig
      planType = 'side-gig';
      monthlyLimit = 15;
      tokensToAdd = isUpgrade ? upgradeTokens : 15;
      subscriptionType = 'Side-Gig';
    } else if (amount >= 1900) { // $19.00+ - Full-Time
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
      tokensToAdd = isUpgrade ? upgradeTokens : monthlyLimit;
    }

    logStep('Plan details:', { planType, monthlyLimit, tokensToAdd, subscriptionType, isUpgrade });

    // Upsert subscription record
    const { error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        teacher_id: userId,
        email: customer.email,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
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
      logStep('Error upserting subscription:', subError);
      throw subError;
    }

    // Get current profile
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('available_tokens, total_tokens_received')
      .eq('id', userId)
      .single();

    const currentTokens = currentProfile?.available_tokens || 0;
    const totalReceived = currentProfile?.total_tokens_received || 0;

    // Update profile with new subscription data and tokens
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_worksheet_limit: monthlyLimit,
        available_tokens: currentTokens + tokensToAdd,
        total_tokens_received: totalReceived + tokensToAdd,
        is_tokens_frozen: false, // Unfreeze tokens on active subscription
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      logStep('Error updating profile:', profileError);
      throw profileError;
    }

    // Log subscription event
    const eventType = isUpgrade ? 'upgraded' : (currentProfile ? 'renewed' : 'created');
    await logSubscriptionEvent(supabaseClient, userId, eventType, {
      old_plan: currentProfile?.subscription_type,
      new_plan: subscriptionType,
      tokens_added: tokensToAdd,
      stripe_subscription_id: subscription.id
    });

    logStep('Successfully processed subscription for user:', userId);

  } catch (error) {
    logStep('Error processing subscription:', error);
    throw error;
  }
}

async function processSubscriptionRenewal(supabaseClient: any, userId: string, customer: any, subscription: any) {
  logStep('Processing subscription renewal for user:', userId);
  
  try {
    // Get subscription details to determine tokens to add
    const amount = subscription.items.data[0].price.unit_amount || 0;
    let tokensToAdd = 0;
    
    if (amount === 900) tokensToAdd = 15;
    else if (amount === 1900) tokensToAdd = 30;
    else if (amount === 3900) tokensToAdd = 60;
    else if (amount === 5900) tokensToAdd = 90;
    else if (amount === 7900) tokensToAdd = 120;

    // Get current profile
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('available_tokens, total_tokens_received')
      .eq('id', userId)
      .single();

    const currentTokens = currentProfile?.available_tokens || 0;
    const totalReceived = currentProfile?.total_tokens_received || 0;

    // Add renewal tokens
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        available_tokens: currentTokens + tokensToAdd,
        total_tokens_received: totalReceived + tokensToAdd,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      logStep('Error updating profile for renewal:', profileError);
      throw profileError;
    }

    // Log renewal event
    await logSubscriptionEvent(supabaseClient, userId, 'renewed', {
      tokens_added: tokensToAdd,
      stripe_subscription_id: subscription.id
    });

    logStep('Successfully processed renewal for user:', userId);

  } catch (error) {
    logStep('Error processing renewal:', error);
    throw error;
  }
}

async function freezeUserTokens(supabaseClient: any, userId: string, subscriptionId: string) {
  logStep('Freezing tokens for user:', userId);
  
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        is_tokens_frozen: true,
        subscription_type: 'Free Demo',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logStep('Error freezing tokens:', error);
      throw error;
    }

    // Log cancellation event
    await logSubscriptionEvent(supabaseClient, userId, 'cancelled', {
      stripe_subscription_id: subscriptionId
    });

    logStep('Successfully froze tokens for user:', userId);

  } catch (error) {
    logStep('Error freezing tokens:', error);
    throw error;
  }
}

async function logSubscriptionEvent(supabaseClient: any, userId: string, eventType: string, eventData: any) {
  try {
    await supabaseClient
      .from('subscription_events')
      .insert({
        teacher_id: userId,
        event_type: eventType,
        event_data: eventData,
        old_plan_type: eventData.old_plan,
        new_plan_type: eventData.new_plan,
        tokens_added: eventData.tokens_added || 0,
        stripe_event_id: eventData.stripe_subscription_id
      });
  } catch (error) {
    logStep('Error logging subscription event:', error);
  }
}
