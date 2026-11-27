import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { MarqueeItem, NavigationItem } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { MediaPickerModal } from '../components/MediaPickerModal';

export function NavigationMarqueePage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [newNav, setNewNav] = useState({
    menu_location: 'header',
    label_en: '',
    label_ta: '',
    href: '/',
    icon_name: 'Circle',
    sort_order: 10
  });

  const [newMarquee, setNewMarquee] = useState({
    title_en: '',
    title_ta: '',
    alt_text_en: '',
    alt_text_ta: '',
    image_url: '',
    link_url: '/gallery',
    sort_order: 1
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi<NavigationItem[]>('/navigation'),
      adminApi<MarqueeItem[]>('/marquee')
    ])
      .then(([n, m]) => {
        setNavItems(n);
        setMarqueeItems(m);
      })
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function addNav(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi('/navigation', { method: 'POST', body: JSON.stringify(newNav) });
      setNewNav({ menu_location: 'header', label_en: '', label_ta: '', href: '/', icon_name: 'Circle', sort_order: 10 });
      onNotify('Navigation link added.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to add link.', true);
    }
  }

  async function deleteNav(id: string) {
    if (!confirm('Remove this navigation link?')) return;
    await adminApi(`/navigation/${id}`, { method: 'DELETE' });
    load();
  }

  async function addMarquee(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi('/marquee', { method: 'POST', body: JSON.stringify(newMarquee) });
      setNewMarquee({ title_en: '', title_ta: '', alt_text_en: '', alt_text_ta: '', image_url: '', link_url: '/gallery', sort_order: 1 });
      onNotify('Marquee item added to homepage.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to add marquee item.', true);
    }
  }

  async function deleteMarquee(id: string) {
    if (!confirm('Delete this marquee highlight?')) return;
    await adminApi(`/marquee/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 admin-skeleton rounded-3xl" />
        <div className="h-48 admin-skeleton rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Homepage Marquee Showcase */}
      <div className="admin-card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-900">Homepage Activity Marquee Images</h2>
        <p className="text-xs text-slate-500">Images here scroll smoothly in the homepage highlight marquee.</p>

        <form onSubmit={addMarquee} className="mt-4 grid gap-3 rounded-2xl bg-sand-50 p-4 sm:grid-cols-3">
          <label className="admin-label">
            <span>Title (EN) *</span>
            <input required placeholder="Title (EN)" value={newMarquee.title_en} onChange={(e) => setNewMarquee({ ...newMarquee, title_en: e.target.value })} className="admin-input bg-white" />
          </label>
          <label className="admin-label">
            <span>Title (TA) *</span>
            <input required placeholder="Title (TA)" value={newMarquee.title_ta} onChange={(e) => setNewMarquee({ ...newMarquee, title_ta: e.target.value })} className="admin-input bg-white" />
          </label>
          <label className="admin-label">
            <span>Image URL *</span>
            <div className="flex gap-2">
              <input required placeholder="Image URL" value={newMarquee.image_url} onChange={(e) => setNewMarquee({ ...newMarquee, image_url: e.target.value })} className="admin-input flex-1 bg-white" />
              <button type="button" onClick={() => setPickerOpen(true)} className="rounded-xl border border-sand-200 bg-white px-3 text-xs font-bold text-brand-800 hover:bg-sand-100">
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>
          </label>
          <label className="admin-label">
            <span>Alt Text (EN)</span>
            <input placeholder="Alt Text (EN)" value={newMarquee.alt_text_en} onChange={(e) => setNewMarquee({ ...newMarquee, alt_text_en: e.target.value })} className="admin-input bg-white" />
          </label>
          <label className="admin-label">
            <span>Link URL</span>
            <input placeholder="/gallery" value={newMarquee.link_url} onChange={(e) => setNewMarquee({ ...newMarquee, link_url: e.target.value })} className="admin-input bg-white" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-800">
              <Plus className="h-4 w-4" />
              <span>Add Marquee Slide</span>
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {marqueeItems.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={m.image_url} alt={m.title_en} className="h-32 w-full object-cover" />
              <div className="flex items-center justify-between p-3 text-xs">
                <span className="truncate font-bold text-slate-800">{m.title_en}</span>
                <button type="button" onClick={() => deleteMarquee(m.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Menus */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Navigation Menu Manager</h2>

        <form onSubmit={addNav} className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-6">
          <select value={newNav.menu_location} onChange={(e) => setNewNav({ ...newNav, menu_location: e.target.value })} className="admin-input">
            <option value="header">Header</option>
            <option value="mobile_bottom">Mobile Bottom</option>
            <option value="footer_explore">Footer Explore</option>
          </select>
          <input required placeholder="Label (EN)" value={newNav.label_en} onChange={(e) => setNewNav({ ...newNav, label_en: e.target.value })} className="admin-input" />
          <input required placeholder="Label (TA)" value={newNav.label_ta} onChange={(e) => setNewNav({ ...newNav, label_ta: e.target.value })} className="admin-input" />
          <input required placeholder="Href (/about)" value={newNav.href} onChange={(e) => setNewNav({ ...newNav, href: e.target.value })} className="admin-input" />
          <input type="number" placeholder="Order" value={newNav.sort_order} onChange={(e) => setNewNav({ ...newNav, sort_order: Number(e.target.value) })} className="admin-input" />
          <button type="submit" className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white">
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2.5 pr-4">Location</th>
                <th className="py-2.5 pr-4">English</th>
                <th className="py-2.5 pr-4">Tamil</th>
                <th className="py-2.5 pr-4">Href</th>
                <th className="py-2.5 pr-4">Order</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {navItems.map((n) => (
                <tr key={n.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-bold">{n.menu_location}</td>
                  <td className="py-2.5 pr-4">{n.label_en}</td>
                  <td className="py-2.5 pr-4">{n.label_ta}</td>
                  <td className="py-2.5 pr-4 font-mono">{n.href}</td>
                  <td className="py-2.5 pr-4">{n.sort_order}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" onClick={() => deleteNav(n.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        bucket="media"
        folderName="marquee"
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setNewMarquee((prev) => ({ ...prev, image_url: url }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
