-- Update subscription features with new tier structure
-- Remove multi-clinic support to prevent exploitation

-- Clear existing features
DELETE FROM subscription_features;

-- Insert new Basic plan features
INSERT INTO subscription_features (plan, feature_name, is_enabled, feature_limit) VALUES
('basic', 'max_patients', true, 50),
('basic', 'max_appointments_per_month', true, 100),
('basic', 'max_staff', true, 2),
('basic', 'max_clinics', true, 1),
('basic', 'basic_reports', true, null),
('basic', 'patient_management', true, null),
('basic', 'appointment_scheduling', true, null),
('basic', 'basic_billing', true, null),

-- Advanced features disabled for basic
('basic', 'advanced_analytics', false, null),
('basic', 'medical_images', false, null),
('basic', 'prescription_management', false, null),
('basic', 'communication_features', false, null),
('basic', 'backup_restore', false, null),
('basic', 'advanced_reports', false, null);

-- Insert Professional plan features  
INSERT INTO subscription_features (plan, feature_name, is_enabled, feature_limit) VALUES
('premium', 'max_patients', true, 200),
('premium', 'max_appointments_per_month', true, 500),
('premium', 'max_staff', true, 5),
('premium', 'max_clinics', true, 1),
('premium', 'basic_reports', true, null),
('premium', 'patient_management', true, null),
('premium', 'appointment_scheduling', true, null),
('premium', 'basic_billing', true, null),
('premium', 'advanced_analytics', true, null),
('premium', 'medical_images', true, null),
('premium', 'prescription_management', true, null),
('premium', 'communication_features', true, null),
('premium', 'advanced_reports', true, null),

-- Still limited features
('premium', 'backup_restore', false, null);

-- Insert Enterprise plan features (everything unlimited)
INSERT INTO subscription_features (plan, feature_name, is_enabled, feature_limit) VALUES
('enterprise', 'max_patients', true, null),
('enterprise', 'max_appointments_per_month', true, null),
('enterprise', 'max_staff', true, null),
('enterprise', 'max_clinics', true, 1),
('enterprise', 'basic_reports', true, null),
('enterprise', 'patient_management', true, null),
('enterprise', 'appointment_scheduling', true, null),
('enterprise', 'basic_billing', true, null),
('enterprise', 'advanced_analytics', true, null),
('enterprise', 'medical_images', true, null),
('enterprise', 'prescription_management', true, null),
('enterprise', 'communication_features', true, null),
('enterprise', 'advanced_reports', true, null),
('enterprise', 'backup_restore', true, null),
('enterprise', 'priority_support', true, null),
('enterprise', 'advanced_security', true, null);