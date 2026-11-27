import { API_URL, getSupabaseClient } from './supabase';

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Session expired. Please sign in again.');
  return token;
}

export async function adminApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {})
  };

  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    throw new Error(typeof json.error === 'string' ? json.error : `Request failed (${res.status})`);
  }
  return json as T;
}

export async function uploadMediaWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ items: Array<Record<string, unknown>> }> {
  const token = await getAccessToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/admin/media/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed);
        } else {
          reject(new Error(parsed.error || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error('Invalid server response during upload.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload.'));
    xhr.send(formData);
  });
}
