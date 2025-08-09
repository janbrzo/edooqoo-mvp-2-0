
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

    // Initialize Supabase with anon key for user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep('User error', userError);
      throw userError;
    }

    const user = userData.user;
    if (!user?.email) {
      logStep('User not authenticated');
      throw new Error('User not authenticated');
    }

    logStep('User authenticated', { email: user.email });

    // Parse request body
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      logStep('Missing session_id');
      throw new Error('Session ID is required');
    }

    logStep('Processing upgrade for session', { session_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get checkout session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep('Retrieved checkout session', { sessionId: session.id, metadata: session.metadata });

    if (!session.metadata?.action || session.metadata.action !== 'upgrade') {
      logStep('Not an upgrade session');
      throw new Error('Invalid session - not an upgrade');
    }

    const subscriptionId = session.metadata.subscription_id;
    const targetPlanType = session.metadata.target_plan_type;
    const targetPlanName = session.metadata.target_plan_name;
    const targetPlanPrice = parseFloat(session.metadata.target_plan_price || '0');
    const targetMonthlyLimit = parseInt(session.metadata.target_monthly_limit || '0');
    const upgradeTokens = parseInt(session.metadata.upgrade_tokens || '0');

    if (!subscriptionId) {
      logStep('Missing subscription ID in metadata');
      throw new Error('No subscription ID found in session metadata');
    }

    logStep('Upgrade parameters', {
      subscriptionId,
      targetPlanType,
      targetPlanName,
      targetPlanPrice,
      targetMonthlyLimit,
      upgradeTokens
    });

    // Get current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep('Retrieved current subscription', { 
      id: currentSubscription.id,
      status: currentSubscription.status,
      currentPriceAmount: currentSubscription.items.data[0].price.unit_amount
    });

    // Update subscription in Stripe with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price_data: {
          currency: 'usd',
          product_data: {
            name: targetPlanName,
            description: `${targetMonthlyLimit} worksheets per month`,
          },
          unit_amount: targetPlanPrice * 100,
          recurring: {
            interval: 'month',
          },
        },
      }],
      proration_behavior: 'none', // No additional prorating since we handled it with one-time payment
      billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
    });

    logStep('Subscription updated in Stripe', { 
      subscriptionId: updatedSubscription.id,
      newAmount: targetPlanPrice * 100,
      status: updatedSubscription.status
    });

    // Use service role to update Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get current profile data
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, available_tokens, total_tokens_received')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logStep('ERROR: User profile not found', { userId: user.id, error: profileError });
      throw new Error(`User profile not found`);
    }

    // Calculate new token amounts
    const newAvailableTokens = profile.available_tokens + upgradeTokens;
    const newTotalReceived = (profile.total_tokens_received || 0) + upgradeTokens;

    logStep('Token calculations', {
      currentAvailable: profile.available_tokens,
      currentTotal: profile.total_tokens_received,
      upgradeTokens,
      newAvailableTokens,
      newTotalReceived
    });

    // Update profile with new plan details and tokens
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: targetPlanName,
        subscription_status: 'active', // Upgrade makes subscription active
        monthly_worksheet_limit: targetMonthlyLimit,
        available_tokens: newAvailableTokens,
        total_tokens_received: newTotalReceived,
        is_tokens_frozen: false,
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
        stripe_customer_id: session.customer as string,
        subscription_status: 'active',
        subscription_type: targetPlanName,
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

    // Add token transaction record
    const { error: transactionError } = await supabaseService
      .from('token_transactions')
      .insert({
        teacher_id: user.id,
        transaction_type: 'purchase',
        amount: upgradeTokens,
        description: `Upgrade to ${targetPlanName} - tokens added`,
        reference_id: null
      });

    if (transactionError) {
      logStep('WARNING: Failed to log token transaction', transactionError);
    } else {
      logStep('Token transaction logged successfully');
    }

    logStep('Upgrade finalized successfully', {
      newPlan: targetPlanName,
      tokensAdded: upgradeTokens,
      newAvailableTokens
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription_type: targetPlanName,
        tokens_added: upgradeTokens,
        new_available_tokens: newAvailableTokens
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    logStep('Error occurred', { 
      message: error.message, 
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
