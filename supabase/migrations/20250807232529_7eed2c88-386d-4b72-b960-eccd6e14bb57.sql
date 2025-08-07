-- Add supplier_id to subscriptions and policies for suppliers
-- 1) Add column and index
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS supplier_id uuid;

CREATE INDEX IF NOT EXISTS idx_subscriptions_supplier_id ON public.subscriptions(supplier_id);

-- 2) RLS policy: allow suppliers to view their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Suppliers can view their subscription'
  ) THEN
    CREATE POLICY "Suppliers can view their subscription"
    ON public.subscriptions
    FOR SELECT
    USING (
      supplier_id IN (
        SELECT suppliers.id FROM public.suppliers WHERE suppliers.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 3) Note: inserts/updates are performed by edge functions using service role; no extra policies needed.
