-- Fix ambiguous column reference in create_clinic_for_approved_dentist function
CREATE OR REPLACE FUNCTION public.create_clinic_for_approved_dentist(
    name_input TEXT,
    address_input TEXT,
    phone_input TEXT,
    email_input TEXT,
    website_input TEXT,
    payment_id_input UUID,
    amount_input INT
)
RETURNS TABLE(id uuid, name text, address text, phone text, email text, website text, subscription_status text, subscription_plan text, created_at timestamptz) AS $$
DECLARE
    new_clinic_id UUID;
    plan_name TEXT;
BEGIN
    -- Determine subscription plan based on amount
    SELECT
        CASE
            WHEN amount_input >= 30000 THEN 'enterprise'
            WHEN amount_input >= 20000 THEN 'premium'
            ELSE 'basic'
        END
    INTO plan_name;

    -- Step 1: Insert the new clinic with proper column qualification
    INSERT INTO public.clinics (name, address, phone, email, website, subscription_status, subscription_plan)
    VALUES (name_input, address_input, phone_input, email_input, website_input, 'active', plan_name)
    RETURNING public.clinics.id INTO new_clinic_id;

    -- Step 2: Update the user's profile
    UPDATE public.profiles
    SET clinic_id = new_clinic_id,
        role = 'dentist'
    WHERE user_id = auth.uid();

    -- Step 3: Update the manual payment record
    UPDATE public.manual_payments
    SET clinic_id = new_clinic_id
    WHERE public.manual_payments.id = payment_id_input;

    -- Step 4: Create the subscription record
    INSERT INTO public.subscriptions (clinic_id, plan, status, amount_iqd, amount_usd, payment_method, current_period_start, current_period_end)
    VALUES (
        new_clinic_id,
        plan_name::public.subscription_plan,
        'approved'::public.payment_status,
        amount_input,
        round(amount_input / 1316.0),
        'qi_card'::public.payment_method,
        now(),
        now() + interval '1 year'
    );

    -- Step 5: Return the newly created clinic's data with proper qualification
    RETURN QUERY
    SELECT 
        c.id, 
        c.name, 
        c.address, 
        c.phone, 
        c.email, 
        c.website, 
        c.subscription_status, 
        c.subscription_plan, 
        c.created_at
    FROM public.clinics c
    WHERE c.id = new_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;