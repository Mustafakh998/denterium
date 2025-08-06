-- Fix RLS policy for clinics table to allow authenticated users to create clinics
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Clinic owners can manage their clinic" ON public.clinics;

-- Create separate policies for different operations
-- Allow authenticated users to create clinics
CREATE POLICY "Authenticated users can create clinics"
ON public.clinics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow clinic owners to view their clinic
CREATE POLICY "Clinic owners can view their clinic"
ON public.clinics
FOR SELECT
USING (id IN (
  SELECT profiles.clinic_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.clinic_id IS NOT NULL
));

-- Allow clinic owners to update their clinic
CREATE POLICY "Clinic owners can update their clinic"
ON public.clinics
FOR UPDATE
USING (id IN (
  SELECT profiles.clinic_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.clinic_id IS NOT NULL
))
WITH CHECK (id IN (
  SELECT profiles.clinic_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.clinic_id IS NOT NULL
));

-- Allow clinic owners to delete their clinic (if needed)
CREATE POLICY "Clinic owners can delete their clinic"
ON public.clinics
FOR DELETE
USING (id IN (
  SELECT profiles.clinic_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.clinic_id IS NOT NULL
));