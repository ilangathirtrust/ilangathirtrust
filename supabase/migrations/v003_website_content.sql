-- =============================================================================
-- Migration v003: Website Content, Settings, Navigation, Versions & Forms
-- Project: Ilangathir Trust (ilangathirtrust.com)
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
('logo_url', 'brand', '/assets/ilangathir-logo.jpg', '/assets/ilangathir-logo.jpg', NULL, TRUE),
('favicon_url', 'brand', '/assets/ilangathir-logo.jpg', '/assets/ilangathir-logo.jpg', NULL, TRUE),
('phone', 'contact', '+91 93630 15050', '+91 93630 15050', NULL, TRUE),
('email', 'contact', 'ilangathirtrust@gmail.com', 'ilangathirtrust@gmail.com', NULL, TRUE),
('address', 'contact', 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.', 'V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு, இந்தியா.', NULL, TRUE),
('office_hours', 'contact', 'Monday - Saturday: 9:30 AM - 6:00 PM', 'திங்கள் - சனி: காலை 9:30 - மாலை 6:00', NULL, TRUE),
('social_links', 'contact', '', '', '{"facebook":"","instagram":"","youtube":"","whatsapp":"https://wa.me/919363015050"}'::jsonb, TRUE),
('founder_name', 'founder', 'Founder — Ilangathir Trust', 'நிறுவனர் — இளங்கதிர் அறக்கட்டளை', NULL, TRUE),
('founder_role', 'founder', 'Founder & Managing Trustee', 'நிறுவனர் & நிர்வாக அறங்காவலர்', NULL, TRUE),
('founder_bio', 'founder', 'Update the verified founder biography from the admin panel.', 'நிர்வாகப் பலகையில் இருந்து நிறுவனர் பற்றிய சரிபார்க்கப்பட்ட வாழ்க்கை வரலாற்றைப் புதுப்பிக்கவும்.', NULL, TRUE),
('founder_image_url', 'founder', '/assets/founder.jpg', '/assets/founder.jpg', NULL, TRUE),
('mission_statement', 'about', 'Encourage meaningful service, educational empowerment, healthcare access, and community participation for social good.', 'அர்த்தமுள்ள சேவை, கல்வி மேம்பாடு, சுகாதார அணுகல் மற்றும் சமூகப் பங்கேற்பை ஊக்குவித்தல்.', NULL, TRUE),
('vision_statement', 'about', 'A caring, inclusive, and self-reliant society where every individual lives with dignity and opportunity.', 'அனைவரும் கண்ணியத்துடனும் சம வாய்ப்புடனும் வாழும் அக்கறையும் சமத்துவமும் கொண்ட சமுதாயம்.', NULL, TRUE),
('footer_description', 'footer', 'Ilangathir Trust is dedicated to compassionate social welfare, community education, healthcare outreach, and environmental stewardship across Tamil Nadu.', 'தமிழ்நாடு முழுவதும் கருணையுடன் கூடிய சமூக நலன், கல்வி மேம்பாடு, மருத்துவ சேவை மற்றும் சுற்றுச்சூழல் பாதுகாப்பில் இளங்கதிர் அறக்கட்டளை அர்ப்பணிப்புடன் செயல்படுகிறது.', NULL, TRUE),
('donation_config', 'donations', '', '', '{"enabled":true,"currency":"INR","suggested_amounts":[500,1000,2500,5000,10000],"purposes":["General Welfare","Education Support","Medical Relief","Environmental Care"]}'::jsonb, TRUE)
ON CONFLICT (key) DO NOTHING;

-- Seed default structured navigation items
INSERT INTO public.navigation_items (menu_location, label_en, label_ta, href, icon_name, sort_order, is_visible)
SELECT * FROM (VALUES
  ('header', 'Home', 'முகப்பு', '/', 'Home', 1, TRUE),
  ('header', 'About', 'எங்களைப் பற்றி', '/about', 'HeartHandshake', 2, TRUE),
  ('header', 'Activities', 'செயல்பாடுகள்', '/activities', 'Sparkles', 3, TRUE),
  ('header', 'Events', 'நிகழ்வுகள்', '/events', 'CalendarDays', 4, TRUE),
  ('header', 'Gallery', 'புகைப்படங்கள்', '/gallery', 'Images', 5, TRUE),
  ('header', 'Blog', 'கட்டுரைகள்', '/blog', 'BookOpen', 6, TRUE),
  ('header', 'Contact', 'தொடர்பு', '/contact', 'Mail', 7, TRUE),
  ('mobile_bottom', 'Home', 'முகப்பு', '/', 'Home', 1, TRUE),
  ('mobile_bottom', 'Events', 'நிகழ்வுகள்', '/events', 'CalendarDays', 2, TRUE),
  ('mobile_bottom', 'Gallery', 'புகைப்படங்கள்', '/gallery', 'Images', 3, TRUE),
  ('mobile_bottom', 'Blog', 'கட்டுரைகள்', '/blog', 'BookOpen', 4, TRUE),
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
  'COMPASSION IN ACTION • DINDIGUL, TAMIL NADU', 'செயலில் கருணை • திண்டுக்கல், தமிழ்நாடு',
  'Together, we build a caring & empowered tomorrow.', 'ஒன்றிணைந்து, அக்கறையும் வலிமையும் கொண்ட நாளையை உருவாக்குவோம்.',
  'Ilangathir Trust serves rural and urban communities across Tamil Nadu through education support, medical outreach, environmental care, and collective volunteer action.',
  'கல்வி உதவி, மருத்துவ முகாம்கள், சுற்றுச்சூழல் பாதுகாப்பு மற்றும் தன்னார்வப் பணிகள் மூலம் தமிழ்நாடு முழுவதும் உள்ள மக்களுக்கு இளங்கதிர் அறக்கட்டளை சேவை செய்கிறது.',
  '/assets/herosection.png',
  'Support Our Mission', 'நன்கொடை வழங்க', '/donate',
  'Explore Initiatives', 'செயல்பாடுகளை அறிய', '/activities',
  '[{"question_en":"What is Ilangathir Trust?","question_ta":"இளங்கதிர் அறக்கட்டளை என்றால் என்ன?","answer_en":"Ilangathir Trust (Ilangathir Arakattalai) is a community welfare and charitable trust based in V. Kallupatti, Dindigul, Tamil Nadu, focused on education, healthcare outreach, and social empowerment.","answer_ta":"இளங்கதிர் அறக்கட்டளை என்பது தமிழ்நாட்டின் திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியை மையமாகக் கொண்டு கல்வி, மருத்துவம் மற்றும் சமூக நலப் பணிகளில் ஈடுபடும் தொண்டு அறக்கட்டளையாகும்."},{"question_en":"How can I donate or volunteer with Ilangathir Trust?","question_ta":"இளங்கதிர் அறக்கட்டளைக்கு நன்கொடை வழங்குவது அல்லது தன்னார்வலராக இணைவது எப்படி?","answer_en":"You can contribute securely online via our Donate page using Razorpay or submit a volunteer enquiry on our Volunteer / Contact page.","answer_ta":"எங்கள் நன்கொடைப் பக்கத்தின் மூலம் பாதுகாப்பாக ஆன்லைனில் நன்கொடை வழங்கலாம் அல்லது தொடர்புப் பக்கத்தில் தன்னார்வலராகப் பதிவு செய்யலாம்."}]'::jsonb,
  'Ilangathir Trust | Community Welfare, Education & Social Service in Tamil Nadu',
  'இளங்கதிர் அறக்கட்டளை | சமூக நலன், கல்வி மற்றும் தொண்டு சேவை - தமிழ்நாடு',
  'Official website of Ilangathir Trust (Ilangathir Arakattalai), V. Kallupatti, Dindigul, Tamil Nadu. Explore our community welfare activities, events, gallery, and online donations.',
  'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் அதிகாரப்பூர்வ இணையதளம். எங்கள் சமூக நலப் பணிகள், நிகழ்வுகள், புகைப்படங்கள் மற்றும் நன்கொடை விவரங்களை அறியுங்கள்.'
),
(
  'about', 'About Us',
  'WHO WE ARE', 'நாங்கள் யார்',
  'Rooted in service, transparency, and human dignity.', 'சேவை, வெளிப்படைத்தன்மை மற்றும் மனித கண்ணியத்தில் வேரூன்றிய பயணம்.',
  'Learn about the vision, mission, founder, and guiding values behind Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் தொலைநோக்கு, செயல்நோக்கம், நிறுவனர் மற்றும் அடிப்படை மதிப்புகளைப் பற்றி அறியுங்கள்.',
  '', 'Meet Our Team', 'குழுவை அறிய', '/about#team', 'Contact Trust', 'தொடர்பு கொள்ள', '/contact',
  '[]'::jsonb,
  'About Us | Ilangathir Trust', 'எங்களைப் பற்றி | இளங்கதிர் அறக்கட்டளை',
  'Discover the mission, vision, and leadership of Ilangathir Trust in Dindigul, Tamil Nadu.',
  'திண்டுக்கல் இளங்கதிர் அறக்கட்டளையின் நோக்கம், தொலைநோக்கு மற்றும் தலைமைத்துவம் குறித்து அறியுங்கள்.'
),
(
  'activities', 'Activities',
  'WHAT WE DO', 'எங்கள் பணிகள்',
  'Community programmes designed for lasting impact.', 'நீடித்த சமூக மாற்றத்திற்கான நலத்திட்ட செயல்பாடுகள்.',
  'Explore verified educational, healthcare, environmental, and community welfare initiatives.',
  'கல்வி, சுகாதாரம், சுற்றுச்சூழல் மற்றும் சமூக நலன் சார்ந்த எங்கள் செயல்பாடுகளைப் பாருங்கள்.',
  '', 'Volunteer With Us', 'தன்னார்வலராக இணைய', '/contact#volunteer', 'Donate Now', 'நன்கொடை வழங்க', '/donate',
  '[]'::jsonb,
  'Activities & Programmes | Ilangathir Trust', 'செயல்பாடுகள் & திட்டங்கள் | இளங்கதிர் அறக்கட்டளை',
  'Explore community welfare, education, healthcare, and green initiatives by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் கல்வி, மருத்துவ மற்றும் சமூக நலச் செயல்பாடுகளைப் பார்வையிடுங்கள்.'
),
(
  'events', 'Events',
  'UPCOMING & PAST EVENTS', 'நிகழ்வுகள் & முகாம்கள்',
  'Gathering communities for meaningful action.', 'அர்த்தமுள்ள செயலுக்காக மக்களை ஒன்றிணைக்கும் நிகழ்வுகள்.',
  'Stay informed on upcoming welfare camps, educational drives, and completed community programmes.',
  'வரவிருக்கும் நலத்திட்ட முகாம்கள் மற்றும் நிறைவடைந்த சமூக நிகழ்வுகளின் விவரங்களைத் தெரிந்துகொள்ளுங்கள்.',
  '', 'Join an Event', 'நிகழ்வில் இணைய', '/contact#volunteer', 'View Gallery', 'புகைப்படங்களைக் காண', '/gallery',
  '[]'::jsonb,
  'Events & Programmes | Ilangathir Trust', 'நிகழ்வுகள் | இளங்கதிர் அறக்கட்டளை',
  'Upcoming and past community events, health camps, and social service drives by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் வரவிருக்கும் மற்றும் நடைபெற்ற சமூக நிகழ்வுகள்.'
),
(
  'gallery', 'Gallery',
  'VISUAL ARCHIVE', 'நினைவுகளின் தொகுப்பு',
  'Moments of compassion captured across Tamil Nadu.', 'தமிழ்நாடு முழுவதும் பதிவான கருணையின் தருணங்கள்.',
  'Browse event-wise folders of photographs and videos from Ilangathir Trust initiatives.',
  'நிகழ்வுகள் மற்றும் பிரிவுகள் வாரியாக இளங்கதிர் அறக்கட்டளையின் புகைப்படங்கள் மற்றும் காணொளிகளைப் பாருங்கள்.',
  '', 'Upcoming Events', 'நிகழ்வுகள்', '/events', 'Donate', 'நன்கொடை', '/donate',
  '[]'::jsonb,
  'Photo & Video Gallery | Ilangathir Trust', 'புகைப்பட & காணொளித் தொகுப்பு | இளங்கதிர் அறக்கட்டளை',
  'Event-based photo and video gallery of Ilangathir Trust programmes and community initiatives.',
  'இளங்கதிர் அறக்கட்டளையின் நிகழ்வுகள் மற்றும் சமூகப் பணிகளின் புகைப்பட, காணொளித் தொகுப்பு.'
),
(
  'blog', 'Blog & Stories',
  'STORIES & ARTICLES', 'கட்டுரைகள் & செய்திகள்',
  'Field stories, insights, and community updates.', 'கள அனுபவங்கள், கட்டுரைகள் மற்றும் சமூகச் செய்திகள்.',
  'Read updates, impact reflections, and awareness articles published by Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் களச் செய்திகள், கட்டுரைகள் மற்றும் விழிப்புணர்வு பதிவுகளைப் படியுங்கள்.',
  '', 'Read Latest', 'சமீபத்திய கட்டுரைகள்', '/blog', 'Contact Us', 'தொடர்பு கொள்ள', '/contact',
  '[]'::jsonb,
  'Blog & Community Stories | Ilangathir Trust', 'கட்டுரைகள் & கதைகள் | இளங்கதிர் அறக்கட்டளை',
  'Articles, community impact stories, and awareness updates from Ilangathir Trust.',
  'இளங்கதிர் அறக்கட்டளையின் கட்டுரைகள், சமூக தாக்கக் கதைகள் மற்றும் விழிப்புணர்வு செய்திகள்.'
),
(
  'donate', 'Donate',
  'MAKE AN IMPACT', 'உதவிக்கரம் நீட்டுங்கள்',
  'Every contribution fuels direct community care.', 'உங்கள் ஒவ்வொரு பங்களிப்பும் நேரடி சமூக நலனுக்குப் பயன்படுகிறது.',
  'Support Ilangathir Trust safely and transparently through Razorpay.',
  'ரேசர்பே (Razorpay) மூலம் பாதுகாப்பாகவும் வெளிப்படைத்தன்மையுடனும் இளங்கதிர் அறக்கட்டளைக்கு நன்கொடை அளியுங்கள்.',
  '', 'Donate Now', 'இப்போது நன்கொடை வழங்க', '#donation-checkout', 'View Activities', 'செயல்பாடுகள்', '/activities',
  '[{"question_en":"Is online donation via Razorpay secure?","question_ta":"ரேசர்பே மூலம் ஆன்லைனில் நன்கொடை வழங்குவது பாதுகாப்பானதா?","answer_en":"Yes. All payments are processed directly via Razorpay with encrypted checkout and cryptographic server-side signature verification.","answer_ta":"ஆம். அனைத்து கட்டணங்களும் Razorpay மூலம் குறியாக்கப்பட்ட பாதுகாப்புடனும் சர்வர் சரிபார்ப்புடனும் செயல்படுத்தப்படுகின்றன."}]'::jsonb,
  'Donate to Ilangathir Trust | Secure Online Giving', 'நன்கொடை வழங்க | இளங்கதிர் அறக்கட்டளை',
  'Support education, healthcare camps, and rural welfare through secure Razorpay donations to Ilangathir Trust.',
  'கல்வி, மருத்துவ முகாம்கள் மற்றும் கிராமப்புற நலத்திட்டங்களுக்கு பாதுகாப்பாக நன்கொடை வழங்குங்கள்.'
),
(
  'contact', 'Contact & Volunteer',
  'CONNECT WITH US', 'எங்களுடன் இணையுங்கள்',
  'Reach out, collaborate, or volunteer with us.', 'தொடர்பு கொள்ளுங்கள், இணையுங்கள் அல்லது தன்னார்வலராகப் பங்களிக்கவும்.',
  'Send an enquiry or apply to volunteer in our upcoming Tamil Nadu community programmes.',
  'உங்கள் கேள்விகளைப் பகிரவும் அல்லது வரவிருக்கும் சமூக நலப் பணிகளில் தன்னார்வலராகப் பதிவு செய்யவும்.',
  '', 'Send Enquiry', 'செய்தி அனுப்பு', '#contact-form', 'Apply as Volunteer', 'தன்னார்வலராக இணைய', '#volunteer-form',
  '[]'::jsonb,
  'Contact & Volunteer | Ilangathir Trust', 'தொடர்பு & தன்னார்வலர் பதிவு | இளங்கதிர் அறக்கட்டளை',
  'Contact Ilangathir Trust in V. Kallupatti, Dindigul, Tamil Nadu or apply as a community volunteer.',
  'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையைத் தொடர்பு கொள்ளவும் அல்லது தன்னார்வலராகப் பதிவு செய்யவும்.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.schema_migrations (version, description)
VALUES ('v003', 'Website content, settings, navigation, versions, activities, team, and form tables')
ON CONFLICT (version) DO NOTHING;
