-- =============================================================================
-- Queries v002: Folder-Based Gallery & Media Queries (Paginated)
-- =============================================================================

-- List published gallery folders with optional category & year filtering
SELECT
  id, slug, title_en, title_ta, description_en, description_ta,
  category, event_date, event_year, location_en, location_ta,
  cover_image_url, preview_images, item_count
FROM public.gallery_folders
WHERE status = 'published'
  AND ($1::text IS NULL OR category = $1)
  AND ($2::int IS NULL OR event_year = $2)
ORDER BY sort_order ASC, event_date DESC NULLS LAST, created_at DESC
LIMIT $3 OFFSET $4;

-- Fetch folder details + paginated media items by folder slug
SELECT
  f.id, f.slug, f.title_en, f.title_ta, f.description_en, f.description_ta,
  f.category, f.event_date, f.event_year, f.location_en, f.location_ta, f.item_count
FROM public.gallery_folders f
WHERE f.slug = $1 AND f.status = 'published'
LIMIT 1;

SELECT
  id, folder_id, media_type, file_url, thumbnail_url,
  title_en, title_ta, caption_en, caption_ta, alt_text_en, alt_text_ta,
  width, height, duration_seconds, sort_order, created_at
FROM public.gallery_items
WHERE folder_id = $1 AND is_visible = TRUE
ORDER BY sort_order ASC, created_at DESC
LIMIT $2 OFFSET $3;

-- Fetch distinct years & categories for filter chips
SELECT DISTINCT category
FROM public.gallery_folders
WHERE status = 'published'
ORDER BY category ASC;

SELECT DISTINCT event_year
FROM public.gallery_folders
WHERE status = 'published' AND event_year IS NOT NULL
ORDER BY event_year DESC;
