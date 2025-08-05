-- Fix RLS policy for manual_payments to allow users without clinic_id to create payments
-- This is needed for subscription payments where users might not have a clinic yet

DROP POLICY IF EXISTS "Clinic members can create payments" ON public.manual_payments;

-- Allow users to create payments for their own user_id, even without clinic_id
-- This enables subscription payments before clinic assignment
CREATE POLICY "Users can create their own payments" 
ON public.manual_payments 
FOR INSERT 
WITH CHECK (
  -- User can create payment if they are authenticated and:
  -- 1. They have a clinic_id and it matches their profile's clinic_id, OR
  -- 2. They don't have a clinic_id (for subscription payments)
  auth.uid() IS NOT NULL AND (
    clinic_id IS NULL OR 
    clinic_id IN (
      SELECT profiles.clinic_id 
      FROM profiles 
      WHERE profiles.user_id = auth.uid()
    )
  )
);