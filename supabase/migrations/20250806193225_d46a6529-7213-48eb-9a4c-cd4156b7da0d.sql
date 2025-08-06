-- Update mustafa.hk998@gmail.com to be superadmin
UPDATE profiles 
SET system_role = 'super_admin'
WHERE email = 'mustafa.hk998@gmail.com';

-- Verify the update worked
SELECT user_id, email, first_name, last_name, role, system_role, is_active 
FROM profiles 
WHERE email = 'mustafa.hk998@gmail.com';