-- =============================================================================
-- Migration v007: Database Row-Level Security & Storage Policies
-- Project: Ilangathir Trust (ilangathirtrust.com)
-- =============================================================================

-- Enable RLS across all public tables
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marquee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_webhooks ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (only published/visible/public rows)
DROP POLICY IF EXISTS "Public read public site settings" ON public.site_settings;
CREATE POLICY "Public read public site settings"
  ON public.site_settings FOR SELECT
  USING (is_public = TRUE OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read visible navigation" ON public.navigation_items;
CREATE POLICY "Public read visible navigation"
  ON public.navigation_items FOR SELECT
  USING (is_visible = TRUE OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage navigation" ON public.navigation_items;
CREATE POLICY "Admins manage navigation"
  ON public.navigation_items FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read published pages" ON public.page_contents;
CREATE POLICY "Public read published pages"
  ON public.page_contents FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage pages" ON public.page_contents;
CREATE POLICY "Admins manage pages"
  ON public.page_contents FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage content versions" ON public.content_versions;
CREATE POLICY "Admins manage content versions"
  ON public.content_versions FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read published activities" ON public.activities;
CREATE POLICY "Public read published activities"
  ON public.activities FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage activities" ON public.activities;
CREATE POLICY "Admins manage activities"
  ON public.activities FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read active team members" ON public.team_members;
CREATE POLICY "Public read active team members"
  ON public.team_members FOR SELECT
  USING (is_active = TRUE OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
CREATE POLICY "Admins manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Contact & Volunteer forms: public insert allowed via API/RLS, read/update/delete admin-only
DROP POLICY IF EXISTS "Anyone can submit contact enquiry" ON public.contact_enquiries;
CREATE POLICY "Anyone can submit contact enquiry"
  ON public.contact_enquiries FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage contact enquiries" ON public.contact_enquiries;
CREATE POLICY "Admins manage contact enquiries"
  ON public.contact_enquiries FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Anyone can submit volunteer application" ON public.volunteer_applications;
CREATE POLICY "Anyone can submit volunteer application"
  ON public.volunteer_applications FOR INSERT
  WITH CHECK (consent = TRUE);

DROP POLICY IF EXISTS "Admins manage volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins manage volunteer applications"
  ON public.volunteer_applications FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Media, Gallery, Events, Marquee, Blogs
DROP POLICY IF EXISTS "Public read media assets" ON public.media_assets;
CREATE POLICY "Public read media assets"
  ON public.media_assets FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins manage media assets" ON public.media_assets;
CREATE POLICY "Admins manage media assets"
  ON public.media_assets FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read published gallery folders" ON public.gallery_folders;
CREATE POLICY "Public read published gallery folders"
  ON public.gallery_folders FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage gallery folders" ON public.gallery_folders;
CREATE POLICY "Admins manage gallery folders"
  ON public.gallery_folders FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read visible gallery items" ON public.gallery_items;
CREATE POLICY "Public read visible gallery items"
  ON public.gallery_items FOR SELECT
  USING (
    (is_visible = TRUE AND EXISTS (
      SELECT 1 FROM public.gallery_folders f
      WHERE f.id = folder_id AND f.status = 'published'
    ))
    OR public.is_active_admin()
  );

DROP POLICY IF EXISTS "Admins manage gallery items" ON public.gallery_items;
CREATE POLICY "Admins manage gallery items"
  ON public.gallery_items FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read published events" ON public.events;
CREATE POLICY "Public read published events"
  ON public.events FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read active marquee" ON public.marquee_items;
CREATE POLICY "Public read active marquee"
  ON public.marquee_items FOR SELECT
  USING (is_active = TRUE OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage marquee" ON public.marquee_items;
CREATE POLICY "Admins manage marquee"
  ON public.marquee_items FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read blog categories" ON public.blog_categories;
CREATE POLICY "Public read blog categories"
  ON public.blog_categories FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins manage blog categories" ON public.blog_categories;
CREATE POLICY "Admins manage blog categories"
  ON public.blog_categories FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Public read published blog posts" ON public.blog_posts;
CREATE POLICY "Public read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- Donations & Webhooks: strictly private to admins (public writes happen via Express API with service role)
DROP POLICY IF EXISTS "Admins read donations" ON public.donations;
CREATE POLICY "Admins read donations"
  ON public.donations FOR SELECT TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'admin']::public.admin_role[]));

DROP POLICY IF EXISTS "Super admins manage donations" ON public.donations;
CREATE POLICY "Super admins manage donations"
  ON public.donations FOR ALL TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'admin']::public.admin_role[]))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'admin']::public.admin_role[]));

DROP POLICY IF EXISTS "Admins read donation webhooks" ON public.donation_webhooks;
CREATE POLICY "Admins read donation webhooks"
  ON public.donation_webhooks FOR SELECT TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'admin']::public.admin_role[]));

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media', 'media', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','video/mp4','video/webm']),
  ('gallery', 'gallery', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('events', 'events', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('blogs', 'blogs', TRUE, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('documents', 'documents', FALSE, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read public storage buckets" ON storage.objects;
CREATE POLICY "Public read public storage buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('media', 'gallery', 'events', 'blogs'));

DROP POLICY IF EXISTS "Admins upload to storage buckets" ON storage.objects;
CREATE POLICY "Admins upload to storage buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
    AND public.is_active_admin()
  );

DROP POLICY IF EXISTS "Admins update storage objects" ON storage.objects;
CREATE POLICY "Admins update storage objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins delete storage objects" ON storage.objects;
CREATE POLICY "Admins delete storage objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (public.is_active_admin());

INSERT INTO public.schema_migrations (version, description)
VALUES ('v007', 'Database RLS policies and Supabase Storage bucket policies')
ON CONFLICT (version) DO NOTHING;
