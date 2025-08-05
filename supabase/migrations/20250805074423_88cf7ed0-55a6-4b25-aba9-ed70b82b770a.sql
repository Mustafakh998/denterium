-- Add payment account details to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN payment_accounts JSONB DEFAULT '{}',
ADD COLUMN zaincash_number TEXT,
ADD COLUMN qi_card_number TEXT,
ADD COLUMN fib_account_number TEXT;

-- Create supplier payment accounts table for better structure
CREATE TABLE public.supplier_payment_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('zaincash', 'qi_card', 'fib')),
  account_number TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, payment_method)
);

-- Create pending payments table for tracking dentist payments to suppliers
CREATE TABLE public.supplier_pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  order_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'IQD',
  payment_method TEXT,
  payment_account_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_reference TEXT,
  due_date DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.supplier_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_pending_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_payment_accounts
CREATE POLICY "Suppliers can manage their own payment accounts"
ON public.supplier_payment_accounts
FOR ALL
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
))
WITH CHECK (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

-- RLS policies for supplier_pending_payments
CREATE POLICY "Suppliers can view their pending payments"
ON public.supplier_pending_payments
FOR SELECT
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

CREATE POLICY "Dentists can view their payments to suppliers"
ON public.supplier_pending_payments
FOR SELECT
USING (dentist_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Suppliers can update payment status"
ON public.supplier_pending_payments
FOR UPDATE
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

CREATE POLICY "Dentists can create payments to suppliers"
ON public.supplier_pending_payments
FOR INSERT
WITH CHECK (dentist_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Add update triggers
CREATE TRIGGER update_supplier_payment_accounts_updated_at
  BEFORE UPDATE ON public.supplier_payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_pending_payments_updated_at
  BEFORE UPDATE ON public.supplier_pending_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_supplier_payment_accounts_supplier_id ON public.supplier_payment_accounts(supplier_id);
CREATE INDEX idx_supplier_pending_payments_supplier_id ON public.supplier_pending_payments(supplier_id);
CREATE INDEX idx_supplier_pending_payments_dentist_id ON public.supplier_pending_payments(dentist_id);
CREATE INDEX idx_supplier_pending_payments_status ON public.supplier_pending_payments(status);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_stock_quantity ON public.products(stock_quantity);
CREATE INDEX idx_products_expiry_date ON public.products(expiry_date);