import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan } = await req.json();
    if (!plan || !['basic', 'premium', 'enterprise'].includes(plan)) {
      throw new Error("Invalid subscription plan");
    }

    // Plan pricing in IQD and USD
    const planPricing = {
      basic: { iqd: 10000, usd: 7.60 },
      premium: { iqd: 20000, usd: 15.20 },
      enterprise: { iqd: 30000, usd: 22.80 }
    };

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Get user's clinic
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.clinic_id) {
      throw new Error("User clinic not found");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `نظام إدارة العيادة - ${plan === 'basic' ? 'أساسي' : plan === 'premium' ? 'متميز' : 'مؤسسي'}`,
              description: `خطة ${plan} - ${planPricing[plan].iqd} دينار عراقي شهرياً`
            },
            unit_amount: Math.round(planPricing[plan].usd * 100), // Convert to cents
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscription-cancel`,
      metadata: {
        userId: user.id,
        clinicId: profile.clinic_id,
        plan: plan
      }
    });

    logStep("Created checkout session", { sessionId: session.id });

    // Create pending subscription record
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        clinic_id: profile.clinic_id,
        plan: plan,
        status: 'pending',
        amount_iqd: planPricing[plan].iqd,
        amount_usd: planPricing[plan].usd,
        payment_method: 'stripe',
        stripe_customer_id: customerId
      });

    if (subscriptionError) {
      logStep("Error creating subscription record", subscriptionError);
      throw subscriptionError;
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});