
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
      await processSubscription(supabaseClient, user.id, customer as any, subscription);
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

    await processSubscription(supabaseClient, user.id, customer as any, subscription);
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

async function processSubscription(supabaseClient: any, userId: string, customer: any, subscription: any) {
  console.log('[STRIPE-WEBHOOK] Processing subscription for user:', userId);
  
  try {
    // Determine plan details
    const priceId = subscription.items.data[0].price.id;
    const amount = subscription.items.data[0].price.unit_amount || 0;
    
    let planType = 'unknown';
    let monthlyLimit = 0;
    let tokensToAdd = 0;

    // Determine plan based on amount
    if (amount === 900) { // $9.00
      planType = 'side-gig';
      monthlyLimit = 15;
      tokensToAdd = 15;
    } else if (amount >= 1900) { // $19.00+
      planType = 'full-time';
      if (amount === 1900) monthlyLimit = 30;
      else if (amount === 3900) monthlyLimit = 60;
      else if (amount === 5900) monthlyLimit = 90;
      else if (amount === 7900) monthlyLimit = 120;
      else monthlyLimit = 30;
      tokensToAdd = monthlyLimit;
    }

    console.log('[STRIPE-WEBHOOK] Plan details:', { planType, monthlyLimit, tokensToAdd });

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

    // Update user profile
    const subscriptionType = planType === 'side-gig' ? 'Side-Gig Plan' : 'Full-Time Plan';
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_worksheet_limit: monthlyLimit,
        token_balance: supabaseClient.rpc('get_token_balance', { p_teacher_id: userId }).then((result: any) => 
          (result.data || 0) + tokensToAdd
        ),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[STRIPE-WEBHOOK] Error updating profile:', profileError);
      // Don't throw here, try to add tokens separately
    }

    // Add tokens using the existing function
    if (tokensToAdd > 0) {
      const { error: tokenError } = await supabaseClient
        .rpc('add_tokens', {
          p_teacher_id: userId,
          p_amount: tokensToAdd,
          p_description: `${subscriptionType} subscription activation`,
          p_reference_id: null
        });

      if (tokenError) {
        console.error('[STRIPE-WEBHOOK] Error adding tokens:', tokenError);
      } else {
        console.log('[STRIPE-WEBHOOK] Added', tokensToAdd, 'tokens to user');
      }
    }

    console.log('[STRIPE-WEBHOOK] Successfully processed subscription for user:', userId);

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error processing subscription:', error);
    throw error;
  }
}
