import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  console.log(`[FIB Webhook] ${step}`, details || '')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Parse webhook payload
    const { id: paymentId, status } = await req.json()

    if (!paymentId || !status) {
      logStep('Invalid webhook payload')
      return new Response(null, { status: 406, headers: corsHeaders })
    }

    logStep('Webhook payload', { paymentId, status })

    // Find subscription by FIB payment ID
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', paymentId)
      .single()

    if (findError || !subscription) {
      logStep('Subscription not found for payment ID', { paymentId, error: findError })
      return new Response(null, { status: 406, headers: corsHeaders })
    }

    logStep('Subscription found', { subscriptionId: subscription.id })

    // Map FIB status to our status
    let newStatus: 'active' | 'pending' | 'cancelled' = 'pending'
    
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
      case 'completed':
        newStatus = 'active'
        break
      case 'failed':
      case 'cancelled':
      case 'expired':
        newStatus = 'cancelled'
        break
      default:
        newStatus = 'pending'
    }

    logStep('Status mapped', { fibStatus: status, newStatus })

    // Update subscription status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // If payment is successful, set subscription period
    if (newStatus === 'active') {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month subscription

      updateData.current_period_start = now.toISOString()
      updateData.current_period_end = periodEnd.toISOString()
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      logStep('Failed to update subscription', updateError)
      return new Response(null, { status: 500, headers: corsHeaders })
    }

    logStep('Subscription updated successfully')

    // If payment successful, also update clinic subscription status
    if (newStatus === 'active') {
      const { error: clinicError } = await supabase
        .from('clinics')
        .update({
          subscription_status: 'active',
          subscription_end_date: updateData.current_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.clinic_id)

      if (clinicError) {
        logStep('Failed to update clinic', clinicError)
      } else {
        logStep('Clinic updated successfully')
      }
    }

    // Return success response to FIB
    return new Response(null, { status: 202, headers: corsHeaders })

  } catch (error) {
    logStep('Webhook error', error)
    return new Response(null, { status: 500, headers: corsHeaders })
  }
})