
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[STRIPE-WEBHOOK] Function started');

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      console.error('[STRIPE-WEBHOOK] Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('[STRIPE-WEBHOOK] No stripe signature');
      throw new Error('No stripe signature');
    }

    // Parse webhook body
    const body = await req.text();
    console.log('[STRIPE-WEBHOOK] Received webhook body length:', body.length);

    // Verify webhook signature (in production, use webhook endpoint secret)
    let event;
    try {
      // For now, just parse the event - in production you'd verify with webhook secret
      event = JSON.parse(body);
      console.log('[STRIPE-WEBHOOK] Event type:', event.type);
    } catch (err) {
      console.error('[STRIPE-WEBHOOK] Invalid JSON:', err);
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
        console.log('[STRIPE-WEBHOOK] Processing checkout.session.completed');
        await handleCheckoutCompleted(stripe, supabaseClient, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('[STRIPE-WEBHOOK] Processing invoice.payment_succeeded');
        await handlePaymentSucceeded(stripe, supabaseClient, event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('[STRIPE-WEBHOOK] Processing subscription event:', event.type);
        await handleSubscriptionEvent(stripe, supabaseClient, event.data.object);
        break;
      
      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
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
  console.log('[STRIPE-WEBHOOK] Handling checkout completed for session:', session.id);
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer as string);
    if (!customer || customer.deleted) {
      throw new Error('Customer not found');
    }

    console.log('[STRIPE-WEBHOOK] Customer email:', (customer as any).email);

    // Find user by email
    const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.users.find((u: any) => u.email === (customer as any).email);
    if (!user) {
      console.error('[STRIPE-WEBHOOK] User not found for email:', (customer as any).email);
      return;
    }

    console.log('[STRIPE-WEBHOOK] Found user:', user.id);

    // If this is a subscription checkout, get subscription details
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await processSubscription(supabaseClient, user.id, customer as any, subscription, session.metadata);
    }

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling checkout completed:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(stripe: Stripe, supabaseClient: any, invoice: any) {
  console.log('[STRIPE-WEBHOOK] Handling payment succeeded for invoice:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (!customer || customer.deleted) return;

    // Find user by email
    const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.users.find((u: any) => u.email === (customer as any).email);
    if (!user) return;

    // This is a renewal, handle rollover tokens
    await processSubscriptionRenewal(supabaseClient, user.id, customer as any, subscription);
  }
}

async function handleSubscriptionEvent(stripe: Stripe, supabaseClient: any, subscription: any) {
  console.log('[STRIPE-WEBHOOK] Handling subscription event for subscription:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  if (!customer || customer.deleted) return;

  // Find user by email
  const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
  if (userError) throw userError;

  const user = users.users.find((u: any) => u.email === (customer as any).email);
  if (!user) return;

  await processSubscription(supabaseClient, user.id, customer as any, subscription);
}

async function processSubscription(supabaseClient: any, userId: string, customer: any, subscription: any, metadata: any = null) {
  console.log('[STRIPE-WEBHOOK] Processing subscription for user:', userId);
  
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

    // Determine plan based on amount with detailed naming
    if (amount === 900) { // $9.00
      planType = 'side-gig';
      monthlyLimit = 15;
      tokensToAdd = isUpgrade ? upgradeTokens : 15;
      subscriptionType = 'Side-Gig';
    } else if (amount >= 1900) { // $19.00+
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

    console.log('[STRIPE-WEBHOOK] Plan details:', { planType, monthlyLimit, tokensToAdd, subscriptionType, isUpgrade });

    // Upsert subscription record
    const { error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        teacher_id: userId,
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
      console.error('[STRIPE-WEBHOOK] Error upserting subscription:', subError);
      throw subError;
    }

    console.log('[STRIPE-WEBHOOK] Subscription record saved');

    // Get current token balance before updating
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('token_balance')
      .eq('id', userId)
      .single();

    const currentTokens = currentProfile?.token_balance || 0;
    const newTokenBalance = currentTokens + tokensToAdd;

    // Update user profile with ALL subscription details and new token balance
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_worksheet_limit: monthlyLimit,
        monthly_worksheets_used: 0, // Reset monthly usage for new subscription
        token_balance: newTokenBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[STRIPE-WEBHOOK] Error updating profile:', profileError);
      throw profileError;
    }

    console.log('[STRIPE-WEBHOOK] Profile updated with:', {
      subscriptionType,
      monthlyLimit,
      newTokenBalance,
      monthlyWorksheetsUsed: 0
    });

    // Add tokens transaction record
    if (tokensToAdd > 0) {
      const { error: tokenError } = await supabaseClient
        .from('token_transactions')
        .insert({
          teacher_id: userId,
          transaction_type: 'purchase',
          amount: tokensToAdd,
          description: isUpgrade ? `${subscriptionType} upgrade (+${tokensToAdd} tokens)` : `${subscriptionType} subscription activation`,
          reference_id: null
        });

      if (tokenError) {
        console.error('[STRIPE-WEBHOOK] Error adding token transaction:', tokenError);
      } else {
        console.log('[STRIPE-WEBHOOK] Added token transaction for', tokensToAdd, 'tokens');
      }
    }

    console.log('[STRIPE-WEBHOOK] Successfully processed subscription for user:', userId);

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error processing subscription:', error);
    throw error;
  }
}

async function processSubscriptionRenewal(supabaseClient: any, userId: string, customer: any, subscription: any) {
  console.log('[STRIPE-WEBHOOK] Processing subscription renewal for user:', userId);
  
  try {
    // Get current profile data
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('monthly_worksheet_limit, monthly_worksheets_used, rollover_tokens')
      .eq('id', userId)
      .single();

    if (!currentProfile) {
      console.error('[STRIPE-WEBHOOK] Profile not found for user:', userId);
      return;
    }

    const monthlyLimit = currentProfile.monthly_worksheet_limit || 0;
    const monthlyUsed = currentProfile.monthly_worksheets_used || 0;
    const currentRollover = currentProfile.rollover_tokens || 0;

    // Calculate unused worksheets to carry forward
    const unusedWorksheets = Math.max(0, monthlyLimit - monthlyUsed);
    const newRolloverTokens = currentRollover + unusedWorksheets;

    console.log('[STRIPE-WEBHOOK] Rollover calculation:', {
      monthlyLimit,
      monthlyUsed,
      unusedWorksheets,
      currentRollover,
      newRolloverTokens
    });

    // Update profile with rollover tokens and reset monthly usage
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        rollover_tokens: newRolloverTokens,
        monthly_worksheets_used: 0, // Reset for new period
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[STRIPE-WEBHOOK] Error updating profile for renewal:', profileError);
      throw profileError;
    }

    // Log rollover transaction if there are unused worksheets
    if (unusedWorksheets > 0) {
      const { error: tokenError } = await supabaseClient
        .from('token_transactions')
        .insert({
          teacher_id: userId,
          transaction_type: 'rollover',
          amount: unusedWorksheets,
          description: `${unusedWorksheets} unused monthly worksheets carried forward as rollover tokens`,
          reference_id: null
        });

      if (tokenError) {
        console.error('[STRIPE-WEBHOOK] Error adding rollover transaction:', tokenError);
      } else {
        console.log('[STRIPE-WEBHOOK] Added rollover transaction for', unusedWorksheets, 'tokens');
      }
    }

    console.log('[STRIPE-WEBHOOK] Successfully processed renewal for user:', userId);

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error processing renewal:', error);
    throw error;
  }
}
