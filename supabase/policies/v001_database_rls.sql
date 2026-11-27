-- =============================================================================
-- Policies v001: Database Row-Level Security Audit & Reference
-- =============================================================================

-- Verify RLS is enabled on every user table in public schema
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all active policies in public schema
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
