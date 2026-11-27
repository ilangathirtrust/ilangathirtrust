import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env.js';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw Object.assign(
      new Error('Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.'),
      { status: 503 }
    );
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return adminClient;
}

export function getSupabaseAnon(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw Object.assign(
      new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.'),
      { status: 503 }
    );
  }
  if (!anonClient) {
    anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return anonClient;
}

export function getPublicStorageUrl(bucket: string, storagePath: string): string {
  if (!env.SUPABASE_URL) return '';
  const cleanPath = storagePath.replace(/^\/+/, '');
  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
