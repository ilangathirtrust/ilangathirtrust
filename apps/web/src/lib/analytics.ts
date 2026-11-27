'use client';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | unknown[]>;
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';

let lastTrackedPath = '';

export function trackPageView(url: string) {
  if (!GA4_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  if (lastTrackedPath === url) return;
  lastTrackedPath = url;
  window.gtag('event', 'page_view', {
    page_path: url,
    page_title: document.title
  });
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!GA4_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}
