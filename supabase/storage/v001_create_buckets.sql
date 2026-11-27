-- =============================================================================
-- Storage v001: Create & Verify Supabase Storage Buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media', 'media', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','video/mp4','video/webm']),
  ('gallery', 'gallery', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('events', 'events', TRUE, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('blogs', 'blogs', TRUE, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('documents', 'documents', FALSE, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
