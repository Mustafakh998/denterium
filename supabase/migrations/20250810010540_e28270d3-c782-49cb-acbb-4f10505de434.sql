-- Create dentist_licenses table for clinic and dentist licenses
CREATE TABLE IF NOT EXISTS public.dentist_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clinic_id uuid,
  license_type text NOT NULL, -- e.g., 'clinic', 'dentist'
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

-- Policies: users manage their own licenses
CREATE POLICY IF NOT EXISTS "Users can view their own licenses"
ON public.dentist_licenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own licenses"
ON public.dentist_licenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own licenses"
ON public.dentist_licenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own licenses"
ON public.dentist_licenses
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to keep updated_at current
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

-- Storage buckets for product images and licenses attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('licenses', 'licenses', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images (public read, authenticated write)
CREATE POLICY IF NOT EXISTS "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Storage policies for licenses (private per user folder)
CREATE POLICY IF NOT EXISTS "Users can view own licenses files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'licenses' AND (
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Users can upload own licenses files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'licenses' AND (
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Users can update own licenses files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'licenses' AND (
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Super admins can view all clinics (fix empty clinics tab)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clinics' AND policyname = 'Super admins can view all clinics'
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
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Super admins can manage all suppliers'
  ) THEN
    CREATE POLICY "Super admins can manage all suppliers"
    ON public.suppliers
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;
END$$;