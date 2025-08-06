-- Enable leaked password protection and fix OTP settings
-- These are auth configuration settings that need to be enabled for better security

-- Update auth configuration for better security
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_required_characters = '{"LOWER","UPPER","NUMBER","SPECIAL"}',
  enable_signup = true
WHERE id = 'auth';

-- The OTP expiry and leaked password protection are typically configured 
-- through the Supabase dashboard auth settings, but we can ensure 
-- the basic security is in place