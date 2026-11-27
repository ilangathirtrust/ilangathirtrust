-- =============================================================================
-- Migration v001: Initial Schema Setup, Extensions & Trigger Functions
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Schema migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared trigger function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Shared slug normalization helper
CREATE OR REPLACE FUNCTION public.normalize_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(input_text, '')), '[^a-z0-9]+', '-', 'g'));
$$;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v001', 'Initial extensions, shared trigger functions, and migration tracking')
ON CONFLICT (version) DO NOTHING;
