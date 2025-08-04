-- Fix security issues from the migration

-- Add missing RLS policies for clinics table
CREATE POLICY "Users can view their clinic" ON public.clinics
  FOR SELECT USING (
    id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage clinic" ON public.clinics
  FOR ALL USING (
    id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing RLS policies for treatments table
CREATE POLICY "Clinic members can view treatments" ON public.treatments
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can manage treatments" ON public.treatments
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add missing RLS policies for invoices table
CREATE POLICY "Clinic members can view invoices" ON public.invoices
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can manage invoices" ON public.invoices
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add missing RLS policies for medical_images table
CREATE POLICY "Clinic members can view medical images" ON public.medical_images
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can manage medical images" ON public.medical_images
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Fix the function security by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;