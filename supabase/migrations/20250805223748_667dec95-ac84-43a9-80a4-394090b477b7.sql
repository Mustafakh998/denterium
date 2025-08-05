-- Add user_id column to manual_payments table to track which user made the payment
ALTER TABLE public.manual_payments 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing manual payments to link them to users based on the screenshot_url pattern
-- The screenshot_url contains the user_id as the first part of the path
UPDATE public.manual_payments 
SET user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE user_id::text = SPLIT_PART(screenshot_url, '/', 1)
)
WHERE user_id IS NULL AND screenshot_url IS NOT NULL;

-- Create an index for better performance
CREATE INDEX idx_manual_payments_user_id ON public.manual_payments(user_id);

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can create their own payments" ON public.manual_payments;

CREATE POLICY "Users can create their own payments" 
ON public.manual_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments" 
ON public.manual_payments 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));