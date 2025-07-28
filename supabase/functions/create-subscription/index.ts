
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { planType, monthlyLimit, price, planName, couponCode, upgradeTokens, isUpgrade } = await req.json()

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('Stripe_Secret_Key') || '', {
      apiVersion: '2023-10-16'
    })

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid user')
    }

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    let customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })
    }

    // Create line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: planName,
        },
        unit_amount: price * 100, // Convert to cents
        recurring: {
          interval: 'month',
        },
      },
      quantity: 1,
    }]

    // Prepare session configuration
    const sessionConfig: any = {
      customer: customer.id,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        monthly_limit: monthlyLimit.toString(),
        upgrade_tokens: upgradeTokens?.toString() || '0',
        is_upgrade: isUpgrade?.toString() || 'false',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
          monthly_limit: monthlyLimit.toString(),
        },
      },
    }

    // Add coupon if provided
    if (couponCode && couponCode.trim()) {
      try {
        // Validate coupon exists and is active
        const coupon = await stripe.coupons.retrieve(couponCode.trim())
        if (coupon.valid) {
          sessionConfig.discounts = [{
            coupon: couponCode.trim()
          }]
        }
      } catch (couponError) {
        // If coupon doesn't exist or is invalid, continue without discount
        console.log('Coupon validation failed:', couponError)
        // Don't throw error, just continue without discount
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
