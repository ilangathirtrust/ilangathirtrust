-- =============================================================================
-- Migration v003: Website Content, Settings, Navigation, Versions & Forms
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  value_en TEXT NOT NULL DEFAULT '',
  value_ta TEXT NOT NULL DEFAULT '',
  json_value JSONB,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_location TEXT NOT NULL CHECK (menu_location IN ('header', 'mobile_bottom', 'footer_explore', 'footer_support')),
  label_en TEXT NOT NULL,
  label_ta TEXT NOT NULL,
  href TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Circle',
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.page_contents (
  slug TEXT PRIMARY KEY,
  page_name TEXT NOT NULL,
  hero_eyebrow_en TEXT NOT NULL DEFAULT '',
  hero_eyebrow_ta TEXT NOT NULL DEFAULT '',
  hero_title_en TEXT NOT NULL DEFAULT '',
  hero_title_ta TEXT NOT NULL DEFAULT '',
  hero_subtitle_en TEXT NOT NULL DEFAULT '',
  hero_subtitle_ta TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  hero_cta_primary_en TEXT DEFAULT '',
  hero_cta_primary_ta TEXT DEFAULT '',
  hero_cta_primary_href TEXT DEFAULT '',
  hero_cta_secondary_en TEXT DEFAULT '',
  hero_cta_secondary_ta TEXT DEFAULT '',
  hero_cta_secondary_href TEXT DEFAULT '',
  body_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title_en TEXT NOT NULL DEFAULT '',
  seo_title_ta TEXT NOT NULL DEFAULT '',
  seo_description_en TEXT NOT NULL DEFAULT '',
  seo_description_ta TEXT NOT NULL DEFAULT '',
  seo_keywords_en TEXT DEFAULT '',
  seo_keywords_ta TEXT DEFAULT '',
  og_image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_page_contents_updated_at
  BEFORE UPDATE ON public.page_contents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_note TEXT DEFAULT '',
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  summary_en TEXT NOT NULL DEFAULT '',
  summary_ta TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL,
  description_ta TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Community Welfare',
  image_url TEXT DEFAULT '',
  activity_date DATE,
  location_en TEXT DEFAULT '',
  location_ta TEXT DEFAULT '',
  impact_metric TEXT DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  designation_en TEXT NOT NULL,
  designation_ta TEXT NOT NULL,
  biography_en TEXT DEFAULT '',
  biography_ta TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  preferred_lang TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en', 'ta')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_contact_enquiries_updated_at
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  district TEXT NOT NULL,
  interest TEXT NOT NULL,
  availability TEXT DEFAULT '',
  message TEXT DEFAULT '',
  preferred_lang TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en', 'ta')),
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'approved', 'closed')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_volunteer_applications_updated_at
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed essential verified trust contact & brand configuration (no mock demos)
INSERT INTO public.site_settings (key, category, value_en, value_ta, json_value, is_public) VALUES
('trust_name', 'brand', 'Ilangathir Trust', 'இளங்கதிர் அறக்கட்டளை', NULL, TRUE),
('trust_legal_name', 'brand', 'Ilangathir Arakattalai', 'இளங்கதிர் அறக்கட்டளை', NULL, TRUE),
('tagline', 'brand', 'Together, We Can Create a Brighter Tomorrow.', 'ஒன்றிணைந்து, நாம் ஒரு ஒளிரும் நாளையை உருவாக்குவோம்.', NULL, TRUE),
('logo_url', 'brand', '/logos/logo.webp', '/logos/logo.webp', NULL, TRUE),
('favicon_url', 'brand', '/logos/favicon.ico', '/logos/favicon.ico', NULL, TRUE),
('phone', 'contact', '+91 93630 15050', '+91 93630 15050', NULL, TRUE),
('email', 'contact', 'ilangathirtrust@gmail.com', 'ilangathirtrust@gmail.com', NULL, TRUE),
('address', 'contact', 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.', 'V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு, இந்தியா.', NULL, TRUE),
('office_hours', 'contact', 'Monday - Saturday: 9:30 AM - 6:00 PM', 'திங்கள் - சனி: காலை 9:30 - மாலை 6:00', NULL, TRUE),
('social_links', 'contact', '', '', '{"facebook":"","instagram":"","youtube":"","whatsapp":"https://wa.me/919363015050"}'::jsonb, TRUE),
('founder_name', 'founder', 'Founder — Ilangathir Trust', 'நிறுவனர் — இளங்கதிர் அறக்கட்டளை', NULL, TRUE),
('founder_role', 'founder', 'Founder & Managing Trustee', 'நிறுவனர் & நிர்வாக அறங்காவலர்', NULL, TRUE),
('founder_bio', 'founder', 'Update the founder profile details from the admin portal.', 'நிறுவனர் பற்றிய விவரங்களை நிர்வாகப் பக்கத்தில் இருந்து புதுப்பிக்கவும்.', NULL, TRUE),
('founder_image_url', 'founder', '/assets/founder.jpg', '/assets/founder.jpg', NULL, TRUE),
('mission_statement', 'about', 'Support student education, healthcare access, and community welfare across Dindigul and neighbouring districts.', 'மாணவர் கல்வி, மருத்துவ உதவி மற்றும் ஊர் நலப் பணிகளைத் தொடர்ந்து செய்தல்.', NULL, TRUE),
('vision_statement', 'about', 'A caring society where every family has access to education, basic healthcare, and dignified living.', 'அனைத்து குடும்பங்களும் கல்வி, மருத்துவம் மற்றும் நலமுடன் வாழும் சமுதாயம்.', NULL, TRUE),
('footer_description', 'footer', 'Ilangathir Trust supports education, rural health camps, tree planting, and community welfare across Tamil Nadu.', 'தமிழ்நாடு முழுவதும் கல்வி உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை செயல்படுகிறது.', NULL, TRUE),
('donation_config', 'donations', '', '', '{"enabled":true,"currency":"INR","suggested_amounts":[500,1000,2500,5000,10000],"purposes":["General Welfare","Education Support","Medical Relief","Environmental Care"]}'::jsonb, TRUE)
ON CONFLICT (key) DO NOTHING;

-- Seed default structured navigation items
INSERT INTO public.navigation_items (menu_location, label_en, label_ta, href, icon_name, sort_order, is_visible)
SELECT * FROM (VALUES
  ('header', 'Home', 'முகப்பு', '/', 'Home', 1, TRUE),
  ('header', 'About', 'எங்களைப் பற்றி', '/about', 'HeartHandshake', 2, TRUE),
  ('header', 'Activities', 'நலப் பணிகள்', '/activities', 'Sparkles', 3, TRUE),
  ('header', 'Events', 'நிகழ்வுகள்', '/events', 'CalendarDays', 4, TRUE),
  ('header', 'Gallery', 'படங்கள்', '/gallery', 'Images', 5, TRUE),
  ('header', 'Stories', 'செய்திகள்', '/blog', 'BookOpen', 6, TRUE),
  ('header', 'Contact', 'தொடர்பு', '/contact', 'Mail', 7, TRUE),
  ('mobile_bottom', 'Home', 'முகப்பு', '/', 'Home', 1, TRUE),
  ('mobile_bottom', 'Events', 'நிகழ்வுகள்', '/events', 'CalendarDays', 2, TRUE),
  ('mobile_bottom', 'Gallery', 'படங்கள்', '/gallery', 'Images', 3, TRUE),
  ('mobile_bottom', 'Stories', 'செய்திகள்', '/blog', 'BookOpen', 4, TRUE),
  ('mobile_bottom', 'Donate', 'நன்கொடை', '/donate', 'Heart', 5, TRUE)
) AS v(menu_location, label_en, label_ta, href, icon_name, sort_order, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.navigation_items);

-- Seed core page CMS records (editable via admin panel)
INSERT INTO public.page_contents (
  slug, page_name,
  hero_eyebrow_en, hero_eyebrow_ta,
  hero_title_en, hero_title_ta,
  hero_subtitle_en, hero_subtitle_ta,
  hero_image_url,
  hero_cta_primary_en, hero_cta_primary_ta, hero_cta_primary_href,
  hero_cta_secondary_en, hero_cta_secondary_ta, hero_cta_secondary_href,
  faqs,
  seo_title_en, seo_title_ta,
  seo_description_en, seo_description_ta
) VALUES
(
  'home', 'Homepage',
  'V. Kallupatti, Dindigul • Tamil Nadu', 'V. கல்லுப்பட்டி, திண்டுக்கல் • தமிழ்நாடு',
  'Serving communities with care and responsibility.', 'நலமான சமுதாயத்தை உருவாக்க, அனைவரும் இணைந்து செயல்படுவோம்.',
  'Ilangathir Trust works across Tamil Nadu to support student education, medical outreach, tree planting, and timely relief for families in need.',
  'கல்வி உதவி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை தொடர்ந்து செயல்பட்டு வருகிறது.',
  '/assets/herosection.png',
  'Donate Now', 'நன்கொடை அளிக்க', '/donate',
  'Our Activities', 'நலப் பணிகள் பார்க்க', '/activities',
  '[{"question_en":"What is Ilangathir Trust?","question_ta":"இளங்கதிர் அறக்கட்டளை என்றால் என்ன?","answer_en":"Ilangathir Trust (Ilangathir Arakattalai) is a registered charitable trust in V. Kallupatti, Dindigul, Tamil Nadu supporting student education, healthcare camps, and local community welfare.","answer_ta":"இளங்கதிர் அறக்கட்டளை என்பது திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியைச் சேர்ந்த பதிவு பெற்ற அறக்கட்டளையாகும். கல்வி உதவி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளைச் செய்து வருகிறோம்."},{"question_en":"How can I donate or volunteer with Ilangathir Trust?","question_ta":"நன்கொடை அளிக்க அல்லது தன்னார்வலராக இணைய என்ன செய்ய வேண்டும்?","answer_en":"You can donate online on our Donate page using UPI, cards, or netbanking, or fill out the volunteer form on our Contact page.","answer_ta":"எங்கள் நன்கொடைப் பக்கத்தில் UPI, கார்டு மூலம் ஆன்லைனில் உதவலாம். தன்னார்வலராக சேர தொடர்பு பக்கத்தில் உங்கள் விவரங்களை அனுப்பலாம்."}]'::jsonb,
  'Ilangathir Trust | Education, Healthcare & Social Welfare in Tamil Nadu',
  'இளங்கதிர் அறக்கட்டளை | கல்வி, மருத்துவம் & சமூக நலப் பணிகள்',
  'Official website of Ilangathir Trust (Ilangathir Arakattalai), V. Kallupatti, Dindigul, Tamil Nadu. Explore our community programmes, events, photo albums, and online donations.',
  'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் இணையதளம். எங்கள் பணிகள், நிகழ்வுகள், படங்கள் மற்றும் நன்கொடை விவரங்களை இங்கே பார்க்கலாம்.'
),
(
  'about', 'About Us',
  'ABOUT THE TRUST', 'அறக்கட்டளை பற்றி',
  'Grounded in service, honesty, and respect for people.', 'மக்களுக்கான அக்கறையுடன், நேர்மையான சேவைப் பயணம்.',
  'Read about the vision, mission, trustees, and values guiding Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் நோக்கம், பார்வை மற்றும் குழுவினரைப் பற்றித் தெரிந்துகொள்ளுங்கள்.',
  '', 'Meet Our Team', 'குழுவைப் பார்க்க', '/about#team', 'Contact Trust', 'தொடர்பு கொள்ள', '/contact',
  '[]'::jsonb,
  'About Us | Ilangathir Trust', 'எங்களைப் பற்றி | இளங்கதிர் அறக்கட்டளை',
  'Learn about the mission, vision, and trustees of Ilangathir Trust in Dindigul, Tamil Nadu.',
  'திண்டுக்கல் இளங்கதிர் அறக்கட்டளையின் நோக்கம் மற்றும் குழுவினர் விவரம்.'
),
(
  'activities', 'Activities',
  'OUR PROGRAMMES', 'எங்கள் நலப் பணிகள்',
  'Community programmes across education, health, and relief.', 'கல்வி, மருத்துவம் மற்றும் சமூக நலத் திட்டங்கள்.',
  'Explore our educational support, rural medical camps, tree planting, and welfare activities.',
  'பள்ளி மாணவர் உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூகப் பணிகளைப் பாருங்கள்.',
  '', 'Volunteer With Us', 'தன்னார்வலராக இணைய', '/contact#volunteer', 'Donate Now', 'நன்கொடை அளிக்க', '/donate',
  '[]'::jsonb,
  'Activities & Programmes | Ilangathir Trust', 'நலப் பணிகள் | இளங்கதிர் அறக்கட்டளை',
  'Community welfare, education support, healthcare, and tree planting programmes by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் கல்வி, மருத்துவம் மற்றும் சமூக நலப் பணிகள்.'
),
(
  'events', 'Events',
  'EVENTS & CAMPS', 'நிகழ்வுகள் & முகாம்கள்',
  'Bringing people together for meaningful local work.', 'ஊர் நலனுக்காக மக்களை இணைக்கும் நிகழ்வுகள்.',
  'See upcoming health camps, student drives, and highlights from completed events.',
  'வரவிருக்கும் மருத்துவ முகாம்கள் மற்றும் நடந்து முடிந்த நிகழ்வுகளின் விவரங்கள்.',
  '', 'Join an Event', 'நிகழ்வில் இணைய', '/contact#volunteer', 'View Gallery', 'படங்களைப் பார்க்க', '/gallery',
  '[]'::jsonb,
  'Events & Programmes | Ilangathir Trust', 'நிகழ்வுகள் | இளங்கதிர் அறக்கட்டளை',
  'Upcoming and past community events, health camps, and welfare drives by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் வரவிருக்கும் மற்றும் முடிந்த நிகழ்வுகள்.'
),
(
  'gallery', 'Gallery',
  'GALLERY', 'படங்கள் & வீடியோ',
  'Photos and videos from our programmes.', 'நமது களப் பணிகளின் படங்கள் & வீடியோக்கள்.',
  'Browse photo and video albums organized by event and year.',
  'நிகழ்வு மற்றும் ஆண்டு வாரியாக எங்கள் படங்களையும் வீடியோக்களையும் பாருங்கள்.',
  '', 'Upcoming Events', 'நிகழ்வுகள்', '/events', 'Donate', 'நன்கொடை', '/donate',
  '[]'::jsonb,
  'Photo & Video Gallery | Ilangathir Trust', 'படங்கள் & வீடியோ | இளங்கதிர் அறக்கட்டளை',
  'Event-wise photo and video albums of Ilangathir Trust programmes and community work.',
  'இளங்கதிர் அறக்கட்டளை நிகழ்வுகளின் புகைப்படங்கள் மற்றும் வீடியோக்கள்.'
),
(
  'blog', 'Stories & News',
  'NEWS & UPDATES', 'செய்திகள் & பதிவுகள்',
  'Field updates, stories, and announcements.', 'களச் செய்திகள், அனுபவங்கள் மற்றும் அறிவிப்புகள்.',
  'Read updates, stories, and notices shared by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் சமீபத்திய செய்திகள் மற்றும் கட்டுரைகளைப் படியுங்கள்.',
  '', 'Read Latest', 'செய்திகள் பார்க்க', '/blog', 'Contact Us', 'தொடர்பு கொள்ள', '/contact',
  '[]'::jsonb,
  'Stories & News | Ilangathir Trust', 'செய்திகள் | இளங்கதிர் அறக்கட்டளை',
  'News, field stories, and community updates from Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் களச் செய்திகள் மற்றும் பதிவுகள்.'
),
(
  'donate', 'Donate',
  'CONTRIBUTE', 'நன்கொடை அளிக்க',
  'Every contribution supports families directly.', 'உங்கள் ஒவ்வொரு உதவியும் நேரடியாக மக்களுக்குச் சேரும்.',
  'Contribute online safely using UPI, cards, or netbanking.',
  'UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் பாதுகாப்பாக நன்கொடை வழங்கலாம்.',
  '', 'Donate Now', 'நன்கொடை அளிக்க', '#donation-checkout', 'View Activities', 'நலப் பணிகள்', '/activities',
  '[{"question_en":"Is online donation secure?","question_ta":"ஆன்லைன் நன்கொடை பாதுகாப்பானதா?","answer_en":"Yes. All payments use encrypted checkout with automatic verification and an official receipt number.","answer_ta":"ஆம். அனைத்து கட்டணங்களும் முழுப் பாதுகாப்போடு சரிபார்க்கப்பட்டு உடனே ரசீது எண் வழங்கப்படும்."}]'::jsonb,
  'Donate to Ilangathir Trust | Online Contributions', 'நன்கொடை | இளங்கதிர் அறக்கட்டளை',
  'Support student education, medical camps, and local welfare through online contributions to Ilangathir Trust.',
  'கல்வி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளுக்கு பாதுகாப்பாக நன்கொடை அளியுங்கள்.'
),
(
  'contact', 'Contact & Volunteer',
  'GET IN TOUCH', 'தொடர்பு கொள்ள',
  'Write to us or join as a volunteer.', 'எங்களுடன் பேசவும் அல்லது தன்னார்வலராக இணையவும்.',
  'Send us a message or submit your details to volunteer with our team in Tamil Nadu.',
  'உங்கள் கேள்விகளை அனுப்பவும் அல்லது எங்கள் பணிகளில் தன்னார்வலராக இணையவும்.',
  '', 'Send Message', 'செய்தி அனுப்பு', '#contact-form', 'Join as Volunteer', 'தன்னார்வலராக இணைய', '#volunteer-form',
  '[]'::jsonb,
  'Contact & Volunteer | Ilangathir Trust', 'தொடர்பு & தன்னார்வ சேவை | இளங்கதிர் அறக்கட்டளை',
  'Contact Ilangathir Trust in V. Kallupatti, Dindigul, Tamil Nadu or join as a volunteer.',
  'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையைத் தொடர்பு கொள்ளவும்.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v003', 'Website content, settings, navigation, versions, activities, team, and form tables')
ON CONFLICT (version) DO NOTHING;
