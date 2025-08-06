-- Fix critical database issues and function security

-- 1. Fix function search paths (security issue)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_uuid AND system_role = 'super_admin'
  );
$function$;

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

CREATE OR REPLACE FUNCTION public.create_superadmin_user(user_email text, first_name text DEFAULT 'Mustafa'::text, last_name text DEFAULT 'Admin'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert the superadmin profile
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    system_role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    first_name,
    last_name,
    'dentist',
    'super_admin',
    true,
    now(),
    now()
  );
  
  RETURN new_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_prescription_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the current year
    SELECT EXTRACT(YEAR FROM NOW()) INTO counter;
    
    -- Generate a prescription number like RX-2024-00001
    SELECT 'RX-' || counter || '-' || LPAD((
        SELECT COUNT(*) + 1 
        FROM prescriptions 
        WHERE EXTRACT(YEAR FROM created_at) = counter
    )::TEXT, 5, '0') INTO new_number;
    
    RETURN new_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

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

-- 2. Fix manual_payments user_id column to be NOT NULL for better security
ALTER TABLE manual_payments 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Add missing subscription features if they don't exist
INSERT INTO subscription_features (plan, feature_name, feature_limit, is_enabled) VALUES 
  ('basic', 'max_patients', 50, true),
  ('basic', 'max_staff', 2, true),
  ('basic', 'max_appointments_per_month', 100, true),
  ('basic', 'advanced_analytics', null, false),
  ('basic', 'medical_images', null, false),
  ('basic', 'prescription_management', null, false),
  ('basic', 'communication_features', null, false),
  ('basic', 'backup_restore', null, false),
  ('basic', 'advanced_reports', null, false),
  ('basic', 'priority_support', null, false),
  ('basic', 'advanced_security', null, false),
  
  ('premium', 'max_patients', 200, true),
  ('premium', 'max_staff', 5, true),
  ('premium', 'max_appointments_per_month', 500, true),
  ('premium', 'advanced_analytics', null, true),
  ('premium', 'medical_images', null, true),
  ('premium', 'prescription_management', null, true),
  ('premium', 'communication_features', null, true),
  ('premium', 'backup_restore', null, false),
  ('premium', 'advanced_reports', null, true),
  ('premium', 'priority_support', null, false),
  ('premium', 'advanced_security', null, false),
  
  ('enterprise', 'max_patients', null, true),
  ('enterprise', 'max_staff', null, true),
  ('enterprise', 'max_appointments_per_month', null, true),
  ('enterprise', 'advanced_analytics', null, true),
  ('enterprise', 'medical_images', null, true),
  ('enterprise', 'prescription_management', null, true),
  ('enterprise', 'communication_features', null, true),
  ('enterprise', 'backup_restore', null, true),
  ('enterprise', 'advanced_reports', null, true),
  ('enterprise', 'priority_support', null, true),
  ('enterprise', 'advanced_security', null, true)
ON CONFLICT (plan, feature_name) DO NOTHING;

-- 4. Create missing triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER create_supplier_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_supplier_for_supplier_profile();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_payments_updated_at
  BEFORE UPDATE ON manual_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();