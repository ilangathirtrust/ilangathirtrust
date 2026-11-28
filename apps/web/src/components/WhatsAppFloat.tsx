'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';

export function WhatsAppFloat({ socialLinks }: { socialLinks: SocialLinkItem[] }) {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timerId: number | null = null;

    const onScroll = () => {
      // Smoothly slide away while user is scrolling
      setVisible(false);
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      // Smoothly slide back in 1.5s after scrolling stops
      timerId = window.setTimeout(() => {
        setVisible(true);
      }, 1500);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);

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
      className={`print:hidden fixed bottom-[74px] right-3.5 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-[#20bd5a] active:scale-95 lg:bottom-6 lg:right-6 lg:h-14 lg:w-14 ${
        visible
          ? 'translate-x-0 scale-100 opacity-100 pointer-events-auto'
          : 'translate-x-24 scale-90 opacity-0 pointer-events-none'
      }`}
    >
      {/* Official WhatsApp Messenger Emblem SVG */}
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 lg:h-8 lg:w-8"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.04 4C9.42 4 4.04 9.38 4.04 16c0 2.12.56 4.19 1.62 6.01L4 28l6.16-1.61A11.95 11.95 0 0 0 16.04 28C22.66 28 28.04 22.62 28.04 16S22.66 4 16.04 4Zm0 21.81c-1.84 0-3.65-.5-5.22-1.44l-.37-.22-3.66.96.98-3.57-.24-.39a9.77 9.77 0 0 1-1.5-5.15c0-5.41 4.4-9.81 9.81-9.81s9.81 4.4 9.81 9.81-4.4 9.81-9.61 9.81Zm5.38-7.35c-.3-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.74-.71 1.98-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
