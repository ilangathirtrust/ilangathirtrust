-- =============================================================================
-- Migration v008: Indexes, Search Acceleration & Free-Plan Optimisations
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

-- Navigation lookup
CREATE INDEX IF NOT EXISTS idx_nav_location_order
  ON public.navigation_items (menu_location, sort_order)
  WHERE is_visible = TRUE;

-- Content version history lookup
CREATE INDEX IF NOT EXISTS idx_content_versions_entity
  ON public.content_versions (entity_type, entity_id, version_number DESC);

-- Activities listing
CREATE INDEX IF NOT EXISTS idx_activities_published
  ON public.activities (is_featured DESC, sort_order ASC, activity_date DESC NULLS LAST)
  WHERE status = 'published';

-- Events upcoming / past filtering
CREATE INDEX IF NOT EXISTS idx_events_published_date
  ON public.events (status, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_category
  ON public.events (category, event_date DESC)
  WHERE status = 'published';

-- Gallery folder filtering & pagination
CREATE INDEX IF NOT EXISTS idx_gallery_folders_filter
  ON public.gallery_folders (status, category, event_year DESC, event_date DESC NULLS LAST, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_gallery_items_folder_order
  ON public.gallery_items (folder_id, sort_order ASC, created_at DESC)
  WHERE is_visible = TRUE;

-- Blog listing, category filter, and trigram text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_blog_posts_category
  ON public.blog_posts (category_id, published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin
  ON public.blog_posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm
  ON public.blog_posts USING GIN (title_en gin_trgm_ops);

-- Donations reporting & webhook idempotency
CREATE INDEX IF NOT EXISTS idx_donations_status_created
  ON public.donations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donations_paid_at
  ON public.donations (paid_at DESC)
  WHERE status = 'paid';

-- Enquiries & Volunteers inbox
CREATE INDEX IF NOT EXISTS idx_enquiries_status_created
  ON public.contact_enquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_volunteers_status_created
  ON public.volunteer_applications (status, created_at DESC);

-- Audit logs timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON public.audit_logs (created_at DESC);

-- Media library filter
CREATE INDEX IF NOT EXISTS idx_media_assets_folder_cat
  ON public.media_assets (folder_name, category, media_type, created_at DESC);

-- Aggregated lightweight dashboard stats RPC (1 database call instead of 10)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
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
$$;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v008', 'Performance indexes, trigram search, and consolidated dashboard RPC')
ON CONFLICT (version) DO NOTHING;
