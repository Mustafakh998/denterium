import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  console.log(`[FIB Payment] ${step}`, details || '')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting FIB payment process')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get FIB credentials from environment
    const fibClientId = Deno.env.get('FIB_CLIENT_ID')
    const fibClientSecret = Deno.env.get('FIB_CLIENT_SECRET')

    if (!fibClientId || !fibClientSecret) {
      logStep('Missing FIB credentials')
      return new Response(
        JSON.stringify({ error: 'FIB credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      logStep('Authentication failed', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    logStep('User authenticated', { userId: user.id })

    // Parse request body
    const { amount, plan, description } = await req.json()

    if (!amount || !plan) {
      return new Response(
        JSON.stringify({ error: 'Amount and plan are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's clinic_id from profiles (allow null for new users)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      logStep('Failed to get user profile', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    logStep('User profile retrieved', { clinicId: profile?.clinic_id || 'No clinic yet' })

    // Step 1: Get OAuth token from FIB
    logStep('Getting OAuth token from FIB')
    
    const tokenResponse = await fetch('https://fib.stage.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: fibClientId,
        client_secret: fibClientSecret,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      logStep('Failed to get FIB token', tokenData)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with FIB' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const accessToken = tokenData.access_token
    logStep('FIB OAuth token obtained')

    // Step 2: Create payment with FIB
    logStep('Creating payment with FIB')

    const callbackUrl = `${supabaseUrl}/functions/v1/fib-webhook`
    
    const paymentResponse = await fetch('https://fib.stage.fib.iq/protected/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        monetaryValue: {
          amount: amount.toString(),
          currency: 'IQD'
        },
        statusCallbackUrl: callbackUrl,
        description: description || `Subscription payment for ${plan} plan`
      }),
    })

    const paymentData = await paymentResponse.json()

    if (!paymentResponse.ok) {
      logStep('Failed to create FIB payment', paymentData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment with FIB' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    logStep('FIB payment created', { paymentId: paymentData.paymentId })

    // Step 3: Store pending subscription in database
    const subscriptionData = {
      clinic_id: profile?.clinic_id, // Allow null for new users
      plan: plan,
      amount_usd: Math.round(parseInt(amount) / 1316), // Convert IQD to USD roughly
      amount_iqd: parseInt(amount),
      payment_method: 'fib' as const,
      status: 'pending' as const,
      stripe_subscription_id: paymentData.paymentId, // Store FIB payment ID here
    }

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)

    if (subscriptionError) {
      logStep('Failed to create subscription record', subscriptionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    logStep('Subscription record created')

    // Return FIB payment details
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.paymentId,
        qrCode: paymentData.qrCode,
        readableCode: paymentData.readableCode,
        personalAppLink: paymentData.personalAppLink,
        businessAppLink: paymentData.businessAppLink,
        corporateAppLink: paymentData.corporateAppLink,
        validUntil: paymentData.validUntil,
        message: 'Payment created successfully. Please complete payment using FIB mobile app.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    logStep('Unexpected error', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})