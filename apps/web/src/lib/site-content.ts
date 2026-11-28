import type { BilingualFaq, Language, NavigationItem } from '@ilangathir/shared';

export const STATIC_ASSETS = {
  logo: '/logos/logo.webp',
  logoEng: '/logos/logo-eng.webp',
  logoTam: '/logos/logo-tam.webp',
  logoWhite: '/logos/logo-white.webp',
  logoWhiteEng: '/logos/logo-white-eng.webp',
  logoWhiteTam: '/logos/logo-white-tam.webp',
  logoBlackMono: '/logos/logo-black-monochrome.webp',
  logoNavyMono: '/logos/logo-navy-monochrome.webp',
  icon: '/logos/icon.webp',
  circularIcon: '/logos/circular-icon.webp',
  favicon: '/logos/favicon.ico',
  adaptiveForeground: '/logos/adaptive-icon-foreground.png',
  adaptiveBackground: '/logos/adaptive-icon-background.png',
  adaptiveMonochrome: '/logos/adaptive-icon-monochrome.png',
  hero: '/assets/herosection.png',
  founder: '/assets/founder.jpg'
} as const;

export function normalizeBrandAssetUrl(raw: string | undefined | null, fallback: string): string {
  const val = (raw || '').trim();
  if (!val) return fallback;
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val;
  }
  if (val.startsWith('/logos/') && (val.endsWith('.webp') || val.endsWith('.svg') || val.endsWith('.ico'))) {
    return val;
  }
  return fallback;
}

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
    value_en: 'Guiding Ilangathir Trust from V. Kallupatti, Dindigul with a clear focus on rural student education, free medical outreach, and community welfare.',
    value_ta: 'திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியை மையமாகக் கொண்டு மாணவர் கல்வி, இலவச மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளை அக்கறையுடன் வழிநடத்தி வருகிறார்.',
    json_value: null
  },
  mission_statement: {
    value_en: 'Strengthen rural education, preventive healthcare access, and community self-reliance across Dindigul and neighbouring districts.',
    value_ta: 'திண்டுக்கல் மற்றும் சுற்றியுள்ள பகுதிகளில் மாணவர் கல்வி, அடிப்படை மருத்துவ உதவி மற்றும் ஊர் நலப் பணிகளைத் தொடர்ந்து செய்தல்.',
    json_value: null
  },
  vision_statement: {
    value_en: 'A compassionate society where every child learns with dignity and every family has access to basic care.',
    value_ta: 'ஒவ்வொரு குழந்தையும் கல்வி கற்று, அனைத்துக் குடும்பங்களும் நலமுடன் வாழும் கருணையுள்ள சமுதாயம்.',
    json_value: null
  },
  footer_description: {
    value_en: 'A registered charitable trust in V. Kallupatti, Dindigul dedicated to student education, rural medical camps, tree planting, and community relief.',
    value_ta: 'திண்டுக்கல் V. கல்லுப்பட்டியில் செயல்படும் பதிவு பெற்ற அறக்கட்டளை. கல்வி உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளைச் செய்து வருகிறோம்.',
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

export const HOME_FAQS_BASE: BilingualFaq[] = [
  {
    question_en: 'What is Ilangathir Trust and where is it located?',
    question_ta: 'இளங்கதிர் அறக்கட்டளை என்றால் என்ன? எங்கு உள்ளது?',
    answer_en: 'Ilangathir Trust (Ilangathir Arakattalai) is a registered charitable trust based in V. Kallupatti, Dindigul (624307), Tamil Nadu. We focus on student education, free rural medical camps, tree planting, and community relief.',
    answer_ta: 'இளங்கதிர் அறக்கட்டளை என்பது திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டியை (624307) மையமாகக் கொண்டு செயல்படும் பதிவு பெற்ற அறக்கட்டளையாகும். கல்வி உதவி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளைச் செய்து வருகிறோம்.'
  },
  {
    question_en: 'What community programmes does Ilangathir Trust run?',
    question_ta: 'இளங்கதிர் அறக்கட்டளை என்னென்ன நலப் பணிகளைச் செய்கிறது?',
    answer_en: 'Our core work includes school supply distribution and student guidance, village eye and general health camps, sapling plantation drives, and timely support for underserved families.',
    answer_ta: 'பள்ளி மாணவர்களுக்கு கல்வி மற்றும் புத்தக உதவி, கிராமப்புற இலவச மருத்துவம் மற்றும் கண் பரிசோதனை முகாம்கள், மரம் நடுதல் மற்றும் தேவையுள்ள குடும்பங்களுக்கு நிவாரண உதவி ஆகியவற்றைச் செய்கிறோம்.'
  },
  {
    question_en: 'How can I volunteer or contact Ilangathir Trust?',
    question_ta: 'தன்னார்வலராக இணைய அல்லது தொடர்பு கொள்ள என்ன செய்ய வேண்டும்?',
    answer_en: 'Visit our Contact page to send an enquiry or submit the volunteer form. You can also reach us by phone at +91 93630 15050 or email at ilangathirtrust@gmail.com.',
    answer_ta: 'தொடர்பு பக்கத்தில் உள்ள படிவத்தின் மூலம் தன்னார்வலராகப் பதிவு செய்யலாம் அல்லது +91 93630 15050 என்ற எண்ணிலும் ilangathirtrust@gmail.com என்ற மின்னஞ்சலிலும் தொடர்பு கொள்ளலாம்.'
  }
];

export const HOME_DONATE_FAQ: BilingualFaq = {
  question_en: 'How can I contribute online to Ilangathir Trust?',
  question_ta: 'இளங்கதிர் அறக்கட்டளைக்கு ஆன்லைனில் நன்கொடை அளிப்பது எப்படி?',
  answer_en: 'You can donate online on our Donate page using UPI, debit/credit cards, or netbanking, and receive an immediate verified receipt number.',
  answer_ta: 'எங்கள் நன்கொடைப் பக்கத்தில் UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் பாதுகாப்பாக உதவலாம்; உடனடியாக ரசீது எண் வழங்கப்படும்.'
};

export function getHomeFaqs(donationsEnabled: boolean): BilingualFaq[] {
  return donationsEnabled ? [...HOME_FAQS_BASE, HOME_DONATE_FAQ] : HOME_FAQS_BASE;
}

export const DONATE_FAQS: BilingualFaq[] = [
  {
    question_en: 'Is online donation to Ilangathir Trust secure?',
    question_ta: 'ஆன்லைன் நன்கொடை பாதுகாப்பானதா?',
    answer_en: 'Yes. All payments use encrypted Razorpay checkout with automatic signature verification and an instant official receipt number.',
    answer_ta: 'ஆம். அனைத்துக் கட்டணங்களும் முழுப் பாதுகாப்போடு சரிபார்க்கப்பட்டு உடனே அதிகாரப்பூர்வ ரசீது எண் வழங்கப்படும்.'
  },
  {
    question_en: 'Which programmes do contributions support?',
    question_ta: 'நன்கொடை எந்தப் பணிகளுக்குப் பயன்படுத்தப்படுகிறது?',
    answer_en: 'You can choose General Welfare, Education Support, Medical Relief, or Environmental Care when making your contribution.',
    answer_ta: 'பொது நலப் பணிகள், மாணவர் கல்வி உதவி, மருத்துவ முகாம்கள் அல்லது சுற்றுச்சூழல் பாதுகாப்பு ஆகியவற்றில் ஒன்றைத் தேர்ந்தெடுத்து உதவலாம்.'
  }
];

export const PERMANENT_PAGES = {
  home: {
    eyebrow_en: 'V. Kallupatti, Dindigul • Tamil Nadu',
    eyebrow_ta: 'V. கல்லுப்பட்டி, திண்டுக்கல் • தமிழ்நாடு',
    title_en: 'Serving communities with care, dignity, and steady action.',
    title_ta: 'அக்கறையுடனும் பொறுப்புடனும் தொடரும் மக்கள் நலப் பணி.',
    subtitle_en: 'Ilangathir Trust works across Dindigul and Tamil Nadu to support student education, free rural medical camps, tree planting, and family welfare.',
    subtitle_ta: 'திண்டுக்கல் மற்றும் தமிழ்நாடு முழுவதும் மாணவர் கல்வி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் குடும்ப நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை செயல்படுகிறது.',
    primary_cta_en: 'Support Our Work',
    primary_cta_ta: 'நன்கொடை அளிக்க',
    secondary_cta_en: 'Explore Programmes',
    secondary_cta_ta: 'நலப் பணிகள் பார்க்க',
    seo_title_en: 'Ilangathir Trust | Charitable Trust in Dindigul, Tamil Nadu — Education & Healthcare',
    seo_title_ta: 'இளங்கதிர் அறக்கட்டளை | திண்டுக்கல், தமிழ்நாடு — கல்வி, மருத்துவம் & சமூக நலப் பணிகள்',
    seo_description_en: 'Ilangathir Trust (Ilangathir Arakattalai) in V. Kallupatti, Dindigul, Tamil Nadu supports rural student education, free medical camps, tree planting, and community welfare.',
    seo_description_ta: 'திண்டுக்கல் மாவட்டம் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் அதிகாரப்பூர்வ தளம். கல்வி உதவி, மருத்துவ முகாம், நிகழ்வுகள் மற்றும் படங்களைப் பார்க்கலாம்.',
    keywords_en: 'Ilangathir Trust, Ilangathir Arakattalai, Charitable Trust Dindigul, NGO Tamil Nadu, V. Kallupatti Trust, Education Support Tamil Nadu, Free Medical Camp Dindigul',
    keywords_ta: 'இளங்கதிர் அறக்கட்டளை, திண்டுக்கல் அறக்கட்டளை, தமிழ்நாடு சமூக நல அறக்கட்டளை, கல்வி உதவி, இலவச மருத்துவ முகாம், V. கல்லுப்பட்டி'
  },
  about: {
    eyebrow_en: 'ABOUT THE TRUST',
    eyebrow_ta: 'அறக்கட்டளை பற்றி',
    title_en: 'Rooted in service, transparency, and respect for every family.',
    title_ta: 'நேர்மையும் மனிதநேயமும் கொண்ட மக்கள் சேவைப் பயணம்.',
    subtitle_en: 'Learn about the purpose, leadership, and trustees guiding Ilangathir Trust in Dindigul.',
    subtitle_ta: 'இளங்கதிர் அறக்கட்டளையின் நோக்கம், பார்வை மற்றும் குழுவினரைப் பற்றித் தெரிந்துகொள்ளுங்கள்.',
    seo_title_en: 'About Ilangathir Trust | Vision, Mission & Trustees in Dindigul',
    seo_title_ta: 'எங்களைப் பற்றி | இளங்கதிர் அறக்கட்டளை — நோக்கம் & அறங்காவலர்கள்',
    seo_description_en: 'Discover the mission, vision, founder story, and trustees of Ilangathir Trust in V. Kallupatti, Dindigul, Tamil Nadu.',
    seo_description_ta: 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் நோக்கம், பார்வை மற்றும் அறங்காவலர்கள் விவரம்.',
    keywords_en: 'About Ilangathir Trust, Ilangathir Trustees, Dindigul NGO Mission, Charitable Trust Tamil Nadu',
    keywords_ta: 'இளங்கதிர் அறக்கட்டளை பற்றி, அறங்காவலர்கள், திண்டுக்கல் சமூக சேவை'
  },
  activities: {
    eyebrow_en: 'OUR PROGRAMMES',
    eyebrow_ta: 'எங்கள் நலப் பணிகள்',
    title_en: 'Practical programmes across education, healthcare, and relief.',
    title_ta: 'கல்வி, மருத்துவம் மற்றும் சமூக நலத் திட்டங்கள்.',
    subtitle_en: 'See how our local initiatives help students, elders, and rural communities across Tamil Nadu.',
    subtitle_ta: 'பள்ளி மாணவர் உதவி, கிராம மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூகப் பணிகளைப் பாருங்கள்.',
    seo_title_en: 'Programmes & Activities | Ilangathir Trust Tamil Nadu',
    seo_title_ta: 'நலப் பணிகள் & திட்டங்கள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Explore education support, free rural health camps, tree plantation, and welfare activities led by Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளையின் கல்வி உதவி, மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகள்.',
    keywords_en: 'Ilangathir Trust Activities, Education Aid Dindigul, Village Health Camp Tamil Nadu, Tree Plantation Trust',
    keywords_ta: 'இளங்கதிர் நலப் பணிகள், மாணவர் கல்வி உதவி, கிராம மருத்துவ முகாம், மரம் நடுதல்'
  },
  events: {
    eyebrow_en: 'EVENTS & CAMPS',
    eyebrow_ta: 'நிகழ்வுகள் & முகாம்கள்',
    title_en: 'Bringing communities together for meaningful local impact.',
    title_ta: 'ஊர் நலனுக்காக மக்களை இணைக்கும் நிகழ்வுகள் & முகாம்கள்.',
    subtitle_en: 'View upcoming medical camps, student drives, and highlights from our past events.',
    subtitle_ta: 'வரவிருக்கும் மருத்துவ முகாம்கள் மற்றும் நடந்து முடிந்த நிகழ்வுகளின் முழு விவரங்கள்.',
    seo_title_en: 'Events & Health Camps | Ilangathir Trust Dindigul',
    seo_title_ta: 'நிகழ்வுகள் & மருத்துவ முகாம்கள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Upcoming and past community events, eye and medical camps, and school drives organised by Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளை நடத்தும் வரவிருக்கும் மற்றும் முடிந்த நிகழ்வுகள், மருத்துவ முகாம்கள்.',
    keywords_en: 'Ilangathir Trust Events, Free Medical Camp Dindigul, Community Welfare Drive Tamil Nadu',
    keywords_ta: 'இளங்கதிர் நிகழ்வுகள், திண்டுக்கல் மருத்துவ முகாம், சமூக நல முகாம்'
  },
  gallery: {
    eyebrow_en: 'PHOTO & VIDEO ARCHIVE',
    eyebrow_ta: 'படங்கள் & வீடியோ தொகுப்பு',
    title_en: 'Moments from our field programmes.',
    title_ta: 'நமது களப் பணிகளின் புகைப்படங்கள் & வீடியோக்கள்.',
    subtitle_en: 'Browse verified photos and videos organized by programme and year.',
    subtitle_ta: 'நிகழ்வு மற்றும் ஆண்டு வாரியாகப் படங்களையும் வீடியோக்களையும் பாருங்கள்.',
    seo_title_en: 'Photo & Video Gallery | Ilangathir Trust',
    seo_title_ta: 'புகைப்படங்கள் & வீடியோ | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Photo and video albums documenting education drives, medical camps, and tree planting by Ilangathir Trust.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளை நிகழ்வுகளின் புகைப்படத் தொகுப்புகள் மற்றும் வீடியோக்கள்.',
    keywords_en: 'Ilangathir Trust Photos, Community Event Gallery Dindigul, Tamil Nadu NGO Photos',
    keywords_ta: 'இளங்கதிர் அறக்கட்டளை படங்கள், நிகழ்வு புகைப்படங்கள்'
  },
  blog: {
    eyebrow_en: 'STORIES & UPDATES',
    eyebrow_ta: 'செய்திகள் & பதிவுகள்',
    title_en: 'Field notes, stories, and trust announcements.',
    title_ta: 'களச் செய்திகள், அனுபவங்கள் மற்றும் அறிவிப்புகள்.',
    subtitle_en: 'Read community stories, programme reports, and notices from Ilangathir Trust.',
    subtitle_ta: 'இளங்கதிர் அறக்கட்டளையின் சமீபத்திய செய்திகள் மற்றும் கட்டுரைகளைப் படியுங்கள்.',
    seo_title_en: 'Stories, Field Reports & News | Ilangathir Trust',
    seo_title_ta: 'களச் செய்திகள் & கட்டுரைகள் | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Field stories, community impact updates, and official announcements from Ilangathir Trust, Tamil Nadu.',
    seo_description_ta: 'இளங்கதிர் அறக்கட்டளையின் களச் செய்திகள், அனுபவங்கள் மற்றும் அறிவிப்புகள்.',
    keywords_en: 'Ilangathir Trust Blog, Tamil Nadu Social Work Stories, Dindigul Community News',
    keywords_ta: 'இளங்கதிர் செய்திகள், சமூக நலக் கட்டுரைகள், திண்டுக்கல் செய்திகள்'
  },
  donate: {
    eyebrow_en: 'CONTRIBUTE',
    eyebrow_ta: 'நன்கொடை அளிக்க',
    title_en: 'Every contribution directly reaches families in need.',
    title_ta: 'உங்கள் ஒவ்வொரு உதவியும் நேரடியாக மக்களுக்குச் சேரும்.',
    subtitle_en: 'Contribute safely online via UPI, cards, or netbanking with instant receipt generation.',
    subtitle_ta: 'UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் பாதுகாப்பாக நன்கொடை வழங்கலாம்.',
    seo_title_en: 'Donate Online to Ilangathir Trust | Education & Relief Fund',
    seo_title_ta: 'நன்கொடை | இளங்கதிர் அறக்கட்டளை — பாதுகாப்பான ஆன்லைன் உதவி',
    seo_description_en: 'Make a secure online donation to Ilangathir Trust in Dindigul, Tamil Nadu for student education, medical camps, and welfare.',
    seo_description_ta: 'கல்வி, மருத்துவ முகாம் மற்றும் சமூக நலப் பணிகளுக்குப் பாதுகாப்பாக நன்கொடை அளியுங்கள்.',
    keywords_en: 'Donate Ilangathir Trust, Charity Donation Tamil Nadu, NGO Donation Dindigul',
    keywords_ta: 'இளங்கதிர் நன்கொடை, அறக்கட்டளை உதவி, தமிழ்நாடு நன்கொடை'
  },
  contact: {
    eyebrow_en: 'CONNECT WITH US',
    eyebrow_ta: 'தொடர்பு கொள்ள',
    title_en: 'Reach out to our office or join as a volunteer.',
    title_ta: 'எங்களுடன் தொடர்பு கொள்ளவும் அல்லது தன்னார்வலராக இணையவும்.',
    subtitle_en: 'Send a message to our Dindigul office or register to volunteer in local programmes.',
    subtitle_ta: 'உங்கள் கேள்விகளை அனுப்பவும் அல்லது எங்கள் நலப் பணிகளில் தன்னார்வலராக இணையவும்.',
    seo_title_en: 'Contact & Volunteer | Ilangathir Trust, V. Kallupatti, Dindigul',
    seo_title_ta: 'தொடர்பு & தன்னார்வ சேவை | இளங்கதிர் அறக்கட்டளை',
    seo_description_en: 'Contact Ilangathir Trust at V. Kallupatti, Dindigul, Tamil Nadu (+91 93630 15050) or apply to volunteer.',
    seo_description_ta: 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையைத் தொடர்பு கொள்ளவும் அல்லது தன்னார்வலராக இணையவும்.',
    keywords_en: 'Contact Ilangathir Trust, Volunteer Dindigul NGO, V. Kallupatti Trust Phone Address',
    keywords_ta: 'இளங்கதிர் அறக்கட்டளை தொடர்பு, தன்னார்வலர் பதிவு, திண்டுக்கல்'
  }
} as const;

export function pickText(item: { value_en: string; value_ta: string }, lang: Language): string {
  return lang === 'ta' && item.value_ta ? item.value_ta : item.value_en;
}
