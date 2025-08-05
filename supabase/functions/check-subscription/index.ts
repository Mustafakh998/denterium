import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's clinic
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.clinic_id) {
      throw new Error("User clinic not found");
    }

    // Check for active subscription in our database
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', profile.clinic_id)
      .eq('status', 'approved')
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      logStep("Found active subscription", { 
        plan: subscription.plan, 
        endDate: subscription.current_period_end 
      });
      
      return new Response(JSON.stringify({
        subscribed: true,
        plan: subscription.plan,
        subscription_end: subscription.current_period_end,
        payment_method: subscription.payment_method
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no active subscription found, check Stripe for credit card subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const stripeSubscription = subscriptions.data[0];
        const subscriptionEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
        
        // Determine plan from price
        const priceId = stripeSubscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let plan = 'basic';
        if (amount >= 2000) plan = 'enterprise'; // $20+
        else if (amount >= 1500) plan = 'premium'; // $15+
        
        logStep("Found active Stripe subscription", { 
          subscriptionId: stripeSubscription.id, 
          plan, 
          endDate: subscriptionEnd 
        });

        // Update our database
        await supabaseClient
          .from('subscriptions')
          .upsert({
            clinic_id: profile.clinic_id,
            plan: plan,
            status: 'approved',
            amount_iqd: plan === 'basic' ? 10000 : plan === 'premium' ? 20000 : 30000,
            amount_usd: amount / 100,
            payment_method: 'stripe',
            stripe_subscription_id: stripeSubscription.id,
            stripe_customer_id: customerId,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
          });

        return new Response(JSON.stringify({
          subscribed: true,
          plan: plan,
          subscription_end: subscriptionEnd,
          payment_method: 'stripe'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    logStep("No active subscription found");
    return new Response(JSON.stringify({
      subscribed: false,
      plan: null,
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});