'use client';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | unknown[]>;
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA4_ID = (process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-VNPQW61EYH').trim();

let lastTrackedUrl = '';

function ensureGtagQueue() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments as unknown as unknown[]);
    };
  }
}

export function trackPageView(url: string) {
  if (!GA4_ID || typeof window === 'undefined') return;
  if (lastTrackedUrl === url) return;
  lastTrackedUrl = url;
  ensureGtagQueue();
  window.gtag?.('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
    send_to: GA4_ID
  });
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!GA4_ID || typeof window === 'undefined') return;
  ensureGtagQueue();
  window.gtag?.('event', eventName, {
    ...params,
    send_to: GA4_ID
  });
}
