-- Reset all system data except superadmins
-- This will delete all regular users, clinics, patients, payments, subscriptions, etc.
-- but preserve superadmin accounts

-- First, delete all data from tables that reference other tables
DELETE FROM supplier_pending_payments;
DELETE FROM supplier_order_items;
DELETE FROM supplier_orders;
DELETE FROM supplier_reviews;
DELETE FROM supplier_messages;
DELETE FROM supplier_payment_accounts;

DELETE FROM manual_payments;
DELETE FROM subscriptions;
DELETE FROM medical_images;
DELETE FROM prescriptions;
DELETE FROM invoices;
DELETE FROM treatments;
DELETE FROM appointments;
DELETE FROM patients;

DELETE FROM products;
DELETE FROM suppliers;

-- Delete clinics (this will cascade to related data)
DELETE FROM clinics;

-- Delete regular user profiles (keep superadmins)
DELETE FROM profiles WHERE system_role != 'super_admin' OR system_role IS NULL;

-- Reset any sequences if needed (optional)
-- Note: UUIDs don't use sequences, so this is mainly for any auto-incrementing fields

-- Log the reset action
INSERT INTO profiles (user_id, email, first_name, last_name, role, system_role, is_active)
SELECT 
  gen_random_uuid(),
  'system-reset@admin.com',
  'System',
  'Reset Log',
  'dentist',
  'user',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'system-reset@admin.com'
);

-- Update the reset log entry to indicate when the reset happened
UPDATE profiles 
SET updated_at = now()
WHERE email = 'system-reset@admin.com';