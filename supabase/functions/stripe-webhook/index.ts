
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep('Webhook received');
  
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  if (!signature) {
    logStep('No signature provided');
    return new Response('No signature', { status: 400 });
  }

  const stripeKey = Deno.env.get('Stripe_Secret_Key');
  if (!stripeKey) {
    logStep('Stripe key not configured');
    return new Response('Stripe key not configured', { status: 500 });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    logStep('Webhook secret not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep('Event verified', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase, stripe);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase, stripe);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase, stripe);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    logStep('Webhook error', { message: error.message });
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any, stripe: Stripe) {
  logStep('Processing checkout completion', { sessionId: session.id });
  
  if (!session.subscription) {
    logStep('No subscription in session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  await processSubscription(subscription, supabase, stripe);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any, stripe: Stripe) {
  logStep('Processing invoice payment', { invoiceId: invoice.id });
  
  if (!invoice.subscription) {
    logStep('No subscription in invoice');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  // Handle token rollover when billing period renews
  if (invoice.billing_reason === 'subscription_cycle') {
    await handleTokenRollover(subscription, supabase, stripe);
  }
  
  await processSubscription(subscription, supabase, stripe);
}

async function handleTokenRollover(subscription: Stripe.Subscription, supabase: any, stripe: Stripe) {
  logStep('Processing token rollover', { subscriptionId: subscription.id });
  
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    logStep('Customer not found or deleted');
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, monthly_worksheet_limit, monthly_worksheets_used, token_balance')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    logStep('Profile not found', { email: customer.email });
    return;
  }

  const monthlyLimit = profile.monthly_worksheet_limit || 0;
  const monthlyUsed = profile.monthly_worksheets_used || 0;
  const unusedTokens = Math.max(0, monthlyLimit - monthlyUsed);

  if (unusedTokens > 0) {
    logStep('Rolling over unused tokens', { unusedTokens, userId: profile.id });
    
    // Add unused tokens to token_balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        token_balance: profile.token_balance + unusedTokens,
        monthly_worksheets_used: 0 // Reset monthly usage
      })
      .eq('id', profile.id);

    if (updateError) {
      logStep('Error updating token balance', { error: updateError });
    } else {
      // Log the rollover transaction
      await supabase
        .from('token_transactions')
        .insert({
          teacher_id: profile.id,
          transaction_type: 'rollover',
          amount: unusedTokens,
          description: `Monthly rollover: ${unusedTokens} unused tokens carried forward`
        });
      
      logStep('Token rollover completed', { userId: profile.id, rolledOverTokens: unusedTokens });
    }
  } else {
    // Just reset monthly usage
    await supabase
      .from('profiles')
      .update({ monthly_worksheets_used: 0 })
      .eq('id', profile.id);
    
    logStep('Monthly usage reset (no rollover)', { userId: profile.id });
  }
}

async function processSubscription(subscription: Stripe.Subscription, supabase: any, stripe: Stripe) {
  logStep('Processing subscription', { subscriptionId: subscription.id });
  
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    logStep('Customer not found or deleted');
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const price = await stripe.prices.retrieve(priceId);
  
  const planType = getPlanType(price.unit_amount || 0);
  const monthlyLimit = getMonthlyLimit(price.unit_amount || 0);
  
  // Update or create subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      teacher_id: (customer as any).metadata?.supabase_user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      plan_type: planType,
      monthly_limit: monthlyLimit,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

  if (subscriptionError) {
    logStep('Error updating subscription', { error: subscriptionError });
    return;
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_type: planType,
      subscription_status: subscription.status,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      monthly_worksheet_limit: monthlyLimit,
    })
    .eq('email', customer.email);

  if (profileError) {
    logStep('Error updating profile', { error: profileError });
  } else {
    logStep('Subscription processed successfully', { email: customer.email, planType, monthlyLimit });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  logStep('Processing subscription deletion', { subscriptionId: subscription.id });
  
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  if (subscriptionError) {
    logStep('Error updating subscription status', { error: subscriptionError });
  }

  // Update profile to remove subscription
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_type: null,
      subscription_status: null,
      subscription_expires_at: null,
      monthly_worksheet_limit: null,
    })
    .eq('id', (await supabase.from('subscriptions').select('teacher_id').eq('stripe_subscription_id', subscription.id).single()).data?.teacher_id);

  if (profileError) {
    logStep('Error updating profile for canceled subscription', { error: profileError });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any, stripe: Stripe) {
  logStep('Processing subscription update', { subscriptionId: subscription.id });
  await processSubscription(subscription, supabase, stripe);
}

function getPlanType(unitAmount: number): string {
  if (unitAmount <= 900) return 'Side-Gig Plan';
  if (unitAmount <= 1900) return 'Full-Time Plan (30 worksheets)';
  if (unitAmount <= 3900) return 'Full-Time Plan (60 worksheets)';
  if (unitAmount <= 5900) return 'Full-Time Plan (90 worksheets)';
  return 'Full-Time Plan (120 worksheets)';
}

function getMonthlyLimit(unitAmount: number): number {
  if (unitAmount <= 900) return 15;
  if (unitAmount <= 1900) return 30;
  if (unitAmount <= 3900) return 60;
  if (unitAmount <= 5900) return 90;
  return 120;
}
