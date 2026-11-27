-- =============================================================================
-- Queries v001: Website Content, Settings, Navigation & Forms
-- =============================================================================

-- Fetch public site bootstrap payload (settings + navigation)
SELECT key, category, value_en, value_ta, json_value
FROM public.site_settings
WHERE is_public = TRUE;

SELECT id, menu_location, label_en, label_ta, href, icon_name, sort_order, open_in_new_tab
FROM public.navigation_items
WHERE is_visible = TRUE
ORDER BY menu_location, sort_order ASC;

-- Fetch published page content + FAQs + SEO metadata by slug
SELECT
  slug, page_name,
  hero_eyebrow_en, hero_eyebrow_ta,
  hero_title_en, hero_title_ta,
  hero_subtitle_en, hero_subtitle_ta,
  hero_image_url,
  hero_cta_primary_en, hero_cta_primary_ta, hero_cta_primary_href,
  hero_cta_secondary_en, hero_cta_secondary_ta, hero_cta_secondary_href,
  body_sections, faqs,
  seo_title_en, seo_title_ta,
  seo_description_en, seo_description_ta,
  seo_keywords_en, seo_keywords_ta,
  og_image_url, updated_at
FROM public.page_contents
WHERE slug = $1 AND status = 'published'
LIMIT 1;

-- Fetch published activities (paginated)
SELECT
  id, slug, title_en, title_ta, summary_en, summary_ta,
  description_en, description_ta, category, image_url,
  activity_date, location_en, location_ta, impact_metric, is_featured
FROM public.activities
WHERE status = 'published'
ORDER BY is_featured DESC, sort_order ASC, activity_date DESC NULLS LAST
LIMIT $1 OFFSET $2;

-- Fetch version history for a content entity
SELECT id, version_number, snapshot, change_note, changed_by_email, created_at
FROM public.content_versions
WHERE entity_type = $1 AND entity_id = $2
ORDER BY version_number DESC
LIMIT 25;
