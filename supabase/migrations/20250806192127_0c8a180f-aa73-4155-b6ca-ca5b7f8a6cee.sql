-- Factory reset: Delete all user data and reset the database
DELETE FROM supplier_pending_payments;
DELETE FROM supplier_order_items;
DELETE FROM supplier_orders;
DELETE FROM supplier_reviews;
DELETE FROM supplier_messages;
DELETE FROM supplier_payment_accounts;
DELETE FROM prescriptions;
DELETE FROM treatments;
DELETE FROM medical_images;
DELETE FROM invoices;
DELETE FROM appointments;
DELETE FROM patients;
DELETE FROM manual_payments;
DELETE FROM subscriptions;
DELETE FROM suppliers;
DELETE FROM profiles;
DELETE FROM clinics;

-- Drop all dependent objects first
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
DROP TRIGGER IF EXISTS trigger_create_supplier_for_supplier_profile ON profiles;
DROP POLICY IF EXISTS "Admins can manage their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Users can create clinic if eligible" ON public.clinics;
DROP POLICY IF EXISTS "Admins can manage clinic subscriptions" ON public.subscriptions;

-- Now safely drop and recreate the role column
ALTER TABLE profiles DROP COLUMN role CASCADE;
DROP TYPE user_role CASCADE;
CREATE TYPE user_role AS ENUM ('patient', 'dentist', 'supplier');
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'dentist'::user_role;

-- Add logo functionality to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url text;

-- Simplified clinic policies - clinic owners can manage their clinics
CREATE POLICY "Users can create their clinic" ON public.clinics
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND clinic_id IS NOT NULL
  ) AND
  EXISTS (
    SELECT 1 FROM manual_payments 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE POLICY "Clinic owners can manage their clinic" ON public.clinics
FOR ALL USING (
  id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid() AND clinic_id IS NOT NULL
  )
);

-- Update can_create_clinic function for simplified logic
CREATE OR REPLACE FUNCTION public.can_create_clinic()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND clinic_id IS NULL
    AND EXISTS (
      SELECT 1 FROM manual_payments 
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );
$function$;

-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for clinic logos
CREATE POLICY "Authenticated users can upload clinic logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'clinic-logos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Everyone can view clinic logos" ON storage.objects
FOR SELECT USING (bucket_id = 'clinic-logos');

CREATE POLICY "Clinic owners can update their logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'clinic-logos' AND
  auth.uid() IS NOT NULL
);

-- Create storage bucket for medical images if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-images', 'medical-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for medical images
CREATE POLICY "Clinic members can upload medical images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'medical-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND clinic_id IS NOT NULL
  )
);

CREATE POLICY "Clinic members can view medical images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'medical-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND clinic_id IS NOT NULL
  )
);

-- Update profiles policies for simplified roles
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
FOR ALL USING (is_super_admin(auth.uid()));

-- Recreate the supplier trigger for the new role system
CREATE OR REPLACE FUNCTION public.create_supplier_for_supplier_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If the profile role is supplier and there's no supplier record yet
  IF NEW.role = 'supplier' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO suppliers (
      user_id,
      company_name,
      email,
      is_active,
      verified,
      rating,
      total_reviews
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Supplier Company'),
      NEW.email,
      true,
      false,
      0,
      0
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for supplier creation
CREATE TRIGGER trigger_create_supplier_for_supplier_profile
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_supplier_for_supplier_profile();

-- Update trigger function for simplified roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'dentist')::user_role
  );
  RETURN NEW;
END;
$function$;