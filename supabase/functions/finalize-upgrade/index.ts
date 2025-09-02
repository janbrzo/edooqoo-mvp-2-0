
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user from the auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    // Obsługuj oba formaty: sessionId (camelCase) i session_id (snake_case)
    const sessionId = requestBody.sessionId || requestBody.session_id

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing finalize-upgrade for user ${user.id} with session ${sessionId}`)

    // Check if already processed
    const { data: existingSession } = await supabase
      .from('processed_upgrade_sessions')
      .select()
      .eq('session_id', sessionId)
      .eq('teacher_id', user.id)
      .single()

    if (existingSession) {
      console.log('Session already processed:', sessionId)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already processed',
          tokensAdded: existingSession.tokens_added
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current profile to check subscription status and get email
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = profile.email || user.email

    // Call add-tokens function with teacher email
    const { error: addTokensError } = await supabase.rpc('add_tokens', {
      p_teacher_id: user.id,
      p_amount: 5, // Adding 5 tokens as upgrade bonus
      p_description: 'Subscription upgrade bonus tokens',
      p_reference_id: null
    })

    if (addTokensError) {
      console.error('Error adding tokens:', addTokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to add tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record the processed session with email
    const { error: recordError } = await supabase
      .from('processed_upgrade_sessions')
      .insert({
        session_id: sessionId,
        teacher_id: user.id,
        email: userEmail,
        tokens_added: 5,
        upgrade_details: { type: 'subscription_upgrade' }
      })

    if (recordError) {
      console.error('Error recording processed session:', recordError)
      return new Response(
        JSON.stringify({ error: 'Failed to record session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully processed upgrade for user ${user.id}, added 5 tokens`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Upgrade processed successfully',
        tokensAdded: 5
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in finalize-upgrade:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
