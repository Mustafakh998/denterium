-- Make Mustafa.hk998@gmail.com an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'mustafa.hk998@gmail.com';

-- Add system admin role if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_role') THEN
        CREATE TYPE public.system_role AS ENUM ('super_admin', 'support', 'user');
    END IF;
END
$$;

-- Add system admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS system_role public.system_role DEFAULT 'user';

-- Make Mustafa the super admin
UPDATE public.profiles 
SET system_role = 'super_admin' 
WHERE email = 'mustafa.hk998@gmail.com';