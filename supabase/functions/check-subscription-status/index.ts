
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('ERROR: Missing Stripe secret key');
      throw new Error('Stripe secret key not configured');
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header');
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) {
      logStep('Authentication error', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      logStep('User not authenticated');
      throw new Error('User not authenticated or email not available');
    }

    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep('No customer found, updating unsubscribed state');
      await supabaseService.from('profiles').upsert({
        id: user.id,
        email: user.email,
        subscription_type: 'Free Demo',
        subscription_status: null,
        subscription_expires_at: null,
        monthly_worksheet_limit: null,
        is_tokens_frozen: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      await supabaseService.from('subscriptions').upsert({
        teacher_id: user.id,
        email: user.email,
        stripe_subscription_id: '',
        stripe_customer_id: '',
        subscription_status: 'inactive',
        subscription_type: 'free-demo',
        monthly_limit: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'teacher_id' });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_type: 'Free Demo',
        subscription_status: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    let hasActiveSub = false;
    let subscriptionType = 'Free Demo';
    let subscriptionEnd = null;
    let subscriptionStatus = null;
    let currentPeriodStart = null;
    let currentPeriodEnd = null;
    let stripeSubscriptionId = '';

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      
      // NAPRAWIONE: Determine status - zachowaj active_cancelled z profilu
      const { data: currentProfile } = await supabaseService
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          subscriptionStatus = 'active_cancelled';
          hasActiveSub = true; // NAPRAWIONE: active_cancelled nadal oznacza aktywną subskrypcję
        } else {
          // NAPRAWIONE: Nie nadpisuj active_cancelled na active - reguła "no downgrade"
          if (currentProfile?.subscription_status === 'active_cancelled') {
            subscriptionStatus = 'active_cancelled';
          } else {
            subscriptionStatus = 'active';
          }
          hasActiveSub = true;
        }
      } else if (subscription.status === 'cancelled') {
        subscriptionStatus = 'cancelled';
        hasActiveSub = false;
        subscriptionType = 'Inactive';
      } else {
        subscriptionStatus = subscription.status;
        hasActiveSub = false;
      }

      if (hasActiveSub) {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        currentPeriodEnd = subscriptionEnd;
        
        logStep('Found subscription', { 
          subscriptionId: subscription.id, 
          status: subscription.status,
          computedStatus: subscriptionStatus,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          endDate: subscriptionEnd 
        });

        // Determine subscription type from price
        const priceId = subscription.items.data[0].price.id;
        
        // NAPRAWIONE: Mapowanie na podstawie price_ID
        if (priceId === 'price_1Rr4ajH4Sb5mBNfbqE8tB3Il') { // Side-Gig 15
          subscriptionType = 'Side-Gig';
        } else if (priceId === 'price_1Rr4apH4Sb5mBNfbZCKfQyov') { // Full-Time 30
          subscriptionType = 'Full-Time 30';
        } else if (priceId === 'price_1RuA1gH4Sb5mBNfbCdkhQkhn') { // Full-Time 60
          subscriptionType = 'Full-Time 60';
        } else if (priceId === 'price_1Rr4asH4Sb5mBNfbtF4eGtWF') { // Full-Time 90
          subscriptionType = 'Full-Time 90';
        } else if (priceId === 'price_1Ru9x2H4Sb5mBNfbbVRTDR9V') { // Full-Time 120
          subscriptionType = 'Full-Time 120';
        } else {
          // Fallback dla starych subskrypcji na podstawie amount
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          if (amount === 900) {
            subscriptionType = 'Side-Gig';
          } else if (amount === 1900) {
            subscriptionType = 'Full-Time 30';
          } else if (amount === 3900) {
            subscriptionType = 'Full-Time 60';
          } else if (amount === 5900) {
            subscriptionType = 'Full-Time 90';
          } else if (amount === 7900) {
            subscriptionType = 'Full-Time 120';
          } else {
            subscriptionType = 'Unknown';
          }
        }

        logStep('Determined subscription type', { priceId, subscriptionType });
      } else {
        logStep('No active subscription found');
      }
    } else {
      logStep('No subscriptions found for customer');
    }

    logStep('Computed status', { 
      stripeStatus: subscriptions.data[0]?.status || 'none',
      cancelAtPeriodEnd: subscriptions.data[0]?.cancel_at_period_end || false,
      newSubscriptionStatus: subscriptionStatus
    });

    // Update profile
    await supabaseService.from('profiles').upsert({
      id: user.id,
      email: user.email,
      subscription_type: subscriptionType,
      subscription_status: subscriptionStatus,
      subscription_expires_at: subscriptionEnd,
      is_tokens_frozen: !hasActiveSub,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // NAPRAWIONE: Update subscriptions table z poprawnymi wartościami
    await supabaseService.from('subscriptions').upsert({
      teacher_id: user.id,
      email: user.email,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: customerId,
      subscription_status: subscriptionStatus || 'inactive', // NAPRAWIONE: zachowaj active_cancelled
      subscription_type: subscriptionType.toLowerCase().replace(/\s+/g, '-').replace(/full-time-/g, 'full-time-'),
      monthly_limit: hasActiveSub ? (
        subscriptionType === 'Side-Gig' ? 15 :
        subscriptionType === 'Full-Time 30' ? 30 :
        subscriptionType === 'Full-Time 60' ? 60 :
        subscriptionType === 'Full-Time 90' ? 90 :
        subscriptionType === 'Full-Time 120' ? 120 : 0
      ) : 0,
      current_period_start: currentPeriodStart || new Date().toISOString(),
      current_period_end: currentPeriodEnd || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id' });

    logStep('Subscriptions table upserted successfully', { teacherId: user.id });

    logStep('Successfully synced subscription data');

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_type: subscriptionType,
      subscription_status: subscriptionStatus,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in check-subscription', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
