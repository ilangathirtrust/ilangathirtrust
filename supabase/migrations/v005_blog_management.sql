-- =============================================================================
-- Migration v005: Blog & Article Content Management System
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_ta TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  excerpt_en TEXT NOT NULL DEFAULT '',
  excerpt_ta TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL,
  content_ta TEXT NOT NULL,
  featured_image_url TEXT DEFAULT '',
  featured_image_alt_en TEXT DEFAULT '',
  featured_image_alt_ta TEXT DEFAULT '',
  media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  author_name TEXT NOT NULL DEFAULT 'Ilangathir Trust Editorial',
  author_role TEXT DEFAULT '',
  reading_time_minutes INT NOT NULL DEFAULT 3,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title_en TEXT DEFAULT '',
  seo_title_ta TEXT DEFAULT '',
  seo_description_en TEXT DEFAULT '',
  seo_description_ta TEXT DEFAULT '',
  seo_keywords_en TEXT DEFAULT '',
  seo_keywords_ta TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.blog_categories (slug, name_en, name_ta, description_en, description_ta, sort_order) VALUES
('community-impact', 'Community Impact', 'சமூக தாக்கம்', 'Stories from grassroots outreach and rural empowerment.', 'கிராமப்புற சேவைகள் மற்றும் சமூக மேம்பாட்டுக் கதைகள்.', 1),
('education', 'Education & Youth', 'கல்வி & இளைஞர்', 'Educational scholarships, literacy drives, and mentoring.', 'கல்வி உதவி, மாணவர் வழிகாட்டல் மற்றும் விழிப்புணர்வு.', 2),
('health-wellness', 'Health & Wellness', 'மருத்துவம் & நலன்', 'Free medical camps, eye care, and public health awareness.', 'இலவச மருத்துவ முகாம்கள் மற்றும் சுகாதார விழிப்புணர்வு.', 3),
('environment', 'Environment', 'சுற்றுச்சூழல்', 'Tree plantation and ecological sustainability efforts.', 'மரம் நடுதல் மற்றும் பசுமைப் பாதுகாப்பு முயற்சிகள்.', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v005', 'Bilingual blog categories, posts, and SEO metadata')
ON CONFLICT (version) DO NOTHING;
