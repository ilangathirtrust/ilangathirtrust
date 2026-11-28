-- =============================================================================
-- Migration v014: Switch brand logo_url setting to /logos/logo.webp
-- =============================================================================

UPDATE public.site_settings
SET
  value_en = CASE
    WHEN COALESCE(BTRIM(value_en), '') = '' OR value_en LIKE '/assets/%' OR value_en LIKE '/icons/%' OR value_en = '/logos/logo.png'
      THEN '/logos/logo.webp'
    ELSE value_en
  END,
  value_ta = CASE
    WHEN COALESCE(BTRIM(value_ta), '') = '' OR value_ta LIKE '/assets/%' OR value_ta LIKE '/icons/%' OR value_ta = '/logos/logo.png'
      THEN '/logos/logo.webp'
    ELSE value_ta
  END
WHERE key = 'logo_url';

INSERT INTO public.schema_migrations (version, description)
VALUES ('v014', 'Update brand logo_url setting from PNG to /logos/logo.webp')
ON CONFLICT (version) DO NOTHING;
