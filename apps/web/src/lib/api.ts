import type {
  ActivityItem,
  BlogPost,
  BootstrapPayload,
  EventItem,
  GalleryFolder,
  GalleryItem,
  PageContent,
  PaginatedResponse,
  TeamMember
} from '@ilangathir/shared';

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://ilangathir-api.vercel.app' : 'http://localhost:4000')
).replace(/\/+$/, '');

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://www.ilangathirtrust.org')
).replace(/\/+$/, '');

async function fetchApi<T>(path: string, revalidateSeconds = 120): Promise<T | null> {
  try {
    const fetchOpts: RequestInit & { next?: { revalidate?: number } } =
      revalidateSeconds === 0
        ? { cache: 'no-store', signal: AbortSignal.timeout(4500) }
        : { next: { revalidate: revalidateSeconds }, signal: AbortSignal.timeout(4500) };

    const res = await fetch(`${API_URL}${path}`, fetchOpts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const DEFAULT_BOOTSTRAP: BootstrapPayload = {
  settings: {
    trust_name: { value_en: 'Ilangathir Trust', value_ta: 'இளங்கதிர் அறக்கட்டளை', json_value: null },
    trust_legal_name: { value_en: 'Ilangathir Arakattalai', value_ta: 'இளங்கதிர் அறக்கட்டளை', json_value: null },
    tagline: {
      value_en: 'Together, We Can Create a Brighter Tomorrow.',
      value_ta: 'ஒன்றிணைந்து, நாம் ஒரு ஒளிரும் நாளையை உருவாக்குவோம்.',
      json_value: null
    },
    logo_url: { value_en: '/assets/logo.webp', value_ta: '/assets/logo.webp', json_value: null },
    favicon_url: { value_en: '/assets/logo.webp', value_ta: '/assets/logo.webp', json_value: null },
    phone: { value_en: '+91 93630 15050', value_ta: '+91 93630 15050', json_value: null },
    email: { value_en: 'ilangathirtrust@gmail.com', value_ta: 'ilangathirtrust@gmail.com', json_value: null },
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
    founder_image_url: { value_en: '/assets/founder.jpg', value_ta: '/assets/founder.jpg', json_value: null },
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
  },
  navigation: [
    { id: 'h-home', menu_location: 'header', label_en: 'Home', label_ta: 'முகப்பு', href: '/', icon_name: 'Home', sort_order: 1, open_in_new_tab: false },
    { id: 'h-about', menu_location: 'header', label_en: 'About', label_ta: 'எங்களைப் பற்றி', href: '/about', icon_name: 'HeartHandshake', sort_order: 2, open_in_new_tab: false },
    { id: 'h-act', menu_location: 'header', label_en: 'Activities', label_ta: 'செயல்பாடுகள்', href: '/activities', icon_name: 'Sparkles', sort_order: 3, open_in_new_tab: false },
    { id: 'h-events', menu_location: 'header', label_en: 'Events', label_ta: 'நிகழ்வுகள்', href: '/events', icon_name: 'CalendarDays', sort_order: 4, open_in_new_tab: false },
    { id: 'h-gallery', menu_location: 'header', label_en: 'Gallery', label_ta: 'புகைப்படங்கள்', href: '/gallery', icon_name: 'Images', sort_order: 5, open_in_new_tab: false },
    { id: 'h-blog', menu_location: 'header', label_en: 'Blog', label_ta: 'கட்டுரைகள்', href: '/blog', icon_name: 'BookOpen', sort_order: 6, open_in_new_tab: false },
    { id: 'h-contact', menu_location: 'header', label_en: 'Contact', label_ta: 'தொடர்பு', href: '/contact', icon_name: 'Mail', sort_order: 7, open_in_new_tab: false },
    { id: 'm-home', menu_location: 'mobile_bottom', label_en: 'Home', label_ta: 'முகப்பு', href: '/', icon_name: 'Home', sort_order: 1, open_in_new_tab: false },
    { id: 'm-events', menu_location: 'mobile_bottom', label_en: 'Events', label_ta: 'நிகழ்வுகள்', href: '/events', icon_name: 'CalendarDays', sort_order: 2, open_in_new_tab: false },
    { id: 'm-gallery', menu_location: 'mobile_bottom', label_en: 'Gallery', label_ta: 'புகைப்படங்கள்', href: '/gallery', icon_name: 'Images', sort_order: 3, open_in_new_tab: false },
    { id: 'm-blog', menu_location: 'mobile_bottom', label_en: 'Blog', label_ta: 'கட்டுரைகள்', href: '/blog', icon_name: 'BookOpen', sort_order: 4, open_in_new_tab: false },
    { id: 'm-donate', menu_location: 'mobile_bottom', label_en: 'Donate', label_ta: 'நன்கொடை', href: '/donate', icon_name: 'Heart', sort_order: 5, open_in_new_tab: false }
  ],
  marquee: [],
  homePage: null
};

export async function getBootstrap(): Promise<BootstrapPayload> {
  const data = await fetchApi<BootstrapPayload>('/api/public/bootstrap', 0);
  if (!data) return DEFAULT_BOOTSTRAP;
  return {
    settings: { ...DEFAULT_BOOTSTRAP.settings, ...(data.settings || {}) },
    navigation: data.navigation?.length ? data.navigation : DEFAULT_BOOTSTRAP.navigation,
    marquee: data.marquee || [],
    homePage: data.homePage || null
  };
}

export async function getPageContent(slug: string): Promise<PageContent | null> {
  return fetchApi<PageContent>(`/api/public/pages/${encodeURIComponent(slug)}`, 120);
}

export async function getActivities(params: { page?: number; pageSize?: number; category?: string; featured?: boolean } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.category) q.set('category', params.category);
  if (params.featured) q.set('featured', 'true');
  return (await fetchApi<PaginatedResponse<ActivityItem>>(`/api/public/activities?${q.toString()}`, 120)) || {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return (await fetchApi<TeamMember[]>('/api/public/team', 180)) || [];
}

export async function getEvents(params: { timeframe?: 'upcoming' | 'past' | 'all'; category?: string; page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams();
  if (params.timeframe) q.set('timeframe', params.timeframe);
  if (params.category) q.set('category', params.category);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return (await fetchApi<PaginatedResponse<EventItem>>(`/api/public/events?${q.toString()}`, 120)) || {
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 1
  };
}

export async function getEventBySlug(slug: string) {
  return fetchApi<EventItem & { gallery_preview_items?: GalleryItem[] }>(`/api/public/events/${encodeURIComponent(slug)}`, 120);
}

export async function getGalleryFolders(params: { category?: string; year?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.year) q.set('year', params.year);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return (await fetchApi<PaginatedResponse<GalleryFolder> & { facets: { categories: string[]; years: number[] } }>(
    `/api/public/gallery/folders?${q.toString()}`,
    120
  )) || {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
    facets: { categories: [], years: [] }
  };
}

export async function getGalleryFolderDetail(slug: string, page = 1, pageSize = 24) {
  return fetchApi<{
    folder: GalleryFolder;
    items: GalleryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/public/gallery/folders/${encodeURIComponent(slug)}?page=${page}&pageSize=${pageSize}`, 120);
}

export async function getBlogs(params: { category?: string; search?: string; page?: number; pageSize?: number; featured?: boolean } = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.featured) q.set('featured', 'true');
  return (await fetchApi<PaginatedResponse<BlogPost> & { categories: Array<{ id: string; slug: string; name_en: string; name_ta: string }> }>(
    `/api/public/blogs?${q.toString()}`,
    120
  )) || {
    items: [],
    categories: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 1
  };
}

export async function getBlogBySlug(slug: string) {
  return fetchApi<{ post: BlogPost; related: BlogPost[] }>(`/api/public/blogs/${encodeURIComponent(slug)}`, 120);
}

export async function getSitemapData() {
  return (await fetchApi<{
    events: Array<{ slug: string; updated_at: string }>;
    blogs: Array<{ slug: string; updated_at: string }>;
    galleryFolders: Array<{ slug: string; updated_at: string }>;
  }>('/api/public/sitemap-data', 300)) || {
    events: [],
    blogs: [],
    galleryFolders: []
  };
}
