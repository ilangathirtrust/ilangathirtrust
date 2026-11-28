import { z } from 'zod';

export type Language = 'en' | 'ta';
export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'visitor';
export type PublishStatus = 'draft' | 'published' | 'archived';

export interface BilingualFaq {
  question_en: string;
  question_ta: string;
  answer_en: string;
  answer_ta: string;
}

export interface SiteSettingRecord {
  key: string;
  category: string;
  value_en: string;
  value_ta: string;
  json_value: Record<string, unknown> | null;
}

export interface NavigationItem {
  id: string;
  menu_location: 'header' | 'mobile_bottom' | 'footer_explore' | 'footer_support';
  label_en: string;
  label_ta: string;
  href: string;
  icon_name: string | null;
  sort_order: number;
  is_visible?: boolean;
  open_in_new_tab: boolean;
}

export interface PageContent {
  slug: string;
  page_name: string;
  hero_eyebrow_en: string;
  hero_eyebrow_ta: string;
  hero_title_en: string;
  hero_title_ta: string;
  hero_subtitle_en: string;
  hero_subtitle_ta: string;
  hero_image_url: string;
  hero_cta_primary_en: string;
  hero_cta_primary_ta: string;
  hero_cta_primary_href: string;
  hero_cta_secondary_en: string;
  hero_cta_secondary_ta: string;
  hero_cta_secondary_href: string;
  body_sections: Array<Record<string, unknown>>;
  faqs: BilingualFaq[];
  seo_title_en: string;
  seo_title_ta: string;
  seo_description_en: string;
  seo_description_ta: string;
  seo_keywords_en?: string;
  seo_keywords_ta?: string;
  og_image_url?: string;
  updated_at?: string;
}

export interface ActivityItem {
  id: string;
  slug: string;
  title_en: string;
  title_ta: string;
  summary_en: string;
  summary_ta: string;
  description_en: string;
  description_ta: string;
  category: string;
  image_url: string;
  activity_date: string | null;
  location_en: string;
  location_ta: string;
  impact_metric: string;
  is_featured: boolean;
  status?: PublishStatus;
}

export interface TeamMember {
  id: string;
  name_en: string;
  name_ta: string;
  designation_en: string;
  designation_ta: string;
  biography_en: string;
  biography_ta: string;
  image_url: string;
  sort_order: number;
}

export interface MarqueeItem {
  id: string;
  title_en: string;
  title_ta: string;
  alt_text_en: string;
  alt_text_ta: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

export interface GalleryFolder {
  id: string;
  slug: string;
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  category: string;
  event_date: string | null;
  event_year: number | null;
  location_en: string;
  location_ta: string;
  cover_image_url: string;
  preview_images: string[];
  item_count: number;
  status?: 'draft' | 'published';
}

export interface GalleryItem {
  id: string;
  folder_id: string;
  media_type: 'image' | 'video';
  file_url: string;
  thumbnail_url: string;
  title_en: string;
  title_ta: string;
  caption_en: string;
  caption_ta: string;
  alt_text_en: string;
  alt_text_ta: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  sort_order: number;
}

export interface EventItem {
  id: string;
  slug: string;
  title_en: string;
  title_ta: string;
  summary_en: string;
  summary_ta: string;
  description_en: string;
  description_ta: string;
  category: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location_en: string;
  location_ta: string;
  banner_url: string;
  gallery_folder_id: string | null;
  gallery_folder_slug?: string | null;
  registration_enabled: boolean;
  is_featured: boolean;
  seo_title_en?: string;
  seo_title_ta?: string;
  seo_description_en?: string;
  seo_description_ta?: string;
  status?: PublishStatus;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  description_en: string;
  description_ta: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  category_id: string | null;
  category_slug?: string | null;
  category_name_en?: string | null;
  category_name_ta?: string | null;
  title_en: string;
  title_ta: string;
  excerpt_en: string;
  excerpt_ta: string;
  content_en: string;
  content_ta: string;
  featured_image_url: string;
  featured_image_alt_en: string;
  featured_image_alt_ta: string;
  media_gallery?: Array<{ url: string; type: 'image' | 'video'; caption_en?: string; caption_ta?: string }>;
  tags: string[];
  author_name: string;
  author_role: string;
  reading_time_minutes: number;
  is_featured: boolean;
  seo_title_en?: string;
  seo_title_ta?: string;
  seo_description_en?: string;
  seo_description_ta?: string;
  seo_keywords_en?: string;
  seo_keywords_ta?: string;
  status?: PublishStatus;
  published_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BootstrapPayload {
  settings: Record<string, { value_en: string; value_ta: string; json_value: Record<string, unknown> | null }>;
  navigation: NavigationItem[];
  marquee: MarqueeItem[];
  homePage: PageContent | null;
}

// Shared Input Validation Schemas
export const contactEnquirySchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(2).max(220),
  message: z.string().trim().min(10).max(5000),
  preferred_lang: z.enum(['en', 'ta']).optional().default('en'),
  website: z.string().max(0).optional() // Honeypot anti-spam field
});

export const volunteerApplicationSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().min(7).max(30),
  district: z.string().trim().min(2).max(120),
  interest: z.string().trim().min(2).max(180),
  availability: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().max(3000).optional().default(''),
  preferred_lang: z.enum(['en', 'ta']).optional().default('en'),
  consent: z.literal(true),
  website: z.string().max(0).optional() // Honeypot anti-spam field
});

export const createDonationOrderSchema = z.object({
  donor_name: z.string().trim().min(2).max(160),
  donor_phone: z.string().trim().min(7).max(30),
  donor_email: z
    .string()
    .trim()
    .max(190)
    .optional()
    .default('')
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Enter a valid email address.'),
  purpose: z.string().trim().min(2).max(120).optional().default('General Welfare'),
  amount_inr: z.number().min(100).max(10000000),
  idempotency_key: z.string().trim().min(8).max(120).optional()
});

export const verifyDonationSchema = z.object({
  razorpay_order_id: z.string().trim().min(6),
  razorpay_payment_id: z.string().trim().min(6),
  razorpay_signature: z.string().trim().min(16)
});

export interface DonationConfig {
  enabled: boolean;
  currency: string;
  suggested_amounts: number[];
  purposes: string[];
}

export const DEFAULT_DONATION_CONFIG: DonationConfig = {
  enabled: true,
  currency: 'INR',
  suggested_amounts: [500, 1000, 2500, 5000, 10000],
  purposes: ['General Welfare', 'Education Support', 'Medical Relief', 'Environmental Care']
};

export function parseDonationConfig(
  settings: Record<string, { json_value?: Record<string, unknown> | null }> | null | undefined
): DonationConfig {
  const raw = settings?.donation_config?.json_value as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw !== 'object') return DEFAULT_DONATION_CONFIG;
  const suggested = Array.isArray(raw.suggested_amounts)
    ? raw.suggested_amounts.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 100)
    : DEFAULT_DONATION_CONFIG.suggested_amounts;
  const purposes = Array.isArray(raw.purposes)
    ? raw.purposes.map((p) => String(p).trim()).filter(Boolean)
    : DEFAULT_DONATION_CONFIG.purposes;

  return {
    enabled: raw.enabled !== false,
    currency: typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim() : 'INR',
    suggested_amounts: suggested.length ? suggested : DEFAULT_DONATION_CONFIG.suggested_amounts,
    purposes: purposes.length ? purposes : DEFAULT_DONATION_CONFIG.purposes
  };
}

export function isDonationsEnabled(
  settings: Record<string, { json_value?: Record<string, unknown> | null }> | null | undefined
): boolean {
  return parseDonationConfig(settings).enabled;
}

export const TRUST_INFO = {
  legalNameEn: 'Ilangathir Arakattalai',
  legalNameTa: 'இளங்கதிர் அறக்கட்டளை',
  displayNameEn: 'Ilangathir Trust',
  displayNameTa: 'இளங்கதிர் அறக்கட்டளை',
  registrationNumber: 'Book - 4/47/2024',
  panNumber: 'AACT13541A',
  founderNameEn: 'Prejeval Prince',
  founderNameTa: 'பிரெஜெவல் பிரின்ஸ்',
  email: 'ilangathirtrust@gmail.com',
  phone: '+91 93630 15050',
  whatsappNumber: '919363015050',
  addressEn: 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.',
  addressTa: 'V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு, இந்தியா.',
  hoursEn: 'Monday - Saturday: 9:30 AM - 6:00 PM',
  hoursTa: 'திங்கள் - சனி: காலை 9:30 - மாலை 6:00',
  handle: '@ilangathirtrust'
} as const;

export interface SocialLinkItem {
  id: string;
  platform: string;
  name_en: string;
  name_ta: string;
  handle: string;
  url: string;
  icon_url: string;
  enabled: boolean;
  sort_order: number;
  is_custom?: boolean;
}

export const LUCIDE_ICON_CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons';

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'social-instagram',
    platform: 'instagram',
    name_en: 'Instagram',
    name_ta: 'இன்ஸ்டாகிராம்',
    handle: '@ilangathirtrust',
    url: 'https://instagram.com/ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/instagram.svg`,
    enabled: true,
    sort_order: 1,
    is_custom: false
  },
  {
    id: 'social-whatsapp',
    platform: 'whatsapp',
    name_en: 'WhatsApp',
    name_ta: 'வாட்ஸ்அப்',
    handle: '+91 93630 15050',
    url: 'https://wa.me/919363015050',
    icon_url: `${LUCIDE_ICON_CDN}/message-circle.svg`,
    enabled: true,
    sort_order: 2,
    is_custom: false
  },
  {
    id: 'social-youtube',
    platform: 'youtube',
    name_en: 'YouTube',
    name_ta: 'யூடியூப்',
    handle: '@ilangathirtrust',
    url: 'https://youtube.com/@ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/youtube.svg`,
    enabled: true,
    sort_order: 3,
    is_custom: false
  },
  {
    id: 'social-facebook',
    platform: 'facebook',
    name_en: 'Facebook',
    name_ta: 'ஃபேஸ்புக்',
    handle: '@ilangathirtrust',
    url: 'https://facebook.com/ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/facebook.svg`,
    enabled: true,
    sort_order: 4,
    is_custom: false
  },
  {
    id: 'social-x',
    platform: 'x',
    name_en: 'X (Twitter)',
    name_ta: 'எக்ஸ் (ட்விட்டர்)',
    handle: '@ilangathirtrust',
    url: 'https://x.com/ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/twitter.svg`,
    enabled: true,
    sort_order: 5,
    is_custom: false
  },
  {
    id: 'social-threads',
    platform: 'threads',
    name_en: 'Threads',
    name_ta: 'த்ரெட்ஸ்',
    handle: '@ilangathirtrust',
    url: 'https://threads.net/@ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/at-sign.svg`,
    enabled: true,
    sort_order: 6,
    is_custom: false
  },
  {
    id: 'social-linkedin',
    platform: 'linkedin',
    name_en: 'LinkedIn',
    name_ta: 'லிங்க்ட்இன்',
    handle: '@ilangathirtrust',
    url: 'https://linkedin.com/company/ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/linkedin.svg`,
    enabled: true,
    sort_order: 7,
    is_custom: false
  },
  {
    id: 'social-telegram',
    platform: 'telegram',
    name_en: 'Telegram',
    name_ta: 'டெலிகிராம்',
    handle: '@ilangathirtrust',
    url: 'https://t.me/ilangathirtrust',
    icon_url: `${LUCIDE_ICON_CDN}/send.svg`,
    enabled: false,
    sort_order: 8,
    is_custom: false
  }
];

function isSafeLinkUrl(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v.startsWith('https://') || v.startsWith('http://') || v.startsWith('mailto:') || v.startsWith('tel:');
}

export const socialLinkItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  platform: z.string().trim().min(1).max(60),
  name_en: z.string().trim().min(1).max(80),
  name_ta: z.string().trim().max(80).optional().default(''),
  handle: z.string().trim().max(120).optional().default(''),
  url: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(isSafeLinkUrl, 'Link URL must start with https://, http://, mailto:, or tel:'),
  icon_url: z
    .string()
    .trim()
    .max(600)
    .optional()
    .default(`${LUCIDE_ICON_CDN}/globe.svg`)
    .refine((v) => !v || v.startsWith('https://') || v.startsWith('http://') || v.startsWith('/'), 'Icon URL must be an https://, http://, or relative / path'),
  enabled: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(500).default(0),
  is_custom: z.boolean().optional().default(false)
});

export const socialLinksUpdateSchema = z.object({
  items: z.array(socialLinkItemSchema).max(40)
});

export const receiptLookupSchema = z.object({
  receipt_number: z.string().trim().min(4).max(60),
  contact: z.string().trim().min(5).max(190)
});

export function parseSocialLinks(
  settings: Record<string, { json_value?: Record<string, unknown> | null }> | null | undefined
): SocialLinkItem[] {
  const rawJson = settings?.social_links?.json_value as Record<string, unknown> | null | undefined;
  const rawItems = rawJson && Array.isArray(rawJson.items) ? rawJson.items : null;
  if (!rawItems || rawItems.length === 0) {
    return DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item }));
  }

  const normalized: SocialLinkItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const parsed = socialLinkItemSchema.safeParse(rawItems[i]);
    if (parsed.success) {
      normalized.push({
        ...parsed.data,
        name_ta: parsed.data.name_ta || parsed.data.name_en,
        sort_order: Number.isFinite(parsed.data.sort_order) ? parsed.data.sort_order : i + 1
      });
    }
  }

  if (normalized.length === 0) {
    return DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item }));
  }

  return normalized.sort((a, b) => a.sort_order - b.sort_order);
}

export function getEnabledSocialLinks(
  settings: Record<string, { json_value?: Record<string, unknown> | null }> | null | undefined
): SocialLinkItem[] {
  return parseSocialLinks(settings).filter((item) => item.enabled && isSafeLinkUrl(item.url));
}

export function pickLocalized<T extends Record<string, unknown>>(
  record: T | null | undefined,
  baseField: string,
  lang: Language
): string {
  if (!record) return '';
  const primary = record[`${baseField}_${lang}`];
  if (typeof primary === 'string' && primary.trim().length > 0) return primary;
  const fallback = record[`${baseField}_${lang === 'ta' ? 'en' : 'ta'}`];
  return typeof fallback === 'string' ? fallback : '';
}

export function sanitizePlainText(input: string): string {
  return input.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}
