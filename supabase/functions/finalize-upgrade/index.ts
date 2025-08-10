
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FINALIZE-UPGRADE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const { session_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const user = userData.user;
    logStep('User authenticated', { email: user.email });

    logStep('Processing upgrade for session', { session_id });

    const stripe = new Stripe(Deno.env.get('Stripe_Secret_Key') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep('Retrieved checkout session', {
      sessionId: session_id,
      metadata: session.metadata
    });

    // Check if this is actually an upgrade session
    if (session.metadata?.action !== 'upgrade') {
      logStep('Not an upgrade session');
      throw new Error('Invalid session - not an upgrade');
    }

    // Extract upgrade parameters from metadata
    const subscriptionId = session.metadata.subscription_id;
    const targetPlanType = session.metadata.target_plan_type;
    const targetPlanName = session.metadata.target_plan_name;
    const targetPlanPrice = parseInt(session.metadata.target_plan_price);
    const targetMonthlyLimit = parseInt(session.metadata.target_monthly_limit);
    const upgradeTokens = parseInt(session.metadata.upgrade_tokens);

    logStep('Upgrade parameters', {
      subscriptionId,
      targetPlanType,
      targetPlanName,
      targetPlanPrice,
      targetMonthlyLimit,
      upgradeTokens
    });

    // Check if this session has already been processed
    const { data: existingSession } = await supabaseService
      .from('processed_upgrade_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (existingSession) {
      logStep('Session already processed', existingSession);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Session already processed',
          data: existingSession
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current profile data to capture old_plan_type
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('subscription_type, available_tokens, total_tokens_received')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const oldPlanType = profile.subscription_type || 'Unknown';
    logStep('Current profile data', {
      oldPlanType,
      currentAvailableTokens: profile.available_tokens,
      currentTotalReceived: profile.total_tokens_received
    });

    // Update Stripe subscription
    logStep('Updating Stripe subscription', {
      subscriptionId,
      newPriceId: getPriceIdForPlan(targetPlanName, targetPlanPrice)
    });

    // Get existing prices to find the right one
    const prices = await stripe.prices.list({
      product: 'prod_RRBthRz3OJKo5m', // Your product ID
      active: true,
      limit: 100
    });

    let targetPriceId = null;
    for (const price of prices.data) {
      const priceAmountInDollars = price.unit_amount ? price.unit_amount / 100 : 0;
      if (priceAmountInDollars === targetPlanPrice && 
          price.nickname?.includes(targetMonthlyLimit.toString())) {
        targetPriceId = price.id;
        break;
      }
    }

    if (!targetPriceId) {
      throw new Error(`Price not found for plan: ${targetPlanName} at $${targetPlanPrice}`);
    }

    logStep('Searching for existing price', {
      targetPlanName,
      targetPlanPrice
    });

    logStep('Using existing price', {
      priceId: targetPriceId,
      amount: targetPlanPrice * 100
    });

    // Get current subscription to verify before update
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep('Current subscription retrieved', {
      id: currentSubscription.id,
      status: currentSubscription.status,
      currentPriceId: currentSubscription.items.data[0]?.price?.id,
      currentAmount: currentSubscription.items.data[0]?.price?.unit_amount
    });

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: targetPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    logStep('Subscription updated in Stripe successfully', {
      subscriptionId,
      newPriceId: targetPriceId,
      newAmount: updatedSubscription.items.data[0]?.price?.unit_amount,
      status: updatedSubscription.status,
      currentPeriodEnd: updatedSubscription.current_period_end
    });

    // Calculate new token amounts
    const currentAvailable = profile.available_tokens || 0;
    const currentTotal = profile.total_tokens_received || 0;
    const newAvailableTokens = currentAvailable + upgradeTokens;
    const newTotalReceived = currentTotal + upgradeTokens;

    logStep('Token calculations', {
      currentAvailable,
      currentTotal,
      upgradeTokens,
      newAvailableTokens,
      newTotalReceived
    });

    // Update profile with new subscription data and tokens
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: getSubscriptionTypeFromPrice(updatedSubscription.items.data[0]?.price?.unit_amount || 0),
        subscription_status: updatedSubscription.status,
        monthly_worksheet_limit: targetMonthlyLimit,
        available_tokens: newAvailableTokens,
        total_tokens_received: newTotalReceived,
        subscription_expires_at: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logStep('ERROR: Failed to update profile', updateError);
      throw updateError;
    }

    logStep('Profile updated successfully');

    // Update subscriptions table
    const { error: subError } = await supabaseService
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        email: user.email,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: updatedSubscription.customer as string,
        subscription_status: updatedSubscription.status,
        subscription_type: getSubscriptionTypeFromPrice(updatedSubscription.items.data[0]?.price?.unit_amount || 0),
        monthly_limit: targetMonthlyLimit,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'teacher_id',
        ignoreDuplicates: false 
      });

    if (subError) {
      logStep('ERROR: Failed to update subscriptions table', subError);
      throw subError;
    }

    logStep('Subscriptions table updated successfully');

    // Record processed session to prevent duplicate processing
    const { error: sessionError } = await supabaseService
      .from('processed_upgrade_sessions')
      .insert({
        session_id: session_id,
        teacher_id: user.id,
        tokens_added: upgradeTokens,
        old_plan_type: oldPlanType,
        new_plan_type: targetPlanName
      });

    if (sessionError) {
      logStep('ERROR: Failed to log processed session', sessionError);
      throw sessionError;
    }

    logStep('Processed session logged successfully');

    // Add token transaction
    const { error: transactionError } = await supabaseService
      .from('token_transactions')
      .insert({
        teacher_id: user.id,
        transaction_type: 'purchase',
        amount: upgradeTokens,
        description: `Upgrade to ${targetPlanName}`,
        reference_id: null
      });

    if (transactionError) {
      logStep('ERROR: Failed to log token transaction', transactionError);
      throw transactionError;
    }

    logStep('Token transaction logged successfully');

    // USUNIĘTE: Logowanie subscription_events
    // Pozostawiamy to tylko stripe-webhook aby uniknąć konfliktów

    const result = {
      newPlan: targetPlanName,
      tokensAdded: upgradeTokens,
      newAvailableTokens,
      stripeSubscriptionUpdated: true,
      supabaseDataSynced: true
    };

    logStep('Upgrade finalized successfully', result);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logStep('Error occurred', { 
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getPriceIdForPlan(planName: string, priceInDollars: number): string {
  // This would need to map to actual Stripe price IDs
  const priceMapping: { [key: string]: string } = {
    'Side-Gig_9': 'price_1Rr4XjH4Sb5mBNfbWD8VBfFg',
    'Full-Time Plan (30 worksheets)_19': 'price_1Rr4apH4Sb5mBNfbZCKfQyov', 
    'Full-Time Plan (60 worksheets)_39': 'price_1RuA1gH4Sb5mBNfbCdkhQkhn',
    'Full-Time Plan (90 worksheets)_59': 'price_1RuA2QH4Sb5mBNfb8QBdKFMV',
    'Full-Time Plan (120 worksheets)_79': 'price_1Ru9x2H4Sb5mBNfbbVRTDR9V'
  };
  
  const key = `${planName}_${priceInDollars}`;
  return priceMapping[key] || '';
}

function getSubscriptionTypeFromPrice(priceAmount: number): string {
  if (priceAmount === 900) return 'Side-Gig';
  if (priceAmount === 1900) return 'Full-Time 30';
  if (priceAmount === 3900) return 'Full-Time 60';
  if (priceAmount === 5900) return 'Full-Time 90';
  if (priceAmount === 7900) return 'Full-Time 120';
  return 'Unknown';
}
