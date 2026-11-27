-- =============================================================================
-- Queries v004: Upcoming & Past Events + Linked Gallery Folders
-- =============================================================================

-- Upcoming events (event_date >= CURRENT_DATE)
SELECT
  e.id, e.slug, e.title_en, e.title_ta, e.summary_en, e.summary_ta,
  e.category, e.event_date, e.start_time, e.end_time,
  e.location_en, e.location_ta, e.banner_url, e.is_featured,
  gf.slug AS gallery_folder_slug
FROM public.events e
LEFT JOIN public.gallery_folders gf ON gf.id = e.gallery_folder_id AND gf.status = 'published'
WHERE e.status = 'published'
  AND e.event_date >= CURRENT_DATE
  AND ($1::text IS NULL OR e.category = $1)
ORDER BY e.event_date ASC
LIMIT $2 OFFSET $3;

-- Previous / completed events (event_date < CURRENT_DATE)
SELECT
  e.id, e.slug, e.title_en, e.title_ta, e.summary_en, e.summary_ta,
  e.category, e.event_date, e.start_time, e.end_time,
  e.location_en, e.location_ta, e.banner_url, e.is_featured,
  gf.slug AS gallery_folder_slug
FROM public.events e
LEFT JOIN public.gallery_folders gf ON gf.id = e.gallery_folder_id AND gf.status = 'published'
WHERE e.status = 'published'
  AND e.event_date < CURRENT_DATE
  AND ($1::text IS NULL OR e.category = $1)
ORDER BY e.event_date DESC
LIMIT $2 OFFSET $3;

-- Single event detail with linked gallery items preview
SELECT
  e.*,
  gf.slug AS gallery_folder_slug,
  gf.title_en AS gallery_folder_title_en,
  gf.title_ta AS gallery_folder_title_ta
FROM public.events e
LEFT JOIN public.gallery_folders gf ON gf.id = e.gallery_folder_id AND gf.status = 'published'
WHERE e.slug = $1 AND e.status = 'published'
LIMIT 1;
