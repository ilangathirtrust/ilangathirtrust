'use client';

import type { Language } from '@ilangathir/shared';

function extractFirstIssue(issues: unknown): string | null {
  if (!issues || typeof issues !== 'object') return null;
  for (const val of Object.values(issues as Record<string, unknown>)) {
    if (Array.isArray(val) && typeof val[0] === 'string' && val[0]) {
      return val[0];
    }
  }
  return null;
}

function localizedStatusMessage(status: number, lang: Language): string {
  const ta = lang === 'ta';
  switch (status) {
    case 400:
      return ta
        ? 'உள்ளிட்ட விவரங்களை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
        : 'Please review the entered details and try again.';
    case 403:
      return ta
        ? 'இந்தச் செயலுக்கு அனுமதி இல்லை.'
        : 'Access denied for this request.';
    case 404:
      return ta
        ? 'கோரப்பட்ட தகவல் கிடைக்கவில்லை.'
        : 'The requested information could not be found.';
    case 429:
      return ta
        ? 'அதிக முயற்சிகள் செய்யப்பட்டுள்ளன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Too many attempts. Please wait a moment and try again.';
    case 503:
      return ta
        ? 'சேவை தற்காலிகமாக தயாராக இல்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.'
        : 'This service is temporarily unavailable. Please try again shortly.';
    default:
      return ta
        ? 'சேவையகத்தில் பிழை ஏற்பட்டது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Server error occurred. Please try again in a moment.';
  }
}

export async function readApiResponse<T = Record<string, unknown>>(
  res: Response,
  lang: Language,
  fallbackEn: string,
  fallbackTa: string
): Promise<T> {
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    const serverMsg = typeof json.error === 'string' && json.error.trim() ? json.error.trim() : '';
    const fieldMsg = extractFirstIssue(json.issues);
    const message =
      serverMsg && fieldMsg && !serverMsg.includes(fieldMsg)
        ? `${serverMsg} (${fieldMsg})`
        : serverMsg || fieldMsg || localizedStatusMessage(res.status, lang) || (lang === 'ta' ? fallbackTa : fallbackEn);
    throw new Error(message);
  }

  return json as T;
}

export function formatClientError(
  err: unknown,
  lang: Language,
  fallbackEn: string,
  fallbackTa: string
): string {
  const ta = lang === 'ta';
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return ta
      ? 'இணைய இணைப்பு அல்லது சேவையகத் தொடர்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
      : 'Unable to reach our server. Please check your internet connection and try again.';
  }
  if (err instanceof Error && err.message.trim()) {
    if (/Unexpected token|JSON/i.test(err.message)) {
      return ta
        ? 'சேவையகப் பதிலைப் படிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        : 'Received an unexpected response from the server. Please try again.';
    }
    return err.message;
  }
  return ta ? fallbackTa : fallbackEn;
}
