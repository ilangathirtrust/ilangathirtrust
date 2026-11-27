import { cookies, headers } from 'next/headers';
import type { Language } from '@ilangathir/shared';

export async function getServerLang(searchLang?: string | string[]): Promise<Language> {
  if (searchLang === 'ta') return 'ta';
  if (searchLang === 'en') return 'en';
  try {
    const hdrs = await headers();
    const hdrLang = hdrs.get('x-ilangathir-lang');
    if (hdrLang === 'ta') return 'ta';
    if (hdrLang === 'en') return 'en';

    const cookieStore = await cookies();
    const val = cookieStore.get('ilangathir_lang')?.value;
    if (val === 'ta') return 'ta';
  } catch {
    // Fallback during static generation
  }
  return 'en';
}
