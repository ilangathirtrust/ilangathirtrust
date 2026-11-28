'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import type { SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';

export function WhatsAppFloat({ socialLinks }: { socialLinks: SocialLinkItem[] }) {
  const pathname = usePathname();
  const { lang } = useLanguage();

  // Hide on /donate so nothing overlaps Razorpay checkout controls
  if (pathname?.startsWith('/donate')) return null;

  const waItem = socialLinks.find(
    (item) => item.enabled && (item.platform.toLowerCase() === 'whatsapp' || item.url.includes('wa.me'))
  );
  const waHref = waItem?.url || 'https://wa.me/919363015050';

  return (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={lang === 'ta' ? 'வாட்ஸ்அப்பில் தொடர்பு கொள்ள' : 'Chat on WhatsApp'}
      title={lang === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'Chat on WhatsApp'}
      className="print:hidden fixed bottom-[72px] right-3 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(5,150,105,0.34)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95 lg:bottom-6 lg:right-6"
    >
      <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.3} />
      <span className="hidden sm:inline">{lang === 'ta' ? 'வாட்ஸ்அப்' : 'WhatsApp'}</span>
    </a>
  );
}
