-- =============================================================================
-- Policies v002: Storage RLS Verification Reference
-- =============================================================================

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
