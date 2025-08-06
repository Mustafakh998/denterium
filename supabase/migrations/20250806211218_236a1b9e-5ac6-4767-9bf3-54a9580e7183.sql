-- Reset all system data except superadmins
-- This will delete all regular users, clinics, patients, payments, subscriptions, etc.
-- but preserve superadmin accounts

-- Delete all data from tables that reference other tables (in correct order)
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

-- Delete clinics
DELETE FROM clinics;

-- Delete regular user profiles (keep only superadmins)
DELETE FROM profiles WHERE system_role != 'super_admin' OR system_role IS NULL;