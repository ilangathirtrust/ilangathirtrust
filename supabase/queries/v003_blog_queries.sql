-- =============================================================================
-- Queries v003: Blog Listing, Detail, Search & Related Articles
-- =============================================================================

-- Paginated published blog posts with category join and search
SELECT
  p.id, p.slug, p.title_en, p.title_ta, p.excerpt_en, p.excerpt_ta,
  p.featured_image_url, p.featured_image_alt_en, p.featured_image_alt_ta,
  p.tags, p.author_name, p.reading_time_minutes, p.is_featured, p.published_at,
  c.slug AS category_slug, c.name_en AS category_name_en, c.name_ta AS category_name_ta
FROM public.blog_posts p
LEFT JOIN public.blog_categories c ON c.id = p.category_id
WHERE p.status = 'published'
  AND ($1::text IS NULL OR c.slug = $1)
  AND (
    $2::text IS NULL
    OR p.title_en ILIKE '%' || $2 || '%'
    OR p.title_ta ILIKE '%' || $2 || '%'
    OR p.excerpt_en ILIKE '%' || $2 || '%'
  )
ORDER BY p.is_featured DESC, p.published_at DESC NULLS LAST
LIMIT $3 OFFSET $4;

-- Single blog detail by slug
SELECT
  p.*,
  c.slug AS category_slug, c.name_en AS category_name_en, c.name_ta AS category_name_ta
FROM public.blog_posts p
LEFT JOIN public.blog_categories c ON c.id = p.category_id
WHERE p.slug = $1 AND p.status = 'published'
LIMIT 1;

-- Related blog posts (same category, excluding current post)
SELECT
  id, slug, title_en, title_ta, excerpt_en, excerpt_ta,
  featured_image_url, featured_image_alt_en, featured_image_alt_ta,
  reading_time_minutes, published_at
FROM public.blog_posts
WHERE status = 'published'
  AND id <> $1
  AND ($2::uuid IS NULL OR category_id = $2)
ORDER BY published_at DESC NULLS LAST
LIMIT 3;
