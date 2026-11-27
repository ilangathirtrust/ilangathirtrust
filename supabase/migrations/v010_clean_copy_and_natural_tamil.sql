-- =============================================================================
-- Migration v010: Refresh Default English & Natural Everyday Tamil Copy
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- Run in Supabase SQL Editor to update seeded copy without touching uploads/donations.
-- =============================================================================

UPDATE public.site_settings
SET value_en = 'Update the founder profile details from the admin portal.',
    value_ta = 'நிறுவனர் பற்றிய விவரங்களை நிர்வாகப் பக்கத்தில் இருந்து புதுப்பிக்கவும்.'
WHERE key = 'founder_bio';

UPDATE public.site_settings
SET value_en = 'Support student education, healthcare access, and community welfare across Dindigul and neighbouring districts.',
    value_ta = 'மாணவர் கல்வி, மருத்துவ உதவி மற்றும் ஊர் நலப் பணிகளைத் தொடர்ந்து செய்தல்.'
WHERE key = 'mission_statement';

UPDATE public.site_settings
SET value_en = 'A caring society where every family has access to education, basic healthcare, and dignified living.',
    value_ta = 'அனைத்து குடும்பங்களும் கல்வி, மருத்துவம் மற்றும் நலமுடன் வாழும் சமுதாயம்.'
WHERE key = 'vision_statement';

UPDATE public.site_settings
SET value_en = 'Ilangathir Trust supports education, rural health camps, tree planting, and community welfare across Tamil Nadu.',
    value_ta = 'தமிழ்நாடு முழுவதும் கல்வி உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை செயல்படுகிறது.'
WHERE key = 'footer_description';

UPDATE public.navigation_items SET label_ta = 'நலப் பணிகள்' WHERE href = '/activities';
UPDATE public.navigation_items SET label_ta = 'படங்கள்' WHERE href = '/gallery';
UPDATE public.navigation_items SET label_en = 'Stories', label_ta = 'செய்திகள்' WHERE href = '/blog';

UPDATE public.page_contents
SET
  hero_eyebrow_en = 'V. Kallupatti, Dindigul • Tamil Nadu',
  hero_eyebrow_ta = 'V. கல்லுப்பட்டி, திண்டுக்கல் • தமிழ்நாடு',
  hero_title_en = 'Serving communities with care and responsibility.',
  hero_title_ta = 'நலமான சமுதாயத்தை உருவாக்க, அனைவரும் இணைந்து செயல்படுவோம்.',
  hero_subtitle_en = 'Ilangathir Trust works across Tamil Nadu to support student education, medical outreach, tree planting, and timely relief for families in need.',
  hero_subtitle_ta = 'கல்வி உதவி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை தொடர்ந்து செயல்பட்டு வருகிறது.',
  hero_cta_primary_en = 'Donate Now',
  hero_cta_primary_ta = 'நன்கொடை அளிக்க',
  hero_cta_secondary_en = 'Our Activities',
  hero_cta_secondary_ta = 'நலப் பணிகள் பார்க்க',
  faqs = '[{"question_en":"What is Ilangathir Trust?","question_ta":"இளங்கதிர் அறக்கட்டளை என்றால் என்ன?","answer_en":"Ilangathir Trust (Ilangathir Arakattalai) is a registered charitable trust in V. Kallupatti, Dindigul, Tamil Nadu supporting student education, healthcare camps, and local community welfare.","answer_ta":"இளங்கதிர் அறக்கட்டளை என்பது திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியைச் சேர்ந்த பதிவு பெற்ற அறக்கட்டளையாகும். கல்வி உதவி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளைச் செய்து வருகிறோம்."},{"question_en":"How can I donate or volunteer with Ilangathir Trust?","question_ta":"நன்கொடை அளிக்க அல்லது தன்னார்வலராக இணைய என்ன செய்ய வேண்டும்?","answer_en":"You can donate online on our Donate page using UPI, cards, or netbanking, or fill out the volunteer form on our Contact page.","answer_ta":"எங்கள் நன்கொடைப் பக்கத்தில் UPI, கார்டு மூலம் ஆன்லைனில் உதவலாம். தன்னார்வலராக சேர தொடர்பு பக்கத்தில் உங்கள் விவரங்களை அனுப்பலாம்."}]'::jsonb,
  seo_title_en = 'Ilangathir Trust | Education, Healthcare & Social Welfare in Tamil Nadu',
  seo_title_ta = 'இளங்கதிர் அறக்கட்டளை | கல்வி, மருத்துவம் & சமூக நலப் பணிகள்',
  seo_description_en = 'Official website of Ilangathir Trust (Ilangathir Arakattalai), V. Kallupatti, Dindigul, Tamil Nadu. Explore our community programmes, events, photo albums, and online donations.',
  seo_description_ta = 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் இணையதளம். எங்கள் பணிகள், நிகழ்வுகள், படங்கள் மற்றும் நன்கொடை விவரங்களை இங்கே பார்க்கலாம்.'
WHERE slug = 'home';

UPDATE public.page_contents
SET
  hero_eyebrow_en = 'CONTRIBUTE',
  hero_eyebrow_ta = 'நன்கொடை அளிக்க',
  hero_title_en = 'Every contribution supports families directly.',
  hero_title_ta = 'உங்கள் ஒவ்வொரு உதவியும் நேரடியாக மக்களுக்குச் சேரும்.',
  hero_subtitle_en = 'Contribute online safely using UPI, cards, or netbanking.',
  hero_subtitle_ta = 'UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் பாதுகாப்பாக நன்கொடை வழங்கலாம்.',
  hero_cta_primary_en = 'Donate Now',
  hero_cta_primary_ta = 'நன்கொடை அளிக்க',
  faqs = '[{"question_en":"Is online donation secure?","question_ta":"ஆன்லைன் நன்கொடை பாதுகாப்பானதா?","answer_en":"Yes. All payments use encrypted checkout with automatic verification and an official receipt number.","answer_ta":"ஆம். அனைத்து கட்டணங்களும் முழுப் பாதுகாப்போடு சரிபார்க்கப்பட்டு உடனே ரசீது எண் வழங்கப்படும்."}]'::jsonb,
  seo_description_en = 'Support student education, medical camps, and local welfare through online contributions to Ilangathir Trust.',
  seo_description_ta = 'கல்வி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளுக்கு பாதுகாப்பாக நன்கொடை அளியுங்கள்.'
WHERE slug = 'donate';

INSERT INTO public.schema_migrations (version, description)
VALUES ('v010', 'Refresh default English copy and natural everyday Tamil phrasing')
ON CONFLICT (version) DO NOTHING;
