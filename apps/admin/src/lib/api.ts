import { API_URL, getSupabaseClient } from './supabase';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const storageKey = 'ilangathir_device_id';
  try {
    let existing = localStorage.getItem(storageKey);
    if (!existing || existing.length < 12) {
      const rand =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
      existing = `dev_${rand}`;
      localStorage.setItem(storageKey, existing);
    }
    return existing;
  } catch {
    return 'dev_session_fallback';
  }
}

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

function firstIssueMessage(issues: unknown): string | null {
  if (!issues || typeof issues !== 'object') return null;
  for (const val of Object.values(issues as Record<string, unknown>)) {
    if (Array.isArray(val) && typeof val[0] === 'string' && val[0]) {
      return val[0];
    }
  }
  return null;
}

function friendlyStatusFallback(status: number): string {
  switch (status) {
    case 400:
      return 'Some entered fields are invalid. Please review and try again.';
    case 401:
      return 'Your session expired. Please sign in again.';
    case 403:
      return 'You do not have permission for this action.';
    case 404:
      return 'The requested record could not be found.';
    case 409:
      return 'A record with this unique value or slug already exists.';
    case 413:
      return 'The uploaded file or payload is too large.';
    case 429:
      return 'Too many requests. Please wait a few seconds and try again.';
    case 503:
      return 'Backend service is temporarily unavailable or missing configuration.';
    default:
      return status >= 500
        ? 'A server error occurred. Please try again in a moment.'
        : `Request failed (HTTP ${status}).`;
  }
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new AdminApiError(error.message || 'Could not verify your login session.', 401, 'SESSION_ERROR');
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new AdminApiError('Session expired. Please sign in again.', 401, 'NO_SESSION');
  }
  return token;
}

const ADMIN_GET_TTL_MS = 60_000;
const getCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflightGets = new Map<string, Promise<unknown>>();

export function clearAdminApiCache(): void {
  getCache.clear();
  inflightGets.clear();
}

export function prefetchAdminRoutes(role: string): void {
  const routes = ['/dashboard', '/events', '/gallery/folders', '/blogs', '/enquiries', '/activities'];
  if (role === 'super_admin' || role === 'admin') {
    routes.push('/donations?page=1&pageSize=20');
  }
  for (const r of routes) {
    if (!getCache.has(r) && !inflightGets.has(r)) {
      void adminApi(r).catch(() => {});
    }
  }
}

export async function adminApi<T = unknown>(
  path: string,
  options: RequestInit & { forceRefresh?: boolean } = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (isGet && !options.forceRefresh) {
    const hit = getCache.get(path);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.data as T;
    }
    const existingFlight = inflightGets.get(path);
    if (existingFlight) {
      return existingFlight as Promise<T>;
    }
  }

  if (!isGet) {
    clearAdminApiCache();
  }

  const runFetch = async (): Promise<T> => {
    const token = await getAccessToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'X-Device-Id': getOrCreateDeviceId(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {})
    };

    const { forceRefresh: _ignore, ...fetchOptions } = options;

    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/admin${path}`, {
        ...fetchOptions,
        headers
      });
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (isAbort) throw err;
      throw new AdminApiError(
        'Cannot reach the API server right now. Check your internet connection and try again.',
        0,
        'NETWORK_ERROR'
      );
    }

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      json = {};
    }

    if (!res.ok) {
      if (res.status === 401 && (path !== '/me' || json.code === 'SESSION_REVOKED') && typeof window !== 'undefined') {
        clearAdminApiCache();
        window.dispatchEvent(
          new CustomEvent('ilangathir:session-expired', {
            detail: {
              message: typeof json.error === 'string' ? json.error : undefined,
              code: typeof json.code === 'string' ? json.code : undefined
            }
          })
        );
      }
      const serverMsg = typeof json.error === 'string' && json.error.trim() ? json.error.trim() : '';
      const fieldMsg = firstIssueMessage(json.issues);
      const combined =
        serverMsg && fieldMsg && !serverMsg.includes(fieldMsg)
          ? `${serverMsg} (${fieldMsg})`
          : serverMsg || fieldMsg || friendlyStatusFallback(res.status);
      throw new AdminApiError(
        combined,
        res.status,
        typeof json.code === 'string' ? json.code : undefined
      );
    }

    if (isGet) {
      getCache.set(path, { expiresAt: Date.now() + ADMIN_GET_TTL_MS, data: json });
    }
    return json as T;
  };

  if (isGet) {
    const promise = runFetch().finally(() => {
      inflightGets.delete(path);
    });
    inflightGets.set(path, promise);
    return promise;
  }

  return runFetch();
}

/**
 * Direct-to-Supabase-Storage signed upload flow.
 * Bypasses Vercel's 4.5MB serverless body limit so large images and 50MB videos upload reliably.
 */
export async function uploadMediaWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ items: Array<Record<string, unknown>> }> {
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length) throw new Error('No files selected for upload.');

  const bucket = String(formData.get('bucket') || 'media');
  const folderName = String(formData.get('folder_name') || 'general');
  const category = String(formData.get('category') || 'General');
  const supabase = getSupabaseClient();

  const uploadedItems: Array<Record<string, unknown>> = [];
  onProgress(5);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const signed = await adminApi<{
      bucket: string;
      folder_name: string;
      storage_path: string;
      token: string;
      media_type: string;
    }>('/media/signed-upload', {
      method: 'POST',
      body: JSON.stringify({
        bucket,
        folder_name: folderName,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size
      })
    });

    const { error: uploadErr } = await supabase.storage
      .from(signed.bucket)
      .uploadToSignedUrl(signed.storage_path, signed.token, file, {
        contentType: file.type || undefined,
        cacheControl: '31536000'
      });

    if (uploadErr) throw new Error(uploadErr.message || `Failed to upload ${file.name}`);

    const asset = await adminApi<Record<string, unknown>>('/media/confirm-upload', {
      method: 'POST',
      body: JSON.stringify({
        bucket: signed.bucket,
        folder_name: signed.folder_name,
        category,
        storage_path: signed.storage_path,
        media_type: signed.media_type,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size
      })
    });

    uploadedItems.push(asset);
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }

  return { items: uploadedItems };
}
