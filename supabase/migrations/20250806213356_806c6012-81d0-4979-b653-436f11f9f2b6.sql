-- Add missing RLS policies for tables that have RLS enabled but no policies

-- Supplier messages policies
CREATE POLICY "Suppliers can view their messages"
ON public.supplier_messages
FOR SELECT
USING (supplier_id IN (
  SELECT suppliers.id
  FROM suppliers
  WHERE suppliers.user_id = auth.uid()
) OR dentist_id = auth.uid());

CREATE POLICY "Suppliers and dentists can manage messages"
ON public.supplier_messages
FOR INSERT
WITH CHECK (supplier_id IN (
  SELECT suppliers.id
  FROM suppliers
  WHERE suppliers.user_id = auth.uid()
) OR dentist_id = auth.uid());

CREATE POLICY "Suppliers and dentists can update messages"
ON public.supplier_messages
FOR UPDATE
USING (supplier_id IN (
  SELECT suppliers.id
  FROM suppliers
  WHERE suppliers.user_id = auth.uid()
) OR dentist_id = auth.uid());

-- Supplier order items policies
CREATE POLICY "Suppliers can view their order items"
ON public.supplier_order_items
FOR SELECT
USING (order_id IN (
  SELECT supplier_orders.id
  FROM supplier_orders
  WHERE supplier_orders.supplier_id IN (
    SELECT suppliers.id
    FROM suppliers
    WHERE suppliers.user_id = auth.uid()
  )
));

CREATE POLICY "Suppliers can manage their order items"
ON public.supplier_order_items
FOR ALL
USING (order_id IN (
  SELECT supplier_orders.id
  FROM supplier_orders
  WHERE supplier_orders.supplier_id IN (
    SELECT suppliers.id
    FROM suppliers
    WHERE suppliers.user_id = auth.uid()
  )
))
WITH CHECK (order_id IN (
  SELECT supplier_orders.id
  FROM supplier_orders
  WHERE supplier_orders.supplier_id IN (
    SELECT suppliers.id
    FROM suppliers
    WHERE suppliers.user_id = auth.uid()
  )
));