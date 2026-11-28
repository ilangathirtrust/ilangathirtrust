-- =============================================================================
-- Migration v013: Support Supabase sb_secret_* keys in get_admin_dashboard_summary()
-- When PostgREST connects with sb_secret_* instead of a legacy service_role JWT,
-- request.jwt.claim.role is unset while the database session runs as role
-- `service_role`. Check current_user / role in addition to JWT claim & admin check.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role')
     AND COALESCE(current_setting('role', true), '') <> 'service_role'
     AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
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

INSERT INTO public.schema_migrations (version, description)
VALUES ('v013', 'Allow sb_secret_* service_role database sessions in get_admin_dashboard_summary')
ON CONFLICT (version) DO NOTHING;
