
-- Create a security definer function to check if user can create a clinic
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
      -- Has approved subscription
      EXISTS (
        SELECT 1 FROM subscriptions s
        INNER JOIN manual_payments mp ON mp.subscription_id = s.id
        WHERE mp.user_id = auth.uid() AND s.status = 'approved'
      )
      OR
      -- Has approved manual payment
      EXISTS (
        SELECT 1 FROM manual_payments mp
        WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
      )
    )
  );
$function$;

-- Drop existing policies for clinics table
DROP POLICY IF EXISTS "Admins can manage clinic" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;

-- Create new policies for clinics table
CREATE POLICY "Admins can manage their clinic" ON public.clinics
FOR ALL USING (
  id IN (
    SELECT profiles.clinic_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Users can create clinic if eligible" ON public.clinics
FOR INSERT WITH CHECK (
  -- User can create clinic if they can create one OR they're already an admin
  can_create_clinic() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::user_role
  )
);

CREATE POLICY "Users can view their clinic" ON public.clinics
FOR SELECT USING (
  id IN (
    SELECT profiles.clinic_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);
