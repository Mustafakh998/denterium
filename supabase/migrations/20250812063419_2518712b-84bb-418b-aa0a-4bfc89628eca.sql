-- Deduplicate suppliers by user_id, keeping the latest row
WITH ranked AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.suppliers
  WHERE user_id IS NOT NULL
)
DELETE FROM public.suppliers s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;

-- Enforce uniqueness: one supplier row per user
ALTER TABLE public.suppliers
ADD CONSTRAINT suppliers_user_id_unique UNIQUE (user_id);