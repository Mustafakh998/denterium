-- Add policy for super admins to view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Original condition: users can view their own profile
  (user_id = auth.uid()) 
  OR 
  -- New condition: super admins can view all profiles
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.system_role = 'super_admin'
  ))
);