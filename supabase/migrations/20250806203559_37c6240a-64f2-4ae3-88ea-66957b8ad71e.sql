-- ==========================================
-- COMPLETE USER SYSTEM REBUILD - FIXED
-- ==========================================

-- Step 1: Drop dependent triggers first
DROP TRIGGER IF EXISTS trigger_create_supplier_for_supplier_profile ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Step 2: Drop all existing RLS policies for user-related tables
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can insert their own manual payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can update their own manual payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can view their own manual payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON manual_payments;
DROP POLICY IF EXISTS "Clinic members can view their payments" ON manual_payments;
DROP POLICY IF EXISTS "Super admins can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their subscription" ON subscriptions;

-- Step 3: Drop existing functions CASCADE to remove dependencies
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_create_clinic() CASCADE;
DROP FUNCTION IF EXISTS create_superadmin_user(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_supplier_for_supplier_profile() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 4: Clear all existing user data
DELETE FROM manual_payments;
DELETE FROM subscriptions;
DELETE FROM appointments;
DELETE FROM treatments;
DELETE FROM prescriptions;
DELETE FROM medical_images;
DELETE FROM invoices;
DELETE FROM patients;
DELETE FROM clinics;
DELETE FROM suppliers;
DELETE FROM profiles;

-- Step 5: Drop and recreate user role types with cleaner structure
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS system_role CASCADE;

CREATE TYPE user_role AS ENUM ('dentist', 'assistant', 'receptionist', 'admin', 'supplier');
CREATE TYPE system_role AS ENUM ('user', 'super_admin');

-- Step 6: Recreate profiles table with cleaner structure
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role user_role DEFAULT 'dentist',
  system_role system_role DEFAULT 'user',
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  license_number text,
  specialization text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create clean, simple functions for role checking
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND system_role = 'super_admin'
    AND is_active = true
  );
$$;

-- Step 8: Create simple RLS policies
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL 
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view and update their own profile"
ON profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 9: Recreate manual_payments policies
CREATE POLICY "Super admins can manage all payments"
ON manual_payments FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can manage their own payments"
ON manual_payments FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 10: Recreate subscriptions policies
CREATE POLICY "Super admins can manage all subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Step 11: Create new trigger for auto-creating profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role,
    system_role
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'dentist')::user_role,
    'user'::system_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 12: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Create function to create superadmin
CREATE OR REPLACE FUNCTION create_superadmin_profile(
  p_email text,
  p_first_name text DEFAULT 'Super',
  p_last_name text DEFAULT 'Admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id uuid;
  profile_id uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please create the auth user first.', p_email;
  END IF;
  
  -- Create or update the profile as superadmin
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    system_role,
    is_active
  ) VALUES (
    new_user_id,
    p_email,
    p_first_name,
    p_last_name,
    'dentist',
    'super_admin',
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    system_role = 'super_admin',
    first_name = p_first_name,
    last_name = p_last_name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;