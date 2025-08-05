-- Remove the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;