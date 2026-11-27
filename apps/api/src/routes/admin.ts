import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { DEFAULT_DONATION_CONFIG } from '@ilangathir/shared';
import { env } from '../config/env.js';
import { getPublicStorageUrl, getSupabaseAdmin } from '../config/supabase.js';
import { requireAdminAuth, requireRole } from '../middleware/auth.js';
import { adminApiLimiter } from '../middleware/rateLimit.js';
import { recordAuditLog, saveContentVersion } from '../services/audit.js';
import { apiCache } from '../services/cache.js';
import { parseDeviceMetadata, recordSecurityEvent } from '../services/device.js';

export const adminRouter = Router();

adminRouter.use(adminApiLimiter, requireAdminAuth);

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm']);
const ALLOWED_DOC_MIME = new Set(['application/pdf']);
const ALLOWED_BUCKETS = new Set(['media', 'gallery', 'events', 'blogs', 'documents']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(env.MAX_UPLOAD_IMAGE_MB, env.MAX_UPLOAD_VIDEO_MB) * 1024 * 1024,
    files: 20
  },
  fileFilter: (_req, file, cb) => {
    if (
      ALLOWED_IMAGE_MIME.has(file.mimetype) ||
      ALLOWED_VIDEO_MIME.has(file.mimetype) ||
      ALLOWED_DOC_MIME.has(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, AVIF, SVG, MP4, WEBM, PDF.'));
    }
  }
});

function invalidatePublic() {
  apiCache.invalidatePrefix('public:');
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

adminRouter.get('/me', (req, res) => {
  res.json({ admin: req.admin });
});

adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const [summaryRes, donationsRes, eventsRes, blogsRes, activityRes, donationCfgRes] = await Promise.all([
      supabase.rpc('get_admin_dashboard_summary'),
      supabase
        .from('donations')
        .select('id, receipt_number, donor_name, donor_email, amount_paise, purpose, status, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('events')
        .select('id, slug, title_en, event_date, status, location_en')
        .order('event_date', { ascending: false })
        .limit(5),
      supabase
        .from('blog_posts')
        .select('id, slug, title_en, status, published_at, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('audit_logs')
        .select('id, actor_email, action, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('site_settings')
        .select('json_value')
        .eq('key', 'donation_config')
        .maybeSingle()
    ]);

    if (summaryRes.error) throw summaryRes.error;
    const donationJson = donationCfgRes.data?.json_value as Record<string, unknown> | null | undefined;

    res.json({
      stats: summaryRes.data,
      donationsEnabled: donationJson?.enabled !== false,
      recentDonations: donationsRes.data || [],
      recentEvents: eventsRes.data || [],
      recentBlogs: blogsRes.data || [],
      recentActivities: activityRes.data || []
    });
  } catch (err) {
    next(err);
  }
});

// ======================== SITE SETTINGS & NAVIGATION ========================
adminRouter.get('/settings', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/settings', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      res.status(400).json({ error: 'Provide settings items array.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: before } = await supabase.from('site_settings').select('key, value_en, value_ta, json_value');

    await saveContentVersion({
      entityType: 'site_settings',
      entityId: 'global',
      snapshot: { settings: before || [] },
      changeNote: req.body.change_note || 'Site settings updated',
      changedBy: req.admin?.id,
      changedByEmail: req.admin?.email
    });

    const rows = items.map((item: Record<string, unknown>) => ({
      key: String(item.key),
      category: String(item.category || 'general'),
      value_en: String(item.value_en ?? ''),
      value_ta: String(item.value_ta ?? ''),
      json_value: item.json_value ?? null,
      is_public: item.is_public !== false,
      updated_by: req.admin?.id ?? null
    }));

    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'update',
      entityType: 'site_settings',
      entityId: 'global',
      details: { keys: rows.map((r: { key: string }) => r.key) },
      req
    });

    invalidatePublic();
    res.json({ message: 'Site settings saved successfully.' });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/navigation', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation_items')
      .select('*')
      .order('menu_location', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/navigation', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation_items')
      .insert({
        menu_location: req.body.menu_location,
        label_en: req.body.label_en,
        label_ta: req.body.label_ta,
        href: req.body.href,
        icon_name: req.body.icon_name || 'Circle',
        sort_order: Number(req.body.sort_order || 0),
        is_visible: req.body.is_visible !== false,
        open_in_new_tab: Boolean(req.body.open_in_new_tab)
      })
      .select()
      .single();
    if (error) throw error;
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/navigation/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation_items')
      .update({
        menu_location: req.body.menu_location,
        label_en: req.body.label_en,
        label_ta: req.body.label_ta,
        href: req.body.href,
        icon_name: req.body.icon_name || 'Circle',
        sort_order: Number(req.body.sort_order || 0),
        is_visible: req.body.is_visible !== false,
        open_in_new_tab: Boolean(req.body.open_in_new_tab)
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/navigation/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('navigation_items').delete().eq('id', req.params.id);
    if (error) throw error;
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== PAGE CONTENTS & SEO ========================
adminRouter.get('/pages', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('page_contents').select('*').order('slug');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/pages/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('page_contents').select('*').eq('slug', slug).maybeSingle();
    if (existing) {
      await saveContentVersion({
        entityType: 'page_contents',
        entityId: slug,
        snapshot: existing,
        changeNote: req.body.change_note || `Updated page ${slug}`,
        changedBy: req.admin?.id,
        changedByEmail: req.admin?.email
      });
    }

    const payload = { ...req.body, slug, updated_by: req.admin?.id ?? null };
    delete payload.change_note;
    const { data, error } = await supabase
      .from('page_contents')
      .upsert(payload, { onConflict: 'slug' })
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'update',
      entityType: 'page_contents',
      entityId: slug,
      req
    });
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ======================== ACTIVITIES, TEAM, MARQUEE ========================
adminRouter.get('/activities', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/activities', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const slug = req.body.slug ? slugify(req.body.slug) : `${slugify(req.body.title_en || 'activity')}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...req.body,
        slug,
        created_by: req.admin?.id ?? null,
        updated_by: req.admin?.id ?? null
      })
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'create', entityType: 'activities', entityId: data.id, req });
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/activities/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('activities').select('*').eq('id', req.params.id).maybeSingle();
    if (existing) {
      await saveContentVersion({
        entityType: 'activities',
        entityId: String(req.params.id),
        snapshot: existing,
        changedBy: req.admin?.id,
        changedByEmail: req.admin?.email
      });
    }
    const { data, error } = await supabase
      .from('activities')
      .update({ ...req.body, updated_by: req.admin?.id ?? null })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'update', entityType: 'activities', entityId: req.params.id, req });
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/activities/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('activities').delete().eq('id', req.params.id);
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'delete', entityType: 'activities', entityId: req.params.id, req });
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/team', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('team_members').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/team', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('team_members').insert(req.body).select().single();
    if (error) throw error;
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/team/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('team_members').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/team/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('team_members').delete().eq('id', req.params.id);
    if (error) throw error;
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/marquee', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('marquee_items').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/marquee', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('marquee_items').insert(req.body).select().single();
    if (error) throw error;
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/marquee/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('marquee_items').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/marquee/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('marquee_items').delete().eq('id', req.params.id);
    if (error) throw error;
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== EVENTS ========================
adminRouter.get('/events', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('events')
      .select('*, gallery_folders(id, slug, title_en)')
      .order('event_date', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/events', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const slug = req.body.slug ? slugify(req.body.slug) : `${slugify(req.body.title_en || 'event')}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...req.body,
        slug,
        gallery_folder_id: req.body.gallery_folder_id || null,
        created_by: req.admin?.id ?? null,
        updated_by: req.admin?.id ?? null
      })
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'create', entityType: 'events', entityId: data.id, req });
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/events/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('events').select('*').eq('id', req.params.id).maybeSingle();
    if (existing) {
      await saveContentVersion({
        entityType: 'events',
        entityId: String(req.params.id),
        snapshot: existing,
        changedBy: req.admin?.id,
        changedByEmail: req.admin?.email
      });
    }
    const { data, error } = await supabase
      .from('events')
      .update({
        ...req.body,
        gallery_folder_id: req.body.gallery_folder_id || null,
        updated_by: req.admin?.id ?? null
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'update', entityType: 'events', entityId: req.params.id, req });
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/events/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('events').delete().eq('id', req.params.id);
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'delete', entityType: 'events', entityId: req.params.id, req });
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== GALLERY FOLDERS & ITEMS ========================
adminRouter.get('/gallery/folders', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('gallery_folders')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('event_date', { ascending: false, nullsFirst: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/gallery/folders', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const slug = req.body.slug ? slugify(req.body.slug) : `${slugify(req.body.title_en || 'folder')}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('gallery_folders')
      .insert({ ...req.body, slug, created_by: req.admin?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'create', entityType: 'gallery_folders', entityId: data.id, req });
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/gallery/folders/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('gallery_folders')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/gallery/folders/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('gallery_folders').delete().eq('id', req.params.id);
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'delete', entityType: 'gallery_folders', entityId: req.params.id, req });
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/gallery/folders/:folderId/items', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('folder_id', req.params.folderId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/gallery/items', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const items = Array.isArray(req.body?.items) ? req.body.items : [req.body];
    const { data, error } = await supabase.from('gallery_items').insert(items).select();
    if (error) throw error;
    invalidatePublic();
    res.status(201).json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/gallery/items/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('gallery_items').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/gallery/items/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('gallery_items').delete().eq('id', req.params.id);
    if (error) throw error;
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== BLOGS & CATEGORIES ========================
adminRouter.get('/blog-categories', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/blog-categories', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.name_en || 'category');
    const { data, error } = await supabase.from('blog_categories').insert({ ...req.body, slug }).select().single();
    if (error) throw error;
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/blogs', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_categories(slug, name_en, name_ta)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/blogs', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const slug = req.body.slug ? slugify(req.body.slug) : `${slugify(req.body.title_en || 'article')}-${Date.now().toString(36)}`;
    const publishedAt = req.body.status === 'published' ? (req.body.published_at || new Date().toISOString()) : req.body.published_at || null;
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...req.body,
        slug,
        category_id: req.body.category_id || null,
        published_at: publishedAt,
        created_by: req.admin?.id ?? null,
        updated_by: req.admin?.id ?? null
      })
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'create', entityType: 'blog_posts', entityId: data.id, req });
    invalidatePublic();
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/blogs/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('blog_posts').select('*').eq('id', req.params.id).maybeSingle();
    if (existing) {
      await saveContentVersion({
        entityType: 'blog_posts',
        entityId: String(req.params.id),
        snapshot: existing,
        changeNote: req.body.change_note || 'Blog updated',
        changedBy: req.admin?.id,
        changedByEmail: req.admin?.email
      });
    }

    const payload = { ...req.body, category_id: req.body.category_id || null, updated_by: req.admin?.id ?? null };
    delete payload.change_note;
    if (payload.status === 'published' && !payload.published_at && !existing?.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'update', entityType: 'blog_posts', entityId: req.params.id, req });
    invalidatePublic();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/blogs/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('blog_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    await recordAuditLog({ actorId: req.admin?.id, actorEmail: req.admin?.email, action: 'delete', entityType: 'blog_posts', entityId: req.params.id, req });
    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== MEDIA LIBRARY (SUPABASE STORAGE) ========================
adminRouter.get('/media', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const folder = typeof req.query.folder === 'string' ? req.query.folder.trim() : '';
    const mediaType = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(200);
    if (folder) query = query.eq('folder_name', folder);
    if (mediaType) query = query.eq('media_type', mediaType);
    if (search) {
      const clean = search.replace(/[%_]/g, '');
      query = query.or(`file_name.ilike.%${clean}%,title_en.ilike.%${clean}%,alt_text_en.ilike.%${clean}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/media/signed-upload', async (req, res, next) => {
  try {
    const fileName = String(req.body?.file_name || '').trim();
    const mimeType = String(req.body?.mime_type || '').trim();
    const fileSize = Number(req.body?.file_size_bytes || 0);
    const bucket = ALLOWED_BUCKETS.has(String(req.body?.bucket)) ? String(req.body.bucket) : 'media';
    const folderName = slugify(String(req.body?.folder_name || 'general'));

    if (!fileName || !mimeType) {
      res.status(400).json({ error: 'file_name and mime_type are required.' });
      return;
    }

    const isImage = ALLOWED_IMAGE_MIME.has(mimeType);
    const isVideo = ALLOWED_VIDEO_MIME.has(mimeType);
    const isDoc = ALLOWED_DOC_MIME.has(mimeType);
    if (!isImage && !isVideo && !isDoc) {
      res.status(400).json({ error: 'Unsupported file type. Allowed: JPG, PNG, WEBP, AVIF, SVG, MP4, WEBM, PDF.' });
      return;
    }

    const maxBytes = (isVideo ? env.MAX_UPLOAD_VIDEO_MB : env.MAX_UPLOAD_IMAGE_MB) * 1024 * 1024;
    if (fileSize > maxBytes) {
      res.status(400).json({
        error: `File "${fileName}" exceeds ${isVideo ? env.MAX_UPLOAD_VIDEO_MB : env.MAX_UPLOAD_IMAGE_MB}MB limit.`
      });
      return;
    }

    const ext = path.extname(fileName).toLowerCase() || (isVideo ? '.mp4' : isDoc ? '.pdf' : '.jpg');
    const base = slugify(path.basename(fileName, ext));
    const storagePath = `${folderName}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}${ext}`;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath);
    if (error || !data) throw error || new Error('Failed to create signed upload URL.');

    res.json({
      bucket,
      folder_name: folderName,
      storage_path: storagePath,
      signed_url: data.signedUrl,
      token: data.token,
      public_url: bucket === 'documents' ? storagePath : getPublicStorageUrl(bucket, storagePath),
      media_type: isVideo ? 'video' : isDoc ? 'document' : 'image'
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/media/confirm-upload', async (req, res, next) => {
  try {
    const bucket = ALLOWED_BUCKETS.has(String(req.body?.bucket)) ? String(req.body.bucket) : 'media';
    const storagePath = String(req.body?.storage_path || '').trim();
    const folderName = slugify(String(req.body?.folder_name || 'general'));
    const category = String(req.body?.category || 'General');
    const fileName = String(req.body?.file_name || path.basename(storagePath));
    const mimeType = String(req.body?.mime_type || 'application/octet-stream');
    const fileSize = Number(req.body?.file_size_bytes || 0);
    const mediaType = ['image', 'video', 'document'].includes(String(req.body?.media_type))
      ? String(req.body.media_type)
      : 'image';

    if (!storagePath) {
      res.status(400).json({ error: 'storage_path is required.' });
      return;
    }

    const publicUrl = bucket === 'documents' ? storagePath : getPublicStorageUrl(bucket, storagePath);
    const base = path.basename(fileName, path.extname(fileName));

    const supabase = getSupabaseAdmin();
    const { data: asset, error } = await supabase
      .from('media_assets')
      .insert({
        bucket,
        storage_path: storagePath,
        public_url: publicUrl,
        folder_name: folderName,
        category,
        media_type: mediaType,
        file_name: fileName,
        mime_type: mimeType,
        file_size_bytes: fileSize,
        title_en: String(req.body?.title_en || base),
        title_ta: String(req.body?.title_ta || ''),
        alt_text_en: String(req.body?.alt_text_en || base),
        alt_text_ta: String(req.body?.alt_text_ta || ''),
        description_en: String(req.body?.description_en || ''),
        description_ta: String(req.body?.description_ta || ''),
        uploaded_by: req.admin?.id ?? null
      })
      .select()
      .single();

    if (error) throw error;

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'upload_media',
      entityType: 'media_assets',
      entityId: String(asset.id),
      details: { bucket, folderName, storagePath },
      req
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/media/upload', upload.array('files', 20), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      res.status(400).json({ error: 'Select at least one image, video, or PDF file to upload.' });
      return;
    }

    const bucket = ALLOWED_BUCKETS.has(String(req.body.bucket)) ? String(req.body.bucket) : 'media';
    const folderName = slugify(String(req.body.folder_name || 'general'));
    const category = String(req.body.category || 'General');
    const supabase = getSupabaseAdmin();

    const uploadedRecords = [];
    for (const file of files) {
      const isVideo = ALLOWED_VIDEO_MIME.has(file.mimetype);
      const isDoc = ALLOWED_DOC_MIME.has(file.mimetype);
      const mediaType = isVideo ? 'video' : isDoc ? 'document' : 'image';

      if (!isVideo && file.size > env.MAX_UPLOAD_IMAGE_MB * 1024 * 1024) {
        throw Object.assign(new Error(`File "${file.originalname}" exceeds ${env.MAX_UPLOAD_IMAGE_MB}MB limit.`), { status: 400 });
      }

      const ext = path.extname(file.originalname).toLowerCase() || (isVideo ? '.mp4' : '.jpg');
      const base = slugify(path.basename(file.originalname, ext));
      const storagePath = `${folderName}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadErr) throw uploadErr;

      const publicUrl = bucket === 'documents' ? storagePath : getPublicStorageUrl(bucket, storagePath);

      const { data: asset, error: dbErr } = await supabase
        .from('media_assets')
        .insert({
          bucket,
          storage_path: storagePath,
          public_url: publicUrl,
          folder_name: folderName,
          category,
          media_type: mediaType,
          file_name: file.originalname,
          mime_type: file.mimetype,
          file_size_bytes: file.size,
          title_en: String(req.body.title_en || base),
          title_ta: String(req.body.title_ta || ''),
          alt_text_en: String(req.body.alt_text_en || base),
          alt_text_ta: String(req.body.alt_text_ta || ''),
          description_en: String(req.body.description_en || ''),
          description_ta: String(req.body.description_ta || ''),
          uploaded_by: req.admin?.id ?? null
        })
        .select()
        .single();

      if (dbErr) throw dbErr;
      uploadedRecords.push(asset);
    }

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'upload_media',
      entityType: 'media_assets',
      details: { count: uploadedRecords.length, bucket, folderName },
      req
    });

    res.status(201).json({ items: uploadedRecords });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/media/:id', upload.single('file'), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: findErr } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }

    const updates: Record<string, unknown> = {
      folder_name: req.body.folder_name ?? existing.folder_name,
      category: req.body.category ?? existing.category,
      title_en: req.body.title_en ?? existing.title_en,
      title_ta: req.body.title_ta ?? existing.title_ta,
      alt_text_en: req.body.alt_text_en ?? existing.alt_text_en,
      alt_text_ta: req.body.alt_text_ta ?? existing.alt_text_ta,
      description_en: req.body.description_en ?? existing.description_en,
      description_ta: req.body.description_ta ?? existing.description_ta
    };

    if (req.file) {
      const { error: replaceErr } = await supabase.storage
        .from(existing.bucket)
        .upload(existing.storage_path, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '31536000',
          upsert: true
        });
      if (replaceErr) throw replaceErr;
      updates.file_name = req.file.originalname;
      updates.mime_type = req.file.mimetype;
      updates.file_size_bytes = req.file.size;
    }

    const { data: updated, error: updErr } = await supabase
      .from('media_assets')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (updErr) throw updErr;

    invalidatePublic();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/media/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('media_assets').select('*').eq('id', req.params.id).maybeSingle();
    if (!existing) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }

    await supabase.storage.from(existing.bucket).remove([existing.storage_path]);
    const { error } = await supabase.from('media_assets').delete().eq('id', req.params.id);
    if (error) throw error;

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'delete_media',
      entityType: 'media_assets',
      entityId: String(req.params.id),
      details: { path: existing.storage_path },
      req
    });

    invalidatePublic();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ======================== INBOX: ENQUIRIES & VOLUNTEERS ========================
adminRouter.get('/enquiries', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    let query = supabase.from('contact_enquiries').select('*').order('created_at', { ascending: false }).limit(300);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/enquiries/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('contact_enquiries')
      .update({ status: req.body.status, admin_notes: req.body.admin_notes ?? undefined })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/volunteers', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    let query = supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false }).limit(300);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/volunteers/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('volunteer_applications')
      .update({ status: req.body.status, admin_notes: req.body.admin_notes ?? undefined })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ======================== DONATIONS MANAGEMENT ========================
adminRouter.get('/donations', requireRole(['super_admin', 'admin']), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : '';
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let query = supabase
      .from('donations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
    if (search) {
      const clean = search.replace(/[%_]/g, '');
      query = query.or(`donor_name.ilike.%${clean}%,donor_email.ilike.%${clean}%,receipt_number.ilike.%${clean}%,razorpay_order_id.ilike.%${clean}%`);
    }

    const [listRes, summaryRes, cfgRes] = await Promise.all([
      query,
      supabase.rpc('get_admin_dashboard_summary'),
      supabase.from('site_settings').select('json_value').eq('key', 'donation_config').maybeSingle()
    ]);

    if (listRes.error) throw listRes.error;
    const total = listRes.count || 0;
    const cfgJson = cfgRes.data?.json_value as Record<string, unknown> | null | undefined;
    res.json({
      items: listRes.data || [],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary: summaryRes.data || {},
      donationsEnabled: cfgJson?.enabled !== false
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/donations/toggle', requireRole(['super_admin', 'admin']), async (req, res, next) => {
  try {
    if (typeof req.body?.enabled !== 'boolean') {
      res.status(400).json({ error: 'Provide boolean "enabled" field.' });
      return;
    }

    const enabled = req.body.enabled;
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('site_settings')
      .select('json_value')
      .eq('key', 'donation_config')
      .maybeSingle();

    const prevJson =
      existing?.json_value && typeof existing.json_value === 'object'
        ? (existing.json_value as Record<string, unknown>)
        : { ...DEFAULT_DONATION_CONFIG };

    const nextJson = { ...DEFAULT_DONATION_CONFIG, ...prevJson, enabled };

    const { error } = await supabase.from('site_settings').upsert(
      {
        key: 'donation_config',
        category: 'donations',
        value_en: '',
        value_ta: '',
        json_value: nextJson,
        is_public: true,
        updated_by: req.admin?.id ?? null
      },
      { onConflict: 'key' }
    );
    if (error) throw error;

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: enabled ? 'enable_donations' : 'disable_donations',
      entityType: 'site_settings',
      entityId: 'donation_config',
      details: { enabled },
      req
    });

    invalidatePublic();
    res.json({ enabled, config: nextJson });
  } catch (err) {
    next(err);
  }
});

// ======================== CONTENT VERSIONS & RESTORE ========================
adminRouter.get('/versions/:entityType/:entityId', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('entity_type', req.params.entityType)
      .eq('entity_id', req.params.entityId)
      .order('version_number', { ascending: false })
      .limit(25);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/versions/:versionId/restore', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: version, error: verErr } = await supabase
      .from('content_versions')
      .select('*')
      .eq('id', req.params.versionId)
      .maybeSingle();

    if (verErr) throw verErr;
    if (!version) {
      res.status(404).json({ error: 'Version record not found.' });
      return;
    }

    const snapshot = version.snapshot as Record<string, unknown>;
    if (version.entity_type === 'site_settings' && Array.isArray(snapshot.settings)) {
      const { error } = await supabase.from('site_settings').upsert(snapshot.settings, { onConflict: 'key' });
      if (error) throw error;
    } else if (version.entity_type === 'page_contents') {
      const { error } = await supabase.from('page_contents').upsert(snapshot, { onConflict: 'slug' });
      if (error) throw error;
    } else if (['activities', 'events', 'blog_posts'].includes(version.entity_type)) {
      const { error } = await supabase.from(version.entity_type).update(snapshot).eq('id', version.entity_id);
      if (error) throw error;
    } else {
      res.status(400).json({ error: 'Unsupported version entity type.' });
      return;
    }

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'restore_version',
      entityType: version.entity_type,
      entityId: version.entity_id,
      details: { version_number: version.version_number },
      req
    });

    invalidatePublic();
    res.json({ restored: true, version_number: version.version_number });
  } catch (err) {
    next(err);
  }
});

// ======================== AUDIT LOGS & ADMIN USERS ========================
adminRouter.get('/audit-logs', async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users', requireRole(['super_admin', 'admin']), async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id', requireRole(['super_admin']), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        role: req.body.role,
        is_active: req.body.is_active
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'update_admin_role',
      entityType: 'admin_users',
      entityId: String(req.params.id),
      details: { role: req.body.role, is_active: req.body.is_active },
      req
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ======================== SECURITY, SESSIONS & DEVICES ========================
adminRouter.get('/security/overview', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.admin!.id;
    const currentDevice = parseDeviceMetadata(req);

    const [sessionsRes, eventsRes] = await Promise.all([
      supabase
        .from('admin_sessions')
        .select('id, device_id, device_name, device_type, browser, os, ip_address, geo_label, is_trusted, is_revoked, revoked_at, revoked_reason, last_active_at, created_at, expires_at')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })
        .limit(25),
      supabase
        .from('security_events')
        .select('id, event_type, severity, device_name, ip_address, geo_label, details, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    const migrationRequired =
      sessionsRes.error?.code === '42P01' ||
      sessionsRes.error?.code === 'PGRST205' ||
      eventsRes.error?.code === '42P01' ||
      eventsRes.error?.code === 'PGRST205';

    res.json({
      migrationRequired: Boolean(migrationRequired),
      currentSessionId: req.admin?.sessionId || null,
      currentDevice,
      sessions: sessionsRes.error ? [] : sessionsRes.data || [],
      events: eventsRes.error ? [] : eventsRes.data || []
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/security/sessions/:id/trust', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const trusted = Boolean(req.body?.is_trusted);
    const { data, error } = await supabase
      .from('admin_sessions')
      .update({ is_trusted: trusted })
      .eq('id', req.params.id)
      .eq('user_id', req.admin!.id)
      .select()
      .single();
    if (error) throw error;

    await recordSecurityEvent({
      userId: req.admin!.id,
      email: req.admin!.email,
      eventType: trusted ? 'device_trusted' : 'device_untrusted',
      severity: 'info',
      device: parseDeviceMetadata(req),
      details: { target_session_id: req.params.id, device_name: data.device_name }
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/security/sessions/revoke-others', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentDeviceId = req.admin?.deviceId || parseDeviceMetadata(req).deviceId;

    const { error } = await supabase
      .from('admin_sessions')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'Signed out from all other devices by account owner.'
      })
      .eq('user_id', req.admin!.id)
      .neq('device_id', currentDeviceId)
      .eq('is_revoked', false);

    if (error) throw error;

    await recordSecurityEvent({
      userId: req.admin!.id,
      email: req.admin!.email,
      eventType: 'revoke_all_other_sessions',
      severity: 'warning',
      device: parseDeviceMetadata(req)
    });

    await recordAuditLog({
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: 'revoke_other_sessions',
      entityType: 'admin_sessions',
      entityId: req.admin?.id,
      req
    });

    res.json({ revoked: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/security/sessions/:id', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    if (req.admin?.sessionId && req.params.id === req.admin.sessionId) {
      res.status(400).json({ error: 'Use Sign Out to end your current session.' });
      return;
    }

    const { data, error } = await supabase
      .from('admin_sessions')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'Signed out remotely from Security & Devices.'
      })
      .eq('id', req.params.id)
      .eq('user_id', req.admin!.id)
      .select('id, device_name')
      .single();

    if (error) throw error;

    await recordSecurityEvent({
      userId: req.admin!.id,
      email: req.admin!.email,
      eventType: 'session_revoked',
      severity: 'warning',
      device: parseDeviceMetadata(req),
      details: { target_session_id: data.id, device_name: data.device_name }
    });

    res.json({ revoked: true, id: data.id });
  } catch (err) {
    next(err);
  }
});

const ALLOWED_CLIENT_SECURITY_EVENTS = new Set(['mfa_enrolled', 'mfa_removed', 'password_changed']);

adminRouter.post('/security/events/record', async (req, res) => {
  const rawType = String(req.body?.event_type || '').slice(0, 64);
  if (!ALLOWED_CLIENT_SECURITY_EVENTS.has(rawType)) {
    res.status(400).json({ error: 'Unsupported security event type.' });
    return;
  }
  await recordSecurityEvent({
    userId: req.admin!.id,
    email: req.admin!.email,
    eventType: rawType,
    severity: req.body?.severity === 'warning' || req.body?.severity === 'critical' ? req.body.severity : 'info',
    device: parseDeviceMetadata(req),
    details: typeof req.body?.details === 'object' && req.body.details ? req.body.details : {}
  });
  res.json({ recorded: true });
});
