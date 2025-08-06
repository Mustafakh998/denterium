-- Comprehensive database reset - preserve only superadmins and their data
-- Step 1: Get superadmin user IDs to preserve
DO $$
DECLARE
    superadmin_user_ids UUID[];
BEGIN
    -- Get all superadmin user IDs
    SELECT ARRAY(
        SELECT user_id 
        FROM profiles 
        WHERE system_role = 'super_admin'
    ) INTO superadmin_user_ids;
    
    -- Log the superadmins we're preserving
    RAISE NOTICE 'Preserving % superadmin accounts', array_length(superadmin_user_ids, 1);
    
    -- Delete all data in dependency order, but preserve superadmin-related data
    
    -- Delete supplier-related data
    DELETE FROM supplier_pending_payments;
    DELETE FROM supplier_order_items;
    DELETE FROM supplier_orders;
    DELETE FROM supplier_reviews;
    DELETE FROM supplier_messages;
    DELETE FROM supplier_payment_accounts;
    DELETE FROM products;
    DELETE FROM suppliers;
    
    -- Delete clinic-related data
    DELETE FROM manual_payments WHERE user_id IS NULL OR user_id != ALL(superadmin_user_ids);
    DELETE FROM subscriptions;
    DELETE FROM medical_images;
    DELETE FROM prescriptions;
    DELETE FROM invoices;
    DELETE FROM treatments;
    DELETE FROM appointments;
    DELETE FROM patients;
    DELETE FROM clinics;
    
    -- Delete non-superadmin profiles
    DELETE FROM profiles WHERE system_role != 'super_admin' OR system_role IS NULL;
    
    -- Also delete any manual payments from non-superadmins
    DELETE FROM manual_payments WHERE user_id IS NOT NULL AND user_id != ALL(superadmin_user_ids);
    
    RAISE NOTICE 'Database reset completed. Superadmin accounts preserved.';
END $$;