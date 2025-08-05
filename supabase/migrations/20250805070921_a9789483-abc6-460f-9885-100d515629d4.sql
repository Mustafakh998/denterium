-- Add supplier role to user_role enum
ALTER TYPE user_role ADD VALUE 'supplier';

-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_license text,
  tax_id text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  website text,
  description text,
  logo_url text,
  verified boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.product_categories(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.product_categories(id),
  name text NOT NULL,
  description text,
  brand text,
  model text,
  sku text,
  barcode text,
  unit_price numeric(10,2) NOT NULL,
  bulk_price numeric(10,2),
  bulk_quantity integer,
  currency text DEFAULT 'USD',
  stock_quantity integer DEFAULT 0,
  min_stock_level integer DEFAULT 0,
  max_stock_level integer,
  expiry_date date,
  manufacture_date date,
  warranty_months integer,
  specifications jsonb DEFAULT '{}',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  requires_prescription boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create supplier orders table
CREATE TABLE public.supplier_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.profiles(id),
  clinic_id uuid REFERENCES public.clinics(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(10,2) NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0,
  shipping_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  payment_method text,
  shipping_address text,
  billing_address text,
  notes text,
  expected_delivery_date date,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create supplier order items table
CREATE TABLE public.supplier_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create supplier reviews table
CREATE TABLE public.supplier_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.supplier_orders(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create supplier messages table for dentist-supplier communication
CREATE TABLE public.supplier_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_type text CHECK (sender_type IN ('supplier', 'dentist')),
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  product_id uuid REFERENCES public.products(id),
  order_id uuid REFERENCES public.supplier_orders(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default product categories
INSERT INTO public.product_categories (name, description) VALUES
('Dental Instruments', 'Hand instruments, rotary instruments, and surgical tools'),
('Dental Materials', 'Composites, cements, impression materials, and consumables'),
('Equipment', 'Dental chairs, units, X-ray machines, and sterilization equipment'),
('Orthodontics', 'Brackets, wires, aligners, and orthodontic accessories'),
('Endodontics', 'Root canal instruments, files, and endodontic materials'),
('Periodontics', 'Scalers, curettes, and periodontal therapy instruments'),
('Prosthodontics', 'Crown and bridge materials, denture supplies, and lab equipment'),
('Oral Surgery', 'Surgical instruments, implants, and bone grafting materials');

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers table
CREATE POLICY "Suppliers can view and update their own data"
ON public.suppliers
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Everyone can view active suppliers"
ON public.suppliers
FOR SELECT
USING (is_active = true);

-- RLS policies for product_categories table
CREATE POLICY "Everyone can view product categories"
ON public.product_categories
FOR SELECT
USING (true);

-- RLS policies for products table
CREATE POLICY "Suppliers can manage their own products"
ON public.products
FOR ALL
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
))
WITH CHECK (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

CREATE POLICY "Everyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- RLS policies for supplier_orders table
CREATE POLICY "Suppliers can view their orders"
ON public.supplier_orders
FOR SELECT
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

CREATE POLICY "Dentists can view their orders"
ON public.supplier_orders
FOR SELECT
USING (dentist_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Dentists can create orders"
ON public.supplier_orders
FOR INSERT
WITH CHECK (dentist_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Suppliers can update their orders"
ON public.supplier_orders
FOR UPDATE
USING (supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id = auth.uid()
));

-- RLS policies for supplier_order_items table
CREATE POLICY "Users can view order items for their orders"
ON public.supplier_order_items
FOR SELECT
USING (order_id IN (
  SELECT id FROM public.supplier_orders 
  WHERE supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
  OR dentist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Dentists can create order items"
ON public.supplier_order_items
FOR INSERT
WITH CHECK (order_id IN (
  SELECT id FROM public.supplier_orders 
  WHERE dentist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

-- RLS policies for supplier_reviews table
CREATE POLICY "Everyone can view reviews"
ON public.supplier_reviews
FOR SELECT
USING (true);

CREATE POLICY "Dentists can create reviews"
ON public.supplier_reviews
FOR INSERT
WITH CHECK (reviewer_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for supplier_messages table
CREATE POLICY "Suppliers and dentists can view their messages"
ON public.supplier_messages
FOR SELECT
USING (
  supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
  OR dentist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Suppliers and dentists can create messages"
ON public.supplier_messages
FOR INSERT
WITH CHECK (
  (sender_type = 'supplier' AND supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()))
  OR (sender_type = 'dentist' AND dentist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Add indexes for better performance
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_supplier_orders_supplier_id ON public.supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_dentist_id ON public.supplier_orders(dentist_id);
CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(status);
CREATE INDEX idx_supplier_order_items_order_id ON public.supplier_order_items(order_id);
CREATE INDEX idx_supplier_order_items_product_id ON public.supplier_order_items(product_id);
CREATE INDEX idx_supplier_reviews_supplier_id ON public.supplier_reviews(supplier_id);
CREATE INDEX idx_supplier_messages_supplier_id ON public.supplier_messages(supplier_id);
CREATE INDEX idx_supplier_messages_dentist_id ON public.supplier_messages(dentist_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at
  BEFORE UPDATE ON public.supplier_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_reviews_updated_at
  BEFORE UPDATE ON public.supplier_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();