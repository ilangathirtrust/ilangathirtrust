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
