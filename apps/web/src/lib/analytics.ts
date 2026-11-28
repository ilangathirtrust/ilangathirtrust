'use client';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | unknown[]>;
    gtag?: (...args: unknown[]) => void;
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5RTP6V5V';
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || GTM_ID;

let lastTrackedPath = '';

export function trackPageView(url: string) {
  if (!GTM_ID || typeof window === 'undefined') return;
  if (lastTrackedPath === url) return;
  lastTrackedPath = url;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_path: url,
    page_title: document.title
  });
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: url,
      page_title: document.title
    });
  }
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!GTM_ID || typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}
