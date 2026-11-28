import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { MarqueeItem, NavigationItem } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { NavigationSkeleton } from '../components/PageSkeletons';

export function NavigationMarqueePage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { tr } = useAdminUi();
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
      onNotify(tr('Navigation link added.', 'மெனு லிங்க் சேர்த்தாச்சுங்க.'));
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to add link.', 'லிங்க் சேர்க்க முடியலைங்க.'), true);
    }
  }

  async function deleteNav(id: string) {
    if (!confirm(tr('Remove this navigation link?', 'இந்த மெனு லிங்க்கை நீக்கலாமா?'))) return;
    await adminApi(`/navigation/${id}`, { method: 'DELETE' });
    load();
  }

  async function addMarquee(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi('/marquee', { method: 'POST', body: JSON.stringify(newMarquee) });
      setNewMarquee({ title_en: '', title_ta: '', alt_text_en: '', alt_text_ta: '', image_url: '', link_url: '/gallery', sort_order: 1 });
      onNotify(tr('Marquee item added to homepage.', 'முகப்பு மார்க்யூ படம் சேர்த்தாச்சுங்க.'));
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to add marquee item.', 'மார்க்யூ சேர்க்க முடியலைங்க.'), true);
    }
  }

  async function deleteMarquee(id: string) {
    if (!confirm(tr('Delete this marquee highlight?', 'இந்த மார்க்யூ படத்தை நீக்கலாமா?'))) return;
    await adminApi(`/marquee/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading && navItems.length === 0 && marqueeItems.length === 0) {
    return <NavigationSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Homepage Marquee Showcase */}
      <div className="admin-card space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {tr('Homepage Activity Marquee Images', 'முகப்பு மார்க்யூ படங்கள்')}
          </h2>
          <p className="text-xs text-slate-500">
            {tr('Images here scroll smoothly in the homepage highlight marquee.', 'இங்க சேர்க்குற படங்கள் வெப்சைட் முகப்பு பக்கத்துல ஓடிக்கிட்டே இருக்கும்.')}
          </p>
        </div>

        <form onSubmit={addMarquee} className="admin-subcard grid gap-3 sm:grid-cols-3">
          <label className="admin-label">
            <span>{tr('Title (EN) *', 'தலைப்பு (ஆங்கிலம்) *')}</span>
            <input required placeholder={tr('Title (EN)', 'தலைப்பு (ஆங்கிலம்)')} value={newMarquee.title_en} onChange={(e) => setNewMarquee({ ...newMarquee, title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Title (TA) *', 'தலைப்பு (தமிழ்) *')}</span>
            <input required placeholder={tr('Title (TA)', 'தலைப்பு (தமிழ்)')} value={newMarquee.title_ta} onChange={(e) => setNewMarquee({ ...newMarquee, title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Image URL *', 'படத்தின் லிங்க் *')}</span>
            <div className="flex gap-2">
              <input required placeholder={tr('Image URL', 'படம் லிங்க்')} value={newMarquee.image_url} onChange={(e) => setNewMarquee({ ...newMarquee, image_url: e.target.value })} className="admin-input flex-1" />
              <button type="button" onClick={() => setPickerOpen(true)} className="admin-btn-secondary px-3">
                <ImageIcon className="h-4 w-4 text-blue-600" />
              </button>
            </div>
          </label>
          <label className="admin-label">
            <span>{tr('Alt Text (EN)', 'ஆல்ட் டெக்ஸ்ட்')}</span>
            <input placeholder={tr('Alt Text (EN)', 'சிறிய குறிப்பு')} value={newMarquee.alt_text_en} onChange={(e) => setNewMarquee({ ...newMarquee, alt_text_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Link URL', 'கிளிக் பண்ணா போக வேண்டிய பக்கம்')}</span>
            <input placeholder="/gallery" value={newMarquee.link_url} onChange={(e) => setNewMarquee({ ...newMarquee, link_url: e.target.value })} className="admin-input" />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newMarquee.title_en.trim() || !newMarquee.title_ta.trim() || !newMarquee.image_url.trim()}
              className="admin-btn-primary w-full py-2.5"
            >
              <Plus className="h-4 w-4" />
              <span>{tr('Add Marquee Slide', 'மார்க்யூ சேர்')}</span>
            </button>
          </div>
        </form>

        {marqueeItems.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            {tr('No marquee slides added yet.', 'இன்னும் எந்த மார்க்யூ படமும் சேர்க்கலீங்க.')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {marqueeItems.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={m.image_url} alt={m.title_en} className="h-28 w-full object-cover" />
                <div className="flex items-center justify-between p-2.5 text-xs">
                  <span className="truncate font-bold text-slate-800">{m.title_en}</span>
                  <button type="button" onClick={() => deleteMarquee(m.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Menus */}
      <div className="admin-card space-y-4">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {tr('Navigation Menu Manager', 'மெனு லிங்க் மேலாண்மை')}
        </h2>

        <form onSubmit={addNav} className="admin-subcard grid gap-2.5 sm:grid-cols-6">
          <select value={newNav.menu_location} onChange={(e) => setNewNav({ ...newNav, menu_location: e.target.value })} className="admin-input">
            <option value="header">{tr('Header', 'மேல் மெனு')}</option>
            <option value="mobile_bottom">{tr('Mobile Bottom', 'மொபைல் கீழ்')}</option>
            <option value="footer_explore">{tr('Footer Explore', 'கீழ் பகுதி')}</option>
          </select>
          <input required placeholder={tr('Label (EN)', 'பெயர் (ஆங்கிலம்)')} value={newNav.label_en} onChange={(e) => setNewNav({ ...newNav, label_en: e.target.value })} className="admin-input" />
          <input required placeholder={tr('Label (TA)', 'பெயர் (தமிழ்)')} value={newNav.label_ta} onChange={(e) => setNewNav({ ...newNav, label_ta: e.target.value })} className="admin-input" />
          <input required placeholder={tr('Href (/about)', 'லிங்க் (/about)')} value={newNav.href} onChange={(e) => setNewNav({ ...newNav, href: e.target.value })} className="admin-input" />
          <input type="number" placeholder={tr('Order', 'வரிசை')} value={newNav.sort_order} onChange={(e) => setNewNav({ ...newNav, sort_order: Number(e.target.value) })} className="admin-input" />
          <button
            type="submit"
            disabled={!newNav.label_en.trim() || !newNav.label_ta.trim() || !newNav.href.trim()}
            className="admin-btn-primary py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{tr('Add', 'சேர்')}</span>
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 uppercase text-slate-500">
                <th className="py-2.5 pr-4">{tr('Location', 'இடம்')}</th>
                <th className="py-2.5 pr-4">{tr('English', 'ஆங்கிலம்')}</th>
                <th className="py-2.5 pr-4">{tr('Tamil', 'தமிழ்')}</th>
                <th className="py-2.5 pr-4">{tr('Href', 'லிங்க்')}</th>
                <th className="py-2.5 pr-4">{tr('Order', 'வரிசை')}</th>
                <th className="py-2.5 text-right">{tr('Action', 'செயல்')}</th>
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
                      <Trash2 className="inline h-4 w-4" />
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
