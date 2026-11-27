import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export interface AppEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  API_PORT: number;
  ROOT_DOMAIN: string;
  PUBLIC_SITE_URL: string;
  ADMIN_SITE_URL: string;
  API_SITE_URL: string;
  ALLOWED_ORIGINS: string[];
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  MAX_UPLOAD_IMAGE_MB: number;
  MAX_UPLOAD_VIDEO_MB: number;
  API_CACHE_TTL_SECONDS: number;
}

const rawAllowed = process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000,http://localhost:3001,https://www.ilangathirtrust.com,https://admin.ilangathirtrust.com,https://ilangathirtrust.com,https://ilangathir-web.vercel.app,https://ilangathir-admin.vercel.app';

export const env: AppEnv = {
  NODE_ENV: (process.env.NODE_ENV as AppEnv['NODE_ENV']) || 'development',
  API_PORT: Number(process.env.API_PORT || process.env.PORT || 4000),
  ROOT_DOMAIN: process.env.ROOT_DOMAIN || 'ilangathirtrust.com',
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
  ADMIN_SITE_URL: process.env.ADMIN_SITE_URL || 'http://localhost:3001',
  API_SITE_URL: process.env.API_SITE_URL || 'http://localhost:4000',
  ALLOWED_ORIGINS: rawAllowed
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  SUPABASE_URL: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, ''),
  SUPABASE_ANON_KEY: (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '').trim(),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim(),
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
  MAX_UPLOAD_IMAGE_MB: Number(process.env.MAX_UPLOAD_IMAGE_MB || 10),
  MAX_UPLOAD_VIDEO_MB: Number(process.env.MAX_UPLOAD_VIDEO_MB || 50),
  API_CACHE_TTL_SECONDS: Number(process.env.API_CACHE_TTL_SECONDS || 300)
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    !env.SUPABASE_URL.includes('your-project-ref')
  );
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_SECRET &&
    !env.RAZORPAY_KEY_ID.includes('your_key_id')
  );
}

export function isServiceRoleKeyLikelyValid(): boolean {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  if (key.startsWith('sb_publishable_')) return false;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: string };
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  }
  return false;
}
