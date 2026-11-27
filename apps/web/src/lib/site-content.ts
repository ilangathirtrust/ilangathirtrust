import type { BilingualFaq, Language, NavigationItem } from '@ilangathir/shared';

export const STATIC_ASSETS = {
  logo: '/assets/ilangathir-logo.jpg',
  favicon: '/assets/ilangathir-logo.jpg',
  hero: '/assets/herosection.png',
  founder: '/assets/founder.jpg'
} as const;

export const SITE_SETTINGS = {
  trust_name: {
    value_en: 'Ilangathir Trust',
    value_ta: 'இளங்கதிர் அறக்கட்டளை',
    json_value: null
  },
  trust_legal_name: {
    value_en: 'Ilangathir Arakattalai',
    value_ta: 'இளங்கதிர் அறக்கட்டளை',
    json_value: null
  },
  logo_url: {
    value_en: STATIC_ASSETS.logo,
    value_ta: STATIC_ASSETS.logo,
    json_value: null
  },
  favicon_url: {
    value_en: STATIC_ASSETS.favicon,
    value_ta: STATIC_ASSETS.favicon,
    json_value: null
  },
  phone: {
    value_en: '+91 93630 15050',
    value_ta: '+91 93630 15050',
    json_value: null
  },
  email: {
    value_en: 'ilangathirtrust@gmail.com',
    value_ta: 'ilangathirtrust@gmail.com',
    json_value: null
  },
  address: {
    value_en: 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.',
    value_ta: 'V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு, இந்தியா.',
    json_value: null
  },
  office_hours: {
    value_en: 'Monday - Saturday: 9:30 AM - 6:00 PM',
    value_ta: 'திங்கள் - சனி: காலை 9:30 - மாலை 6:00',
    json_value: null
  },
  founder_name: {
    value_en: 'Founder — Ilangathir Trust',
    value_ta: 'நிறுவனர் — இளங்கதிர் அறக்கட்டளை',
    json_value: null
  },
  founder_role: {
    value_en: 'Founder & Managing Trustee',
    value_ta: 'நிறுவனர் & நிர்வாக அறங்காவலர்',
    json_value: null
  },
  founder_bio: {
    value_en: 'Leading Ilangathir Trust from V. Kallupatti, Dindigul with a clear commitment to student education, rural healthcare camps, and community welfare.',
    value_ta: 'திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியை மையமாகக் கொண்டு கல்வி உதவி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளை வழிநடத்தி வருகிறார்.',
    json_value: null
  },
  mission_statement: {
    value_en: 'Support student education, healthcare access, and community welfare across Dindigul and neighbouring districts.',
    value_ta: 'மாணவர் கல்வி, மருத்துவ உதவி மற்றும் ஊர் நலப் பணிகளைத் தொடர்ந்து செய்தல்.',
    json_value: null
  },
  vision_statement: {
    value_en: 'A caring society where every family has access to education, basic healthcare, and dignified living.',
    value_ta: 'அனைத்து குடும்பங்களும் கல்வி, மருத்துவம் மற்றும் நலமுடன் வாழும் சமுதாயம்.',
    json_value: null
  },
  footer_description: {
    value_en: 'Ilangathir Trust supports education, rural health camps, tree planting, and community welfare across Tamil Nadu.',
    value_ta: 'தமிழ்நாடு முழுவதும் கல்வி உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை செயல்படுகிறது.',
    json_value: null
  },
  social_links: {
    value_en: '',
    value_ta: '',
    json_value: {
      facebook: '',
      instagram: '',
      youtube: '',
      whatsapp: 'https://wa.me/919363015050'
    }
  },
  donation_config: {
    value_en: '',
    value_ta: '',
    json_value: {
      enabled: true,
      currency: 'INR',
      suggested_amounts: [500, 1000, 2500, 5000, 10000],
      purposes: ['General Welfare', 'Education Support', 'Medical Relief', 'Environmental Care']
    }
  }
} as const;

export const STATIC_NAVIGATION: NavigationItem[] = [
  { id: 'h-home', menu_location: 'header', label_en: 'Home', label_ta: 'முகப்பு', href: '/', icon_name: 'Home', sort_order: 1, open_in_new_tab: false },
  { id: 'h-about', menu_location: 'header', label_en: 'About', label_ta: 'எங்களைப் பற்றி', href: '/about', icon_name: 'HeartHandshake', sort_order: 2, open_in_new_tab: false },
  { id: 'h-act', menu_location: 'header', label_en: 'Activities', label_ta: 'நலப் பணிகள்', href: '/activities', icon_name: 'Sparkles', sort_order: 3, open_in_new_tab: false },
  { id: 'h-events', menu_location: 'header', label_en: 'Events', label_ta: 'நிகழ்வுகள்', href: '/events', icon_name: 'CalendarDays', sort_order: 4, open_in_new_tab: false },
  { id: 'h-gallery', menu_location: 'header', label_en: 'Gallery', label_ta: 'படங்கள்', href: '/gallery', icon_name: 'Images', sort_order: 5, open_in_new_tab: false },
  { id: 'h-blog', menu_location: 'header', label_en: 'Stories', label_ta: 'செய்திகள்', href: '/blog', icon_name: 'BookOpen', sort_order: 6, open_in_new_tab: false },
  { id: 'h-contact', menu_location: 'header', label_en: 'Contact', label_ta: 'தொடர்பு', href: '/contact', icon_name: 'Mail', sort_order: 7, open_in_new_tab: false },
  { id: 'm-home', menu_location: 'mobile_bottom', label_en: 'Home', label_ta: 'முகப்பு', href: '/', icon_name: 'Home', sort_order: 1, open_in_new_tab: false },
  { id: 'm-events', menu_location: 'mobile_bottom', label_en: 'Events', label_ta: 'நிகழ்வுகள்', href: '/events', icon_name: 'CalendarDays', sort_order: 2, open_in_new_tab: false },
  { id: 'm-gallery', menu_location: 'mobile_bottom', label_en: 'Gallery', label_ta: 'படங்கள்', href: '/gallery', icon_name: 'Images', sort_order: 3, open_in_new_tab: false },
  { id: 'm-blog', menu_location: 'mobile_bottom', label_en: 'Stories', label_ta: 'செய்திகள்', href: '/blog', icon_name: 'BookOpen', sort_order: 4, open_in_new_tab: false },
  { id: 'm-donate', menu_location: 'mobile_bottom', label_en: 'Donate', label_ta: 'நன்கொடை', href: '/donate', icon_name: 'Heart', sort_order: 5, open_in_new_tab: false }
];

export const HOME_FAQS: BilingualFaq[] = [
  {
    question_en: 'What is Ilangathir Trust?',
    question_ta: 'இளங்கதிர் அறக்கட்டளை என்றால் என்ன?',
    answer_en: 'Ilangathir Trust (Ilangathir Arakattalai) is a registered charitable trust in V. Kallupatti, Dindigul, Tamil Nadu supporting student education, healthcare camps, and community welfare.',
    answer_ta: 'இளங்கதிர் அறக்கட்டளை என்பது திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியைச் சேர்ந்த பதிவு பெற்ற அறக்கட்டளையாகும். கல்வி உதவி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளைச் செய்து வருகிறோம்.'
  },
  {
    question_en: 'How can I donate or volunteer with Ilangathir Trust?',
    question_ta: 'நன்கொடை அளிக்க அல்லது தன்னார்வலராக இணைய என்ன செய்ய வேண்டும்?',
    answer_en: 'You can donate online on our Donate page using UPI, cards, or netbanking, or fill out the volunteer form on our Contact page.',
    answer_ta: 'எங்கள் நன்கொடைப் பக்கத்தில் UPI, கார்டு மூலம் ஆன்லைனில் உதவலாம். தன்னார்வலராக சேர தொடர்பு பக்கத்தில் உங்கள் விவரங்களை அனுப்பலாம்.'
  }
];

export const DONATE_FAQS: BilingualFaq[] = [
  {
    question_en: 'Is online donation secure?',
    question_ta: 'ஆன்லைன் நன்கொடை பாதுகாப்பானதா?',
    answer_en: 'Yes. All payments use encrypted checkout with automatic verification and an official receipt number.',
    answer_ta: 'ஆம். அனைத்து கட்டணங்களும் முழுப் பாதுகாப்போடு சரிபார்க்கப்பட்டு உடனே ரசீது எண் வழங்கப்படும்.'
  }
];

export const PERMANENT_PAGES = {
  home: {
    eyebrow_en: 'V. Kallupatti, Dindigul • Tamil Nadu',
    eyebrow_ta: 'V. கல்லுப்பட்டி, திண்டுக்கல் • தமிழ்நாடு',
    title_en: 'Serving communities with care and responsibility.',
    title_ta: 'நலமான சமுதாயத்தை உருவாக்க, அனைவரும் இணைந்து செயல்படுவோம்.',
    subtitle_en: 'Ilangathir Trust works across Tamil Nadu to support student education, medical outreach, tree planting, and timely relief for families in need.',
    subtitle_ta: 'கல்வி உதவி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை தொடர்ந்து செயல்பட்டு வருகிறது.',
    primary_cta_en: 'Donate Now',
    primary_cta_ta: 'நன்கொடை அளிக்க',
    secondary_cta_en: 'Our Activities',
    secondary_cta_ta: 'நலப் பணிகள் பார்க்க',
    seo_title_en: 'Ilangathir Trust | Education, Healthcare & Social Welfare in Tamil Nadu',
    seo_title_ta: 'இளங்கதிர் அறக்கட்டளை | கல்வி, மருத்துவம் & சமூக நலப் பணிகள்',
    seo_description_en: 'Official website of Ilangathir Trust (Ilangathir Arakattalai), V. Kallupatti, Dindigul, Tamil Nadu. Explore our community programmes, events, photo albums, and online donations.',
    seo_description_ta: 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் இணையதளம். எங்கள் பணிகள், நிகழ்வுகள், படங்கள் மற்றும் நன்கொடை விவரங்களை இங்கே பார்க்கலாம்.'
  },
  about: {
    eyebrow_en: 'ABOUT THE TRUST',
    eyebrow_ta: 'அறக்கட்டளை பற்றி',
    title_en: 'Grounded in service, honesty, and respect for people.',
    title_ta: 'மக்களுக்கான அக்கறையுடன், நேர்மையான சேவைப் பயணம்.',
    subtitle_en: 'Read about the vision, mission, trustees, and values guiding Ilangathir Trust.',
    subtitle_ta: 'இளங்கதிர் அறக்கட்டளையின் நோக்கம், பார்வை மற்றும் குழுவினரைப் பற்றித் தெரிந்துகொள்ளுங்கள்.',
    seo_title_en: 'About Us | Ilangathir Trust',
    seo_title_ta: 'எங்களைப் பற்றி | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Learn about the mission, vision, and trustees of Ilangathir Trust in Dindigul, Tamil Nadu.',
    seo_description_ta: 'திண்டுக்கல் இளங்கதிர் அறக்கட்டளையின் நோக்கம் மற்றும் குழுவினர் விவரம்.'
  },
  activities: {
    eyebrow_en: 'OUR PROGRAMMES',
    eyebrow_ta: 'எங்கள் நலப் பணிகள்',
    title_en: 'Community programmes across education, health, and relief.',
    title_ta: 'கல்வி, மருத்துவம் மற்றும் சமூக நலத் திட்டங்கள்.',
    subtitle_en: 'Explore our educational support, rural medical camps, tree planting, and welfare activities.',
    subtitle_ta: 'பள்ளி மாணவர் உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூகப் பணிகளைப் பாருங்கள்.',
    seo_title_en: 'Activities & Programmes | Ilangathir Trust',
    seo_title_ta: 'நலப் பணிகள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Community welfare, education support, healthcare, and tree planting programmes by Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளையின் கல்வி, மருத்துவம் மற்றும் சமூக நலப் பணிகள்.'
  },
  events: {
    eyebrow_en: 'EVENTS & CAMPS',
    eyebrow_ta: 'நிகழ்வுகள் & முகாம்கள்',
    title_en: 'Bringing people together for meaningful local work.',
    title_ta: 'ஊர் நலனுக்காக மக்களை இணைக்கும் நிகழ்வுகள்.',
    subtitle_en: 'See upcoming health camps, student drives, and highlights from completed events.',
    subtitle_ta: 'வரவிருக்கும் மருத்துவ முகாம்கள் மற்றும் நடந்து முடிந்த நிகழ்வுகளின் விவரங்கள்.',
    seo_title_en: 'Events & Programmes | Ilangathir Trust',
    seo_title_ta: 'நிகழ்வுகள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Upcoming and past community events, health camps, and welfare drives by Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளையின் வரவிருக்கும் மற்றும் முடிந்த நிகழ்வுகள்.'
  },
  gallery: {
    eyebrow_en: 'GALLERY',
    eyebrow_ta: 'படங்கள் & வீடியோ',
    title_en: 'Photos and videos from our programmes.',
    title_ta: 'நமது களப் பணிகளின் படங்கள் & வீடியோக்கள்.',
    subtitle_en: 'Browse photo and video albums organized by event and year.',
    subtitle_ta: 'நிகழ்வு மற்றும் ஆண்டு வாரியாக எங்கள் படங்களையும் வீடியோக்களையும் பாருங்கள்.',
    seo_title_en: 'Photo & Video Gallery | Ilangathir Trust',
    seo_title_ta: 'படங்கள் & வீடியோ | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Event-wise photo and video albums of Ilangathir Trust programmes and community work.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளை நிகழ்வுகளின் புகைப்படங்கள் மற்றும் வீடியோக்கள்.'
  },
  blog: {
    eyebrow_en: 'NEWS & UPDATES',
    eyebrow_ta: 'செய்திகள் & பதிவுகள்',
    title_en: 'Field updates, stories, and announcements.',
    title_ta: 'களச் செய்திகள், அனுபவங்கள் மற்றும் அறிவிப்புகள்.',
    subtitle_en: 'Read updates, stories, and notices shared by Ilangathir Trust.',
    subtitle_ta: 'இளங்கதிர் அறக்கட்டளையின் சமீபத்திய செய்திகள் மற்றும் கட்டுரைகளைப் படியுங்கள்.',
    seo_title_en: 'Stories & News | Ilangathir Trust',
    seo_title_ta: 'செய்திகள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'News, field stories, and community updates from Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளையின் களச் செய்திகள் மற்றும் பதிவுகள்.'
  },
  donate: {
    eyebrow_en: 'CONTRIBUTE',
    eyebrow_ta: 'நன்கொடை அளிக்க',
    title_en: 'Every contribution supports families directly.',
    title_ta: 'உங்கள் ஒவ்வொரு உதவியும் நேரடியாக மக்களுக்குச் சேரும்.',
    subtitle_en: 'Contribute online safely using UPI, cards, or netbanking.',
    subtitle_ta: 'UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் பாதுகாப்பாக நன்கொடை வழங்கலாம்.',
    seo_title_en: 'Donate to Ilangathir Trust | Online Contributions',
    seo_title_ta: 'நன்கொடை | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Support student education, medical camps, and local welfare through online contributions to Ilangathir Trust.',
    seo_description_ta: 'கல்வி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளுக்கு பாதுகாப்பாக நன்கொடை அளியுங்கள்.'
  },
  contact: {
    eyebrow_en: 'GET IN TOUCH',
    eyebrow_ta: 'தொடர்பு கொள்ள',
    title_en: 'Write to us or join as a volunteer.',
    title_ta: 'எங்களுடன் பேசவும் அல்லது தன்னார்வலராக இணையவும்.',
    subtitle_en: 'Send us a message or submit your details to volunteer with our team in Tamil Nadu.',
    subtitle_ta: 'உங்கள் கேள்விகளை அனுப்பவும் அல்லது எங்கள் பணிகளில் தன்னார்வலராக இணையவும்.',
    seo_title_en: 'Contact & Volunteer | Ilangathir Trust',
    seo_title_ta: 'தொடர்பு & தன்னார்வ சேவை | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Contact Ilangathir Trust in V. Kallupatti, Dindigul, Tamil Nadu or join as a volunteer.',
    seo_description_ta: 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையைத் தொடர்பு கொள்ளவும்.'
  }
} as const;

export function pickText(item: { value_en: string; value_ta: string }, lang: Language): string {
  return lang === 'ta' && item.value_ta ? item.value_ta : item.value_en;
}
