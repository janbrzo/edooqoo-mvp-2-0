
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

    // KLUCZOWA CZĘŚĆ: Znajdź lub utwórz stabilny price_id w Stripe
    let targetPriceId: string;
    
    // Sprawdź czy istnieje już produkt z odpowiednią ceną
    const products = await stripe.products.list({ 
      limit: 100,
      expand: ['data.default_price']
    });
    
    logStep('Searching for existing price', { targetPlanName, targetPlanPrice });
    
    // Szukaj istniejącej ceny
    const prices = await stripe.prices.list({ 
      limit: 100,
      recurring: { interval: 'month' },
      type: 'recurring'
    });
    
    const existingPrice = prices.data.find(price => 
      price.unit_amount === targetPlanPrice * 100 && 
      price.currency === 'usd' &&
      price.recurring?.interval === 'month'
    );
    
    if (existingPrice) {
      targetPriceId = existingPrice.id;
      logStep('Using existing price', { priceId: targetPriceId, amount: existingPrice.unit_amount });
    } else {
      // Utwórz nowy produkt i cenę
      logStep('Creating new product and price');
      
      const product = await stripe.products.create({
        name: targetPlanName,
        description: `${targetMonthlyLimit} worksheets per month`,
      });
      
      const price = await stripe.prices.create({
        currency: 'usd',
        product: product.id,
        unit_amount: targetPlanPrice * 100,
        recurring: {
          interval: 'month',
        },
      });
      
      targetPriceId = price.id;
      logStep('Created new price', { priceId: targetPriceId, productId: product.id });
    }

    // KLUCZOWA CZĘŚĆ: Aktualizuj subskrypcję w Stripe
    logStep('Updating Stripe subscription', { subscriptionId, newPriceId: targetPriceId });
    
    // Pobierz aktualną subskrypcję
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep('Current subscription retrieved', { 
      id: currentSubscription.id,
      status: currentSubscription.status,
      currentPriceId: currentSubscription.items.data[0].price.id,
      currentAmount: currentSubscription.items.data[0].price.unit_amount
    });

    // Aktualizuj subskrypcję z nowym price_id
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: targetPriceId, // Użyj stabilnego price_id zamiast price_data
      }],
      proration_behavior: 'none', // Bez dodatkowego proration - już zapłacone
      billing_cycle_anchor: 'unchanged', // Zachowaj ten sam cykl rozliczeniowy
    });

    logStep('Subscription updated in Stripe successfully', { 
      subscriptionId: updatedSubscription.id,
      newPriceId: targetPriceId,
      newAmount: targetPlanPrice * 100,
      status: updatedSubscription.status,
      currentPeriodEnd: updatedSubscription.current_period_end
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

    // KLUCZOWA CZĘŚĆ: Aktualizuj profile z nowymi danymi planu i tokenami
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: targetPlanName,
        subscription_status: 'active', // Upgrade czyni subskrypcję aktywną
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

    // KLUCZOWA CZĘŚĆ: Aktualizuj tabelę subscriptions z prawidłowymi danymi
    const { error: subError } = await supabaseService
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        email: user.email,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        subscription_status: 'active',
        subscription_type: targetPlanName, // Pełna nazwa planu np. "Full-Time 30"
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
      newAvailableTokens,
      stripeSubscriptionUpdated: true,
      supabaseDataSynced: true
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription_type: targetPlanName,
        tokens_added: upgradeTokens,
        new_available_tokens: newAvailableTokens,
        stripe_updated: true
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
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
