
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
      throw new Error('Session ID is required');
    }

    logStep('Request body parsed', { session_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep('Retrieved checkout session', { sessionId: session.id, status: session.payment_status });

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Extract metadata from session
    const metadata = session.metadata || {};
    const { 
      target_plan_type, 
      target_plan_name, 
      target_monthly_limit, 
      subscription_id,
      upgrade_tokens 
    } = metadata;

    logStep('Extracted metadata', metadata);

    if (!subscription_id || !target_plan_type || !target_plan_name) {
      throw new Error('Missing required metadata from checkout session');
    }

    // Create price_id mapping
    const priceMapping: { [key: string]: string } = {
      'side-gig': 'price_side_gig', // Replace with actual Stripe price IDs
      'full-time-30': 'price_full_time_30',
      'full-time-60': 'price_full_time_60', 
      'full-time-90': 'price_full_time_90',
      'full-time-120': 'price_full_time_120',
    };

    // Determine the correct price_id based on target plan
    let targetPriceId: string;
    if (target_plan_type === 'side-gig') {
      targetPriceId = priceMapping['side-gig'];
    } else {
      const tokens = parseInt(target_monthly_limit);
      targetPriceId = priceMapping[`full-time-${tokens}`];
    }

    if (!targetPriceId) {
      throw new Error(`No price ID found for plan: ${target_plan_type}-${target_monthly_limit}`);
    }

    logStep('Determined target price ID', { targetPriceId, targetPlan: target_plan_name });

    // Update the Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
      items: [{
        id: (await stripe.subscriptions.retrieve(subscription_id)).items.data[0].id,
        price: targetPriceId,
      }],
      proration_behavior: 'none', // No additional charge since payment was already made
    });

    logStep('Updated Stripe subscription', { 
      subscriptionId: updatedSubscription.id, 
      newPriceId: targetPriceId,
      status: updatedSubscription.status 
    });

    // Use service role to update Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const monthlyLimit = parseInt(target_monthly_limit);
    const upgradeTokensNum = parseInt(upgrade_tokens || '0');

    // Update profiles table
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: target_plan_name,
        subscription_status: 'active',
        monthly_worksheet_limit: monthlyLimit,
        available_tokens: upgradeTokensNum > 0 ? `available_tokens + ${upgradeTokensNum}` : 'available_tokens',
        total_tokens_received: upgradeTokensNum > 0 ? `total_tokens_received + ${upgradeTokensNum}` : 'total_tokens_received',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      logStep('Error updating profile', profileError);
    } else {
      logStep('Profile updated successfully');
    }

    // Update subscriptions table
    const { error: subscriptionError } = await supabaseService
      .from('subscriptions')
      .update({
        subscription_type: target_plan_name,
        subscription_status: 'active',
        monthly_limit: monthlyLimit,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('teacher_id', user.id)
      .eq('stripe_subscription_id', subscription_id);

    if (subscriptionError) {
      logStep('Error updating subscription', subscriptionError);
    } else {
      logStep('Subscription table updated successfully');
    }

    // Log upgrade event
    const { error: eventError } = await supabaseService
      .from('subscription_events')
      .insert({
        teacher_id: user.id,
        email: user.email,
        event_type: 'upgraded',
        old_plan_type: metadata.old_plan_type || 'unknown',
        new_plan_type: target_plan_name,
        tokens_added: upgradeTokensNum,
        stripe_event_id: `upgrade_${session_id}`,
        event_data: {
          session_id,
          subscription_id,
          target_plan: target_plan_name,
          upgrade_tokens: upgradeTokensNum
        }
      });

    if (eventError) {
      logStep('Error logging upgrade event', eventError);
    } else {
      logStep('Upgrade event logged successfully');
    }

    logStep('Upgrade finalization completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription upgraded successfully',
        new_plan: target_plan_name,
        tokens_added: upgradeTokensNum
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    logStep('Error occurred', { 
      message: error.message, 
      stack: error.stack,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
