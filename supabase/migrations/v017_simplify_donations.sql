-- =============================================================================
-- Migration v017: Simplify Donations Schema (3-field checkout: Name, Mobile, Optional Email)
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

ALTER TABLE public.donations
  ALTER COLUMN donor_email DROP NOT NULL,
  ALTER COLUMN donor_email SET DEFAULT '',
  ALTER COLUMN donor_phone SET DEFAULT '';

UPDATE public.donations SET donor_email = '' WHERE donor_email IS NULL;
UPDATE public.donations SET donor_phone = '' WHERE donor_phone IS NULL;

ALTER TABLE public.donations
  DROP COLUMN IF EXISTS donor_pan,
  DROP COLUMN IF EXISTS donor_address,
  DROP COLUMN IF EXISTS is_anonymous;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v017', 'Simplify donations schema: optional email, remove PAN, address, and anonymous columns')
ON CONFLICT (version) DO NOTHING;
