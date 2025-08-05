-- Remove the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view own profile and super admins view all" ON public.profiles;

-- Create a security definer function to check if user is super admin
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_uuid AND system_role = 'super_admin'
  );
$$;

-- Create simple policies without recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_super_admin(auth.uid()));

-- Update the INSERT policy to also use the function
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;

CREATE POLICY "Super admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  OR 
  public.is_super_admin(auth.uid())
);