-- =============================================================================
-- Storage v003: Storage Optimization, Cleanup & Egress Audit Queries
-- =============================================================================

-- Audit total storage footprint per bucket (keep well under Supabase Free Plan 1GB limit)
SELECT
  bucket_id,
  COUNT(*) AS object_count,
  ROUND(COALESCE(SUM((metadata->>'size')::bigint), 0) / 1048576.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
GROUP BY bucket_id
ORDER BY total_mb DESC;

-- Find orphaned storage objects not referenced in media_assets
SELECT o.bucket_id, o.name, o.created_at
FROM storage.objects o
LEFT JOIN public.media_assets ma
  ON ma.bucket = o.bucket_id AND ma.storage_path = o.name
WHERE o.bucket_id IN ('media', 'gallery', 'events', 'blogs', 'documents')
  AND ma.id IS NULL
ORDER BY o.created_at DESC;
