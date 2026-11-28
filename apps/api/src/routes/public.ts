import { Router } from 'express';
import {
  contactEnquirySchema,
  DEFAULT_SOCIAL_LINKS,
  isDonationsEnabled,
  sanitizePlainText,
  volunteerApplicationSchema
} from '@ilangathir/shared';
import { getSupabaseAdmin } from '../config/supabase.js';
import { formSubmitLimiter, publicApiLimiter } from '../middleware/rateLimit.js';
import { withCache } from '../services/cache.js';

export const publicRouter = Router();

publicRouter.use(publicApiLimiter);

function parsePagination(query: Record<string, unknown>, defaultSize = 12, maxSize = 48) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number(query.pageSize) || defaultSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

publicRouter.get('/bootstrap', async (_req, res, next) => {
  try {
    // Query directly without multi-instance memory/CDN caching so admin toggles (social links, donations, nav) propagate immediately
    const supabase = getSupabaseAdmin();
    const [settingsRes, navRes, marqueeRes, homeRes] = await Promise.all([
      supabase
        .from('site_settings')
        .select('key, value_en, value_ta, json_value')
        .in('key', ['donation_config', 'social_links'])
        .eq('is_public', true),
      supabase
        .from('navigation_items')
        .select('id, menu_location, label_en, label_ta, href, icon_name, sort_order, open_in_new_tab')
        .eq('is_visible', true)
        .order('menu_location', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase
        .from('marquee_items')
        .select('id, title_en, title_ta, alt_text_en, alt_text_ta, image_url, link_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(24),
      supabase
        .from('page_contents')
        .select('*')
        .eq('slug', 'home')
        .eq('status', 'published')
        .maybeSingle()
    ]);

    if (settingsRes.error) throw settingsRes.error;
    if (navRes.error) throw navRes.error;
    if (marqueeRes.error) throw marqueeRes.error;
    if (homeRes.error) throw homeRes.error;

    const settings = Object.fromEntries(
      (settingsRes.data || []).map((row) => [
        row.key,
        {
          value_en: row.value_en,
          value_ta: row.value_ta,
          json_value: row.json_value
        }
      ])
    );

    if (!settings.social_links) {
      settings.social_links = {
        value_en: '',
        value_ta: '',
        json_value: { items: DEFAULT_SOCIAL_LINKS }
      };
    }

    const donationsEnabled = isDonationsEnabled(settings);
    const navigation = (navRes.data || []).filter((item) => {
      if (!donationsEnabled && typeof item.href === 'string' && item.href.startsWith('/donate')) {
        return false;
      }
      return true;
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.json({
      settings,
      navigation,
      marquee: marqueeRes.data || [],
      homePage: homeRes.data || null
    });
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/pages/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    const page = await withCache(`public:page:${slug}`, async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(page);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/activities', async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req.query, 12, 36);
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const featuredOnly = req.query.featured === 'true';

    const cacheKey = `public:activities:${page}:${pageSize}:${category}:${featuredOnly}`;
    const result = await withCache(cacheKey, async () => {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('activities')
        .select(
          'id, slug, title_en, title_ta, summary_en, summary_ta, description_en, description_ta, category, image_url, activity_date, location_en, location_ta, impact_metric, is_featured',
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('activity_date', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (category) query = query.eq('category', category);
      if (featuredOnly) query = query.eq('is_featured', true);

      const { data, error, count } = await query;
      if (error) throw error;
      const total = count || 0;
      return {
        items: data || [],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/team', async (_req, res, next) => {
  try {
    const team = await withCache('public:team', async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name_en, name_ta, designation_en, designation_ta, biography_en, biography_ta, image_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    });

    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=300');
    res.json(team);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/events', async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req.query, 9, 36);
    const timeframe = req.query.timeframe === 'upcoming' || req.query.timeframe === 'past'
      ? req.query.timeframe
      : 'all';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const today = new Date().toISOString().slice(0, 10);

    const cacheKey = `public:events:${timeframe}:${category}:${page}:${pageSize}:${today}`;
    const result = await withCache(cacheKey, async () => {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('events')
        .select(
          'id, slug, title_en, title_ta, summary_en, summary_ta, description_en, description_ta, category, event_date, start_time, end_time, location_en, location_ta, banner_url, gallery_folder_id, registration_enabled, is_featured, gallery_folders(slug)',
          { count: 'exact' }
        )
        .eq('status', 'published');

      if (timeframe === 'upcoming') {
        query = query.gte('event_date', today).order('event_date', { ascending: true });
      } else if (timeframe === 'past') {
        query = query.lt('event_date', today).order('event_date', { ascending: false });
      } else {
        query = query.order('event_date', { ascending: false });
      }

      if (category) query = query.eq('category', category);

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      const total = count || 0;
      const items = (data || []).map((row) => {
        const gf = row.gallery_folders as unknown as { slug?: string } | null;
        return {
          ...row,
          gallery_folder_slug: gf?.slug || null,
          gallery_folders: undefined
        };
      });

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/events/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const event = await withCache(`public:event:${slug}`, async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('events')
        .select('*, gallery_folders(id, slug, title_en, title_ta, item_count)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      let folderItems: unknown[] = [];
      if (data.gallery_folder_id) {
        const { data: items } = await supabase
          .from('gallery_items')
          .select('id, folder_id, media_type, file_url, thumbnail_url, title_en, title_ta, caption_en, caption_ta, alt_text_en, alt_text_ta, sort_order')
          .eq('folder_id', data.gallery_folder_id)
          .eq('is_visible', true)
          .order('sort_order', { ascending: true })
          .limit(12);
        folderItems = items || [];
      }

      return { ...data, gallery_preview_items: folderItems };
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(event);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/gallery/folders', async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req.query, 12, 36);
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const year = req.query.year ? Number(req.query.year) : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const cacheKey = `public:gallery:folders:${page}:${pageSize}:${category}:${year || ''}:${search}`;
    const result = await withCache(cacheKey, async () => {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('gallery_folders')
        .select(
          'id, slug, title_en, title_ta, description_en, description_ta, category, event_date, event_year, location_en, location_ta, cover_image_url, preview_images, item_count',
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('event_date', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (category) query = query.eq('category', category);
      if (year && Number.isFinite(year)) query = query.eq('event_year', year);
      if (search) {
        const clean = search.replace(/[%_,().*]/g, '').slice(0, 100);
        if (clean) {
          query = query.or(`title_en.ilike.%${clean}%,title_ta.ilike.%${clean}%,description_en.ilike.%${clean}%`);
        }
      }

      const [foldersRes, facetsRes] = await Promise.all([
        query,
        supabase
          .from('gallery_folders')
          .select('category, event_year')
          .eq('status', 'published')
      ]);

      if (foldersRes.error) throw foldersRes.error;
      const categories = [...new Set((facetsRes.data || []).map((f) => f.category).filter(Boolean))].sort();
      const years = [...new Set((facetsRes.data || []).map((f) => f.event_year).filter((y): y is number => typeof y === 'number'))].sort((a, b) => b - a);
      const total = foldersRes.count || 0;

      return {
        items: foldersRes.data || [],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        facets: { categories, years }
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/gallery/folders/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const { page, pageSize, from, to } = parsePagination(req.query, 24, 60);

    const result = await withCache(`public:gallery:folder:${slug}:${page}:${pageSize}`, async () => {
      const supabase = getSupabaseAdmin();
      const { data: folder, error: folderErr } = await supabase
        .from('gallery_folders')
        .select('id, slug, title_en, title_ta, description_en, description_ta, category, event_date, event_year, location_en, location_ta, cover_image_url, preview_images, item_count')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (folderErr) throw folderErr;
      if (!folder) return null;

      const { data: items, error: itemsErr, count } = await supabase
        .from('gallery_items')
        .select(
          'id, folder_id, media_type, file_url, thumbnail_url, title_en, title_ta, caption_en, caption_ta, alt_text_en, alt_text_ta, width, height, duration_seconds, sort_order',
          { count: 'exact' }
        )
        .eq('folder_id', folder.id)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (itemsErr) throw itemsErr;
      const total = count || 0;
      return {
        folder,
        items: items || [],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      };
    });

    if (!result) {
      res.status(404).json({ error: 'Gallery folder not found.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/blogs', async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req.query, 9, 30);
    const categorySlug = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const featuredOnly = req.query.featured === 'true';

    const cacheKey = `public:blogs:${page}:${pageSize}:${categorySlug}:${search}:${featuredOnly}`;
    const result = await withCache(cacheKey, async () => {
      const supabase = getSupabaseAdmin();

      const { data: categories } = await supabase
        .from('blog_categories')
        .select('id, slug, name_en, name_ta, description_en, description_ta')
        .order('sort_order', { ascending: true });

      let categoryId: string | null = null;
      if (categorySlug && categories) {
        const matched = categories.find((c) => c.slug === categorySlug);
        categoryId = matched ? matched.id : '00000000-0000-0000-0000-000000000000';
      }

      let query = supabase
        .from('blog_posts')
        .select(
          'id, slug, category_id, title_en, title_ta, excerpt_en, excerpt_ta, featured_image_url, featured_image_alt_en, featured_image_alt_ta, tags, author_name, author_role, reading_time_minutes, is_featured, published_at, blog_categories(slug, name_en, name_ta)',
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (featuredOnly) query = query.eq('is_featured', true);
      if (search) {
        const clean = search.replace(/[%_,().*]/g, '').slice(0, 100);
        if (clean) {
          query = query.or(`title_en.ilike.%${clean}%,title_ta.ilike.%${clean}%,excerpt_en.ilike.%${clean}%,excerpt_ta.ilike.%${clean}%`);
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const items = (data || []).map((row) => {
        const cat = row.blog_categories as unknown as { slug?: string; name_en?: string; name_ta?: string } | null;
        return {
          ...row,
          category_slug: cat?.slug || null,
          category_name_en: cat?.name_en || null,
          category_name_ta: cat?.name_ta || null,
          blog_categories: undefined
        };
      });

      const total = count || 0;
      return {
        items,
        categories: categories || [],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/blogs/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const result = await withCache(`public:blog:${slug}`, async () => {
      const supabase = getSupabaseAdmin();
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(slug, name_en, name_ta)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      if (!post) return null;

      let relatedQuery = supabase
        .from('blog_posts')
        .select('id, slug, title_en, title_ta, excerpt_en, excerpt_ta, featured_image_url, featured_image_alt_en, featured_image_alt_ta, reading_time_minutes, published_at')
        .eq('status', 'published')
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);

      if (post.category_id) relatedQuery = relatedQuery.eq('category_id', post.category_id);
      const { data: related } = await relatedQuery;

      const cat = post.blog_categories as unknown as { slug?: string; name_en?: string; name_ta?: string } | null;
      return {
        post: {
          ...post,
          category_slug: cat?.slug || null,
          category_name_en: cat?.name_en || null,
          category_name_ta: cat?.name_ta || null,
          blog_categories: undefined
        },
        related: related || []
      };
    });

    if (!result) {
      res.status(404).json({ error: 'Blog post not found.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/sitemap-data', async (_req, res, next) => {
  try {
    const data = await withCache('public:sitemap', async () => {
      const supabase = getSupabaseAdmin();
      const [eventsRes, blogsRes, foldersRes] = await Promise.all([
        supabase.from('events').select('slug, updated_at').eq('status', 'published'),
        supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
        supabase.from('gallery_folders').select('slug, updated_at').eq('status', 'published')
      ]);
      return {
        events: eventsRes.data || [],
        blogs: blogsRes.data || [],
        galleryFolders: foldersRes.data || []
      };
    }, 600);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

publicRouter.post('/contact', formSubmitLimiter, async (req, res, next) => {
  try {
    const parsed = contactEnquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Please check your contact form inputs and ensure all required fields are valid.',
        issues: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const d = parsed.data;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('contact_enquiries').insert({
      name: sanitizePlainText(d.name),
      email: d.email.toLowerCase(),
      phone: sanitizePlainText(d.phone),
      subject: sanitizePlainText(d.subject),
      message: d.message.replace(/[<>]/g, '').trim(),
      preferred_lang: d.preferred_lang
    });

    if (error) throw error;
    res.status(201).json({
      message: d.preferred_lang === 'ta'
        ? 'நன்றி! உங்கள் செய்தி இளங்கதிர் அறக்கட்டளைக்கு அனுப்பப்பட்டது.'
        : 'Thank you. Your enquiry has been received by Ilangathir Trust.'
    });
  } catch (err) {
    next(err);
  }
});

publicRouter.post('/volunteer', formSubmitLimiter, async (req, res, next) => {
  try {
    const parsed = volunteerApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Complete all required volunteer fields and accept consent before submitting.',
        issues: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const d = parsed.data;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('volunteer_applications').insert({
      full_name: sanitizePlainText(d.full_name),
      email: d.email.toLowerCase(),
      phone: sanitizePlainText(d.phone),
      district: sanitizePlainText(d.district),
      interest: sanitizePlainText(d.interest),
      availability: sanitizePlainText(d.availability),
      message: d.message.replace(/[<>]/g, '').trim(),
      preferred_lang: d.preferred_lang,
      consent: true
    });

    if (error) throw error;
    res.status(201).json({
      message: d.preferred_lang === 'ta'
        ? 'நன்றி! உங்கள் தன்னார்வலர் விண்ணப்பம் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.'
        : 'Thank you for volunteering. Our trust coordinator will contact you soon.'
    });
  } catch (err) {
    next(err);
  }
});
