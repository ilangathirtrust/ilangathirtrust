import { getSupabaseClient, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

export class Ga4EdgeApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = 'GA4_EDGE_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function callGa4Edge<T>(
  subPath: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {}
): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Ga4EdgeApiError('Supabase URL or anon key is not configured.', 503, 'SUPABASE_NOT_CONFIGURED');
  }

  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Ga4EdgeApiError('Admin authentication session required.', 401, 'UNAUTHORIZED');
  }

  const normalizedPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ga4-analytics${normalizedPath}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });

  const payload = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    throw new Ga4EdgeApiError(
      payload?.error || `Analytics request failed (${res.status})`,
      res.status,
      payload?.code || 'GA4_EDGE_ERROR'
    );
  }

  return payload;
}
