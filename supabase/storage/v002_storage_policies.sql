-- =============================================================================
-- Storage v002: Storage Object Access Policies
-- =============================================================================

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
