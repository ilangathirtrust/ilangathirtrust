-- =============================================================================
-- Migration v002: Admin Authentication, RBAC Roles & Audit Logs
-- Project: Ilangathir Trust (ilangathirtrust.com)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'editor');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Administrator',
  role public.admin_role NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security helper: check if current authenticated user is an active admin/editor
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_active = TRUE
  );
$$;

-- Security helper: check if current authenticated user holds one of allowed roles
CREATE OR REPLACE FUNCTION public.has_admin_role(allowed_roles public.admin_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_active = TRUE
      AND au.role = ANY(allowed_roles)
  );
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view own or all admin profiles" ON public.admin_users;
CREATE POLICY "Admins can view own or all admin profiles"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_admin_role(ARRAY['super_admin', 'admin']::public.admin_role[]));

DROP POLICY IF EXISTS "Super admins manage admin users" ON public.admin_users;
CREATE POLICY "Super admins manage admin users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin']::public.admin_role[]))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin']::public.admin_role[]));

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

DROP POLICY IF EXISTS "Active admins can append audit logs" ON public.audit_logs;
CREATE POLICY "Active admins can append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

INSERT INTO public.schema_migrations (version, description)
VALUES ('v002', 'Admin RBAC users, helper functions, and audit logs')
ON CONFLICT (version) DO NOTHING;
