-- Fix RLS policies for superadmin access to subscriptions and manual payments

-- Drop existing policies on subscriptions table
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Clinic members can view their subscription" ON public.subscriptions;

-- Create new policies for subscriptions with superadmin access
CREATE POLICY "Super admins can manage all subscriptions" ON public.subscriptions
FOR ALL USING (
  is_super_admin(auth.uid())
);

CREATE POLICY "Admins can manage clinic subscriptions" ON public.subscriptions
FOR ALL USING (
  clinic_id IN (
    SELECT profiles.clinic_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Users can view their subscription" ON public.subscriptions
FOR SELECT USING (
  clinic_id IN (
    SELECT profiles.clinic_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Drop existing policies on manual_payments table  
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Clinic members can view their payments" ON public.manual_payments;

-- Create new policies for manual_payments with superadmin access
CREATE POLICY "Super admins can manage all payments" ON public.manual_payments
FOR ALL USING (
  is_super_admin(auth.uid())
);

CREATE POLICY "Users can create their own payments" ON public.manual_payments
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can view their own payments" ON public.manual_payments
FOR SELECT USING (
  auth.uid() = user_id OR is_super_admin(auth.uid())
);

CREATE POLICY "Clinic members can view their payments" ON public.manual_payments
FOR SELECT USING (
  clinic_id IN (
    SELECT profiles.clinic_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Update the can_create_clinic function to handle the subscription flow better
CREATE OR REPLACE FUNCTION public.can_create_clinic()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    -- Check if user has no existing clinic and has approved subscription or manual payment
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND clinic_id IS NULL
    AND (
      -- Has approved subscription linked to manual payment
      EXISTS (
        SELECT 1 FROM subscriptions s
        INNER JOIN manual_payments mp ON mp.subscription_id = s.id
        WHERE mp.user_id = auth.uid() AND s.status = 'approved'
      )
      OR
      -- Has approved manual payment without subscription link yet
      EXISTS (
        SELECT 1 FROM manual_payments mp
        WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
      )
      OR
      -- Has direct approved subscription
      EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.clinic_id IS NULL AND s.status = 'approved'
        AND EXISTS (
          SELECT 1 FROM manual_payments mp 
          WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
        )
      )
    )
  );
$function$;