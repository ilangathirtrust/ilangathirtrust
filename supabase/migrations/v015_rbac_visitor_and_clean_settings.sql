-- =============================================================================
-- Migration v015: Full RBAC (Visitor Role + Protected Owner), Digital Session
-- Signatures, and Frontend-Only Permanent Brand Content Cleanup
-- Run in Supabase SQL Editor ("Run without RLS")
-- =============================================================================

-- 1. Add 'visitor' read-only role to admin_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'admin_role' AND e.enumlabel = 'visitor'
  ) THEN
    ALTER TYPE public.admin_role ADD VALUE 'visitor';
  END IF;
END$$;

-- 2. Ensure primary owner account is permanently active super_admin
UPDATE public.admin_users
SET role = 'super_admin', is_active = TRUE
WHERE LOWER(email) = 'ilangathirtrust@gmail.com';

-- 3. Database-level protection: ilangathirtrust@gmail.com can never be demoted, deactivated, or deleted
CREATE OR REPLACE FUNCTION public.protect_primary_owner_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(OLD.email) = 'ilangathirtrust@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Primary owner account (ilangathirtrust@gmail.com) cannot be deleted.' USING ERRCODE = '42501';
    END IF;
    IF NEW.role <> 'super_admin' OR NEW.is_active IS DISTINCT FROM TRUE OR LOWER(NEW.email) <> 'ilangathirtrust@gmail.com' THEN
      RAISE EXCEPTION 'Primary owner account (ilangathirtrust@gmail.com) must remain an active super_admin.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_admin ON public.admin_users;
CREATE TRIGGER trg_protect_owner_admin
  BEFORE UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.protect_primary_owner_admin();

-- 4. Store HMAC-SHA256 digital session signatures on admin_sessions
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS session_signature TEXT NOT NULL DEFAULT '';

-- 5. Helper excluding read-only 'visitor' accounts from write policies
--    Cast role::TEXT so this entire migration runs safely in a single Supabase SQL Editor transaction
CREATE OR REPLACE FUNCTION public.is_writable_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_active = TRUE
      AND au.role::TEXT <> 'visitor'
  );
$$;

-- 6. Clean permanent trust brand/contact keys from site_settings (kept strictly in frontend)
--    Only operational donation_config remains in site_settings.
DELETE FROM public.site_settings
WHERE key <> 'donation_config';

INSERT INTO public.schema_migrations (version, description)
VALUES ('v015', 'Add visitor RBAC role, protect owner super_admin, add session signatures, remove static site_settings')
ON CONFLICT (version) DO NOTHING;
