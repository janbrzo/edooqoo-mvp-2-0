
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function for detailed logging
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [VERIFY-SUBSCRIPTION-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { sessionId } = await req.json();
    logStep("Request data received", { sessionId });

    // Validate input data
    if (!sessionId) {
      logStep("ERROR: Missing sessionId");
      return new Response(
        JSON.stringify({ error: 'Missing sessionId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check Stripe configuration
    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep("ERROR: Stripe secret key not configured");
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: User authentication failed", { error: userError.message });
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = userData.user;
    if (!user) {
      logStep("ERROR: No user found");
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Retrieved checkout session", { 
      sessionId, 
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription 
    });

    if (session.payment_status !== 'paid') {
      logStep("Payment not completed", { status: session.payment_status });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment not completed',
          status: session.payment_status 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get subscription details
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep("Retrieved subscription", { 
      subscriptionId, 
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      planType: session.metadata?.plan_type,
      monthlyLimit: session.metadata?.monthly_limit
    });

    // Extract plan details from metadata
    const planType = session.metadata?.plan_type || 'unknown';
    const monthlyLimit = parseInt(session.metadata?.monthly_limit || '0');
    const tokensToAdd = monthlyLimit; // Add tokens equal to monthly limit

    // Update or create subscription record
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        teacher_id: user.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        status: subscription.status,
        plan_type: planType,
        monthly_limit: monthlyLimit,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'teacher_id',
        ignoreDuplicates: false
      });

    if (subscriptionError) {
      logStep("ERROR: Failed to update subscription", { error: subscriptionError });
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Subscription updated successfully", subscriptionData);

    // Update user profile with subscription info
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_type: planType,
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_worksheet_limit: monthlyLimit,
        token_balance: tokensToAdd, // Set token balance to monthly limit
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      logStep("ERROR: Failed to update profile", { error: profileError });
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Profile updated successfully");

    // Add token transaction record
    const { error: transactionError } = await supabaseClient
      .from('token_transactions')
      .insert({
        teacher_id: user.id,
        transaction_type: 'purchase',
        amount: tokensToAdd,
        description: `Subscription purchase - ${planType} plan`,
        reference_id: null,
      });

    if (transactionError) {
      logStep("WARNING: Failed to create token transaction", { error: transactionError });
      // Don't fail the whole operation for this
    } else {
      logStep("Token transaction created successfully");
    }

    logStep("Payment verification completed successfully", {
      planType,
      monthlyLimit,
      tokensAdded: tokensToAdd,
      subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription activated successfully',
        subscription: {
          plan_type: planType,
          monthly_limit: monthlyLimit,
          tokens_added: tokensToAdd,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          status: subscription.status
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logStep("ERROR: Exception caught", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify payment',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
