-- Check current RLS policies for manual_payments table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'manual_payments';

-- Fix RLS policies for manual_payments table
-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can insert their own manual payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can view their own manual payments" ON manual_payments;
DROP POLICY IF EXISTS "Users can update their own manual payments" ON manual_payments;

-- Create proper RLS policies for manual_payments
CREATE POLICY "Users can insert their own manual payments" 
ON manual_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own manual payments" 
ON manual_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual payments" 
ON manual_payments 
FOR UPDATE 
USING (auth.uid() = user_id);