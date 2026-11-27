-- =============================================================================
-- Migration v004: Events, Folder-Based Gallery, Media Library & Marquee
-- Project: Ilangathir Trust (ilangathirtrust.com)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL DEFAULT 'media',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  folder_name TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'General',
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  title_en TEXT DEFAULT '',
  title_ta TEXT DEFAULT '',
  alt_text_en TEXT DEFAULT '',
  alt_text_ta TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  description_ta TEXT DEFAULT '',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bucket, storage_path)
);

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.gallery_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_ta TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Events',
  event_date DATE,
  event_year INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM event_date)::INT) STORED,
  location_en TEXT DEFAULT '',
  location_ta TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  preview_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_gallery_folders_updated_at
  BEFORE UPDATE ON public.gallery_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  summary_en TEXT NOT NULL DEFAULT '',
  summary_ta TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL,
  description_ta TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Community Camp',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location_en TEXT NOT NULL DEFAULT '',
  location_ta TEXT NOT NULL DEFAULT '',
  banner_url TEXT DEFAULT '',
  gallery_folder_id UUID REFERENCES public.gallery_folders(id) ON DELETE SET NULL,
  registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title_en TEXT DEFAULT '',
  seo_title_ta TEXT DEFAULT '',
  seo_description_en TEXT DEFAULT '',
  seo_description_ta TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.gallery_folders(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  storage_bucket TEXT DEFAULT 'gallery',
  storage_path TEXT DEFAULT '',
  title_en TEXT DEFAULT '',
  title_ta TEXT DEFAULT '',
  caption_en TEXT DEFAULT '',
  caption_ta TEXT DEFAULT '',
  alt_text_en TEXT DEFAULT '',
  alt_text_ta TEXT DEFAULT '',
  width INT,
  height INT,
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Keep folder item_count & preview_images synchronized automatically
CREATE OR REPLACE FUNCTION public.sync_gallery_folder_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_folder_id UUID;
BEGIN
  target_folder_id := COALESCE(NEW.folder_id, OLD.folder_id);

  UPDATE public.gallery_folders f
  SET
    item_count = (
      SELECT COUNT(*)::INT
      FROM public.gallery_items gi
      WHERE gi.folder_id = target_folder_id AND gi.is_visible = TRUE
    ),
    preview_images = COALESCE((
      SELECT jsonb_agg(sub.thumb)
      FROM (
        SELECT COALESCE(NULLIF(gi.thumbnail_url, ''), gi.file_url) AS thumb
        FROM public.gallery_items gi
        WHERE gi.folder_id = target_folder_id
          AND gi.is_visible = TRUE
          AND gi.media_type = 'image'
        ORDER BY gi.sort_order ASC, gi.created_at DESC
        LIMIT 4
      ) sub
    ), '[]'::jsonb)
  WHERE f.id = target_folder_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_gallery_folder_stats ON public.gallery_items;
CREATE TRIGGER trg_sync_gallery_folder_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_gallery_folder_stats();

CREATE TABLE IF NOT EXISTS public.marquee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL DEFAULT '',
  title_ta TEXT NOT NULL DEFAULT '',
  alt_text_en TEXT NOT NULL DEFAULT '',
  alt_text_ta TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '/gallery',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_marquee_items_updated_at
  BEFORE UPDATE ON public.marquee_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.schema_migrations (version, description)
VALUES ('v004', 'Media assets, folder-based gallery, events, and homepage marquee')
ON CONFLICT (version) DO NOTHING;
