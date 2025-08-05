import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // Verify webhook if secret is provided
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      const {
        user,
        email_data: { token, token_hash, redirect_to, email_action_type },
      } = wh.verify(payload, headers) as {
        user: {
          email: string
          user_metadata?: {
            first_name?: string
            last_name?: string
            role?: string
          }
        }
        email_data: {
          token: string
          token_hash: string
          redirect_to: string
          email_action_type: string
          site_url: string
        }
      }

      // Only send welcome email for email confirmation
      if (email_action_type !== 'signup') {
        return new Response(JSON.stringify({ message: 'Not a signup confirmation' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const firstName = user.user_metadata?.first_name || user.email.split('@')[0]
      const userType = user.user_metadata?.role || 'dentist'
      const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

      const html = await renderAsync(
        React.createElement(WelcomeEmail, {
          firstName,
          email: user.email,
          confirmationUrl,
          userType: userType as any,
        })
      )

      const { error } = await resend.emails.send({
        from: 'دنتال برو - Dental Pro <welcome@dentalpro.com>',
        to: [user.email],
        subject: 'مرحباً بك في دنتال برو - Welcome to Dental Pro',
        html,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log('Welcome email sent successfully to:', user.email)
    } else {
      // Direct API call (no webhook verification)
      const { firstName, email, userType, confirmationUrl } = await req.json()

      const html = await renderAsync(
        React.createElement(WelcomeEmail, {
          firstName: firstName || email.split('@')[0],
          email,
          confirmationUrl,
          userType: userType || 'dentist',
        })
      )

      const { error } = await resend.emails.send({
        from: 'دنتال برو - Dental Pro <welcome@dentalpro.com>',
        to: [email],
        subject: 'مرحباً بك في دنتال برو - Welcome to Dental Pro',
        html,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log('Welcome email sent successfully to:', email)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})