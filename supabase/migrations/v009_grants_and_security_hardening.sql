-- =============================================================================
-- Migration v009: Role Grants & Security Hardening
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- Run in Supabase SQL Editor with "Run without RLS"
-- =============================================================================

-- 1. Grant schema, table, sequence, and routine privileges for Supabase roles
--    (Access for anon & authenticated remains strictly governed by RLS policies)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO postgres, service_role;

-- 2. Harden helper & trigger functions with explicit search_path
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.normalize_slug(TEXT) SET search_path = public;
ALTER FUNCTION public.sync_gallery_folder_stats() SET search_path = public;
ALTER FUNCTION public.assign_donation_receipt() SET search_path = public;

-- 3. Lock down get_admin_dashboard_summary() to service_role and active admins only
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'total_donations_paise', COALESCE((SELECT SUM(amount_paise) FROM public.donations WHERE status = 'paid'), 0),
    'paid_donations_count', (SELECT COUNT(*) FROM public.donations WHERE status = 'paid'),
    'pending_donations_count', (SELECT COUNT(*) FROM public.donations WHERE status IN ('created', 'pending')),
    'failed_donations_count', (SELECT COUNT(*) FROM public.donations WHERE status = 'failed'),
    'published_activities', (SELECT COUNT(*) FROM public.activities WHERE status = 'published'),
    'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE status = 'published' AND event_date >= CURRENT_DATE),
    'past_events', (SELECT COUNT(*) FROM public.events WHERE status = 'published' AND event_date < CURRENT_DATE),
    'published_blogs', (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published'),
    'draft_blogs', (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'draft'),
    'gallery_folders', (SELECT COUNT(*) FROM public.gallery_folders WHERE status = 'published'),
    'gallery_items', (SELECT COUNT(*) FROM public.gallery_items WHERE is_visible = TRUE),
    'new_enquiries', (SELECT COUNT(*) FROM public.contact_enquiries WHERE status = 'new'),
    'new_volunteers', (SELECT COUNT(*) FROM public.volunteer_applications WHERE status = 'new')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_summary() TO authenticated, service_role;

-- 4. Remove redundant permissive SELECT policy on donations (covered by FOR ALL)
DROP POLICY IF EXISTS "Admins read donations" ON public.donations;

-- 5. Route contact & volunteer inserts strictly through Express API (service_role)
DROP POLICY IF EXISTS "Anyone can submit contact enquiry" ON public.contact_enquiries;
DROP POLICY IF EXISTS "Anyone can submit volunteer application" ON public.volunteer_applications;

-- 6. Add admin-only read policy on schema_migrations
DROP POLICY IF EXISTS "Admins read schema migrations" ON public.schema_migrations;
CREATE POLICY "Admins read schema migrations"
  ON public.schema_migrations FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 7. Scope storage UPDATE/DELETE policies strictly to project buckets
DROP POLICY IF EXISTS "Admins update storage objects" ON storage.objects;
CREATE POLICY "Admins update storage objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
    AND public.is_active_admin()
  )
  WITH CHECK (
    bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
    AND public.is_active_admin()
  );

DROP POLICY IF EXISTS "Admins delete storage objects" ON storage.objects;
CREATE POLICY "Admins delete storage objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
    AND public.is_active_admin()
  );

INSERT INTO public.schema_migrations (version, description)
VALUES ('v009', 'Role grants for service_role/anon/authenticated and RLS security hardening')
ON CONFLICT (version) DO NOTHING;
