-- Delete existing profile for mustafa.hk998@gmail.com
DELETE FROM profiles WHERE email = 'mustafa.hk998@gmail.com';

-- Create a function to create superadmin user
CREATE OR REPLACE FUNCTION create_superadmin_user(
  user_email TEXT,
  first_name TEXT DEFAULT 'Mustafa',
  last_name TEXT DEFAULT 'Admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;