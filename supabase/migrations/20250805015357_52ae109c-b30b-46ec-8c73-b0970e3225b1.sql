-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('stripe', 'qi_card', 'zain_cash');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_iqd INTEGER NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create manual payments table for Qi Card and Zain Cash
CREATE TABLE public.manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  amount_iqd INTEGER NOT NULL,
  screenshot_url TEXT NOT NULL,
  transaction_reference TEXT,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  notes TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription features table
CREATE TABLE public.subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan subscription_plan NOT NULL,
  feature_name TEXT NOT NULL,
  feature_limit INTEGER, -- NULL means unlimited
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default subscription features
INSERT INTO public.subscription_features (plan, feature_name, feature_limit, is_enabled) VALUES
-- Basic Plan Features
('basic', 'max_patients', 100, true),
('basic', 'max_staff', 3, true),
('basic', 'max_appointments_per_month', 500, true),
('basic', 'reports', NULL, true),
('basic', 'backup', NULL, false),
('basic', 'advanced_analytics', NULL, false),
('basic', 'multi_clinic', NULL, false),

-- Premium Plan Features  
('premium', 'max_patients', 500, true),
('premium', 'max_staff', 10, true),
('premium', 'max_appointments_per_month', 2000, true),
('premium', 'reports', NULL, true),
('premium', 'backup', NULL, true),
('premium', 'advanced_analytics', NULL, true),
('premium', 'multi_clinic', 3, true),

-- Enterprise Plan Features
('enterprise', 'max_patients', NULL, true),
('enterprise', 'max_staff', NULL, true),
('enterprise', 'max_appointments_per_month', NULL, true),
('enterprise', 'reports', NULL, true),
('enterprise', 'backup', NULL, true),
('enterprise', 'advanced_analytics', NULL, true),
('enterprise', 'multi_clinic', NULL, true);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Clinic members can view their subscription" 
ON public.subscriptions FOR SELECT 
USING (clinic_id IN (SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

-- RLS Policies for manual payments
CREATE POLICY "Clinic members can view their payments" 
ON public.manual_payments FOR SELECT 
USING (clinic_id IN (SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Clinic members can create payments" 
ON public.manual_payments FOR INSERT 
WITH CHECK (clinic_id IN (SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Admins can manage all payments" 
ON public.manual_payments FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

-- RLS Policies for subscription features (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view features" 
ON public.subscription_features FOR SELECT 
TO authenticated USING (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

CREATE TRIGGER update_manual_payments_updated_at
  BEFORE UPDATE ON public.manual_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Create storage policies for payment screenshots
CREATE POLICY "Clinic members can upload payment screenshots" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clinic members can view their payment screenshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment screenshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-screenshots' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));