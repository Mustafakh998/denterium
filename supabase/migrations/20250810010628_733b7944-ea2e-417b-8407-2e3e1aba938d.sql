-- Create dentist_licenses table if not exists
CREATE TABLE IF NOT EXISTS public.dentist_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clinic_id uuid,
  license_type text NOT NULL,
  license_number text,
  issuer text,
  issue_date date,
  expiry_date date,
  attachment_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dentist_licenses ENABLE ROW LEVEL SECURITY;

-- Policies using DO blocks to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dentist_licenses' AND policyname='Users can view their own licenses'
  ) THEN
    CREATE POLICY "Users can view their own licenses"
    ON public.dentist_licenses
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dentist_licenses' AND policyname='Users can insert their own licenses'
  ) THEN
    CREATE POLICY "Users can insert their own licenses"
    ON public.dentist_licenses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dentist_licenses' AND policyname='Users can update their own licenses'
  ) THEN
    CREATE POLICY "Users can update their own licenses"
    ON public.dentist_licenses
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dentist_licenses' AND policyname='Users can delete their own licenses'
  ) THEN
    CREATE POLICY "Users can delete their own licenses"
    ON public.dentist_licenses
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Ensure update trigger exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_dentist_licenses_updated_at ON public.dentist_licenses;
CREATE TRIGGER trg_update_dentist_licenses_updated_at
BEFORE UPDATE ON public.dentist_licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets if missing
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('licenses', 'licenses', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (use DO blocks to avoid duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can view product images'
  ) THEN
    CREATE POLICY "Public can view product images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated can upload product images'
  ) THEN
    CREATE POLICY "Authenticated can upload product images"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated can update own product images'
  ) THEN
    CREATE POLICY "Authenticated can update own product images"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view own licenses files'
  ) THEN
    CREATE POLICY "Users can view own licenses files"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own licenses files'
  ) THEN
    CREATE POLICY "Users can upload own licenses files"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own licenses files'
  ) THEN
    CREATE POLICY "Users can update own licenses files"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END$$;

-- Super admins can view all clinics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinics' AND policyname='Super admins can view all clinics'
  ) THEN
    CREATE POLICY "Super admins can view all clinics"
    ON public.clinics
    FOR SELECT
    USING (is_super_admin());
  END IF;
END$$;

-- Super admins manage suppliers fully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='Super admins can manage all suppliers'
  ) THEN
    CREATE POLICY "Super admins can manage all suppliers"
    ON public.suppliers
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;
END$$;