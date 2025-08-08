
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
    console.log('[STRIPE-WEBHOOK] Processing webhook event');

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey || !webhookSecret) {
      throw new Error('Missing Stripe configuration');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      throw new Error('No Stripe signature header');
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('[STRIPE-WEBHOOK] Event type:', event.type, 'Event ID:', event.id);

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[STRIPE-WEBHOOK] Processing checkout.session.completed for:', session.customer_email);
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await updateSubscriptionData(supabaseService, subscription, session.customer_email || '');
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[STRIPE-WEBHOOK] Processing subscription event for customer:', subscription.customer);
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = (customer as Stripe.Customer).email || '';
        
        await updateSubscriptionData(supabaseService, subscription, customerEmail);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[STRIPE-WEBHOOK] Processing subscription deletion for customer:', subscription.customer);
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = (customer as Stripe.Customer).email || '';
        
        await handleSubscriptionCancellation(supabaseService, subscription, customerEmail);
        break;
      }

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
        break;
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function updateSubscriptionData(supabaseService: any, subscription: Stripe.Subscription, customerEmail: string) {
  console.log('[STRIPE-WEBHOOK] Updating subscription data for:', customerEmail);

  // Get user by email
  const { data: profile } = await supabaseService
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!profile) {
    console.error('[STRIPE-WEBHOOK] No profile found for email:', customerEmail);
    return;
  }

  const teacherId = profile.id;
  
  // Get subscription details
  const amount = subscription.items.data[0].price.unit_amount || 0;
  
  let subscriptionType = 'Unknown Plan';
  let monthlyLimit = 0;

  if (amount === 900) {
    subscriptionType = 'Side-Gig';
    monthlyLimit = 15;
  } else if (amount >= 1900) {
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

  // Determine subscription status based on cancel_at_period_end and status
  let finalStatus = subscription.status;
  if (subscription.status === 'active' && subscription.cancel_at_period_end) {
    finalStatus = 'active_cancelled';
  }

  console.log('[STRIPE-WEBHOOK] Subscription details:', {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    finalStatus,
    subscriptionType,
    monthlyLimit
  });

  // Update subscription record - FIXED COLUMN NAMES
  const { error: subError } = await supabaseService
    .from('subscriptions')
    .upsert({
      teacher_id: teacherId,
      email: customerEmail,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      subscription_status: finalStatus, // FIXED: was 'status'
      subscription_type: subscriptionType, // FIXED: was 'plan_type'
      monthly_limit: monthlyLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'teacher_id', // Now works thanks to unique constraint
      ignoreDuplicates: false 
    });

  if (subError) {
    console.error('[STRIPE-WEBHOOK] Error updating subscription:', subError);
  } else {
    console.log('[STRIPE-WEBHOOK] Successfully updated subscriptions table');
  }

  // Update profile
  const { error: profileError } = await supabaseService
    .from('profiles')
    .update({
      subscription_type: subscriptionType,
      subscription_status: finalStatus,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      monthly_worksheet_limit: monthlyLimit,
      is_tokens_frozen: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId);

  if (profileError) {
    console.error('[STRIPE-WEBHOOK] Error updating profile:', profileError);
  } else {
    console.log('[STRIPE-WEBHOOK] Successfully updated profiles table');
  }

  // Log subscription event
  await supabaseService
    .from('subscription_events')
    .insert({
      teacher_id: teacherId,
      email: customerEmail,
      event_type: subscription.status === 'active' ? 'renewed' : 'updated',
      stripe_event_id: subscription.id,
      new_plan_type: subscriptionType,
      event_data: { 
        subscription_id: subscription.id,
        status: finalStatus,
        cancel_at_period_end: subscription.cancel_at_period_end 
      }
    });
}

async function handleSubscriptionCancellation(supabaseService: any, subscription: Stripe.Subscription, customerEmail: string) {
  console.log('[STRIPE-WEBHOOK] Handling subscription cancellation for:', customerEmail);

  // Get user by email
  const { data: profile } = await supabaseService
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!profile) {
    console.error('[STRIPE-WEBHOOK] No profile found for email:', customerEmail);
    return;
  }

  const teacherId = profile.id;

  // Update subscription status to cancelled
  const { error: subError } = await supabaseService
    .from('subscriptions')
    .update({
      subscription_status: 'cancelled', // FIXED: was 'status'
      updated_at: new Date().toISOString()
    })
    .eq('teacher_id', teacherId);

  if (subError) {
    console.error('[STRIPE-WEBHOOK] Error updating subscription status:', subError);
  }

  // Update profile and freeze tokens
  const { error: profileError } = await supabaseService
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      is_tokens_frozen: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId);

  if (profileError) {
    console.error('[STRIPE-WEBHOOK] Error updating profile:', profileError);
  }

  // Log subscription event
  await supabaseService
    .from('subscription_events')
    .insert({
      teacher_id: teacherId,
      email: customerEmail,
      event_type: 'cancelled',
      stripe_event_id: subscription.id,
      event_data: { subscription_id: subscription.id, status: 'cancelled' }
    });
}
