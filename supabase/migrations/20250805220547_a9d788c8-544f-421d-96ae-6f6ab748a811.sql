-- Fix the circular dependency in the profiles RLS policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Create a simpler policy that allows users to view their own profile
-- and allows checking system_role without circular dependency
CREATE POLICY "Users can view own profile and super admins view all" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  auth.uid() IN (
    SELECT user_id 
    FROM public.profiles 
    WHERE system_role = 'super_admin' 
    AND user_id = auth.uid()
  )
);

-- Allow super admins to insert profiles for other users
CREATE POLICY "Super admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  OR 
  auth.uid() IN (
    SELECT user_id 
    FROM public.profiles 
    WHERE system_role = 'super_admin'
  )
);