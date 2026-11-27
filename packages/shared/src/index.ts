import { z } from 'zod';

export type Language = 'en' | 'ta';
export type AdminRole = 'super_admin' | 'admin' | 'editor';
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
  donor_email: z.string().trim().email().max(190),
  donor_phone: z.string().trim().min(7).max(30),
  donor_pan: z.string().trim().max(20).optional().default(''),
  donor_address: z.string().trim().max(400).optional().default(''),
  purpose: z.string().trim().min(2).max(120).default('General Welfare'),
  is_anonymous: z.boolean().optional().default(false),
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
