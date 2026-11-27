-- =============================================================================
-- Migration v011: Admin Session & Device Management + Security Event Logs
-- Project: Ilangathir Trust (ilangathirtrust.com)
-- Run in Supabase SQL Editor with "Run without RLS"
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  device_type TEXT NOT NULL DEFAULT 'desktop'
    CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  geo_label TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT NOT NULL DEFAULT '',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active
  ON public.admin_sessions (user_id, is_revoked, last_active_at DESC);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  device_id TEXT NOT NULL DEFAULT '',
  device_name TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  geo_label TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created
  ON public.security_events (user_id, created_at DESC);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view own sessions" ON public.admin_sessions;
CREATE POLICY "Admins view own sessions"
  ON public.admin_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_active_admin());

DROP POLICY IF EXISTS "Admins manage own sessions" ON public.admin_sessions;
CREATE POLICY "Admins manage own sessions"
  ON public.admin_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_active_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_active_admin());

DROP POLICY IF EXISTS "Admins read security events" ON public.security_events;
CREATE POLICY "Admins read security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.is_active_admin())
    OR public.has_admin_role(ARRAY['super_admin']::public.admin_role[])
  );

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.admin_sessions TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.security_events TO postgres, service_role;
GRANT SELECT, UPDATE ON TABLE public.admin_sessions TO authenticated;
GRANT SELECT ON TABLE public.security_events TO authenticated;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v011', 'Admin device session tracking and security event logging')
ON CONFLICT (version) DO NOTHING;
