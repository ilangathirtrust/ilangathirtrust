-- =============================================================================
-- Migration v016: Server-Side Google OAuth 2.0 Token Storage for GA4 Data API
-- Encrypted tokens stored exclusively for Edge Function service_role access.
-- Zero anon/authenticated client policies exposed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ga4_oauth_connections (
  id TEXT PRIMARY KEY DEFAULT 'default',
  property_id TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  access_token_enc TEXT NOT NULL DEFAULT '',
  access_token_expires_at TIMESTAMPTZ,
  scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/analytics.readonly',
  connected_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  connected_by_email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ga4_oauth_connections ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke direct access from client roles (service_role bypasses RLS in Edge Functions)
REVOKE ALL ON public.ga4_oauth_connections FROM PUBLIC, anon, authenticated;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v016', 'Add server-side encrypted GA4 OAuth 2.0 connection table')
ON CONFLICT (version) DO NOTHING;
