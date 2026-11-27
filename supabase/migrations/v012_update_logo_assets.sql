-- =============================================================================
-- Ilangathir Trust - Migration v012: Update Brand Logo & Favicon Asset Paths
-- Incremental migration for databases that already ran v003..v011 before
-- v003 seed defaults were updated to /logos/*.
-- Safe and idempotent: preserves custom uploaded http(s):// brand URLs.
-- =============================================================================

INSERT INTO public.site_settings (key, category, value_en, value_ta, json_value, is_public)
VALUES
  ('logo_url', 'brand', '/logos/logo.png', '/logos/logo.png', NULL, TRUE),
  ('favicon_url', 'brand', '/logos/favicon.ico', '/logos/favicon.ico', NULL, TRUE)
ON CONFLICT (key) DO NOTHING;

UPDATE public.site_settings
SET
  value_en = CASE
    WHEN COALESCE(BTRIM(value_en), '') = '' OR value_en LIKE '/assets/%' OR value_en LIKE '/icons/%'
      THEN '/logos/logo.png'
    ELSE value_en
  END,
  value_ta = CASE
    WHEN COALESCE(BTRIM(value_ta), '') = '' OR value_ta LIKE '/assets/%' OR value_ta LIKE '/icons/%'
      THEN '/logos/logo.png'
    ELSE value_ta
  END
WHERE key = 'logo_url';

UPDATE public.site_settings
SET
  value_en = CASE
    WHEN COALESCE(BTRIM(value_en), '') = '' OR value_en LIKE '/assets/%' OR value_en LIKE '/icons/%'
      THEN '/logos/favicon.ico'
    ELSE value_en
  END,
  value_ta = CASE
    WHEN COALESCE(BTRIM(value_ta), '') = '' OR value_ta LIKE '/assets/%' OR value_ta LIKE '/icons/%'
      THEN '/logos/favicon.ico'
    ELSE value_ta
  END
WHERE key = 'favicon_url';

INSERT INTO public.schema_migrations (version, description)
VALUES ('v012', 'Update legacy brand logo_url and favicon_url defaults to /logos/* assets')
ON CONFLICT (version) DO NOTHING;
