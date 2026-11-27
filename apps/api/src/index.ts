import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { env, isRazorpayConfigured, isSupabaseConfigured } from './config/env.js';
import { getSupabaseAdmin } from './config/supabase.js';
import { adminRouter } from './routes/admin.js';
import { donationsRouter } from './routes/donations.js';
import { publicRouter } from './routes/public.js';
import { apiCache } from './services/cache.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
    })
  );

  // Capture raw body for Razorpay webhook HMAC verification while parsing JSON
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        if (req.url?.startsWith('/api/donations/webhook')) {
          (req as unknown as { rawBody?: Buffer }).rawBody = buf;
        }
      }
    })
  );
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));

  app.get('/api/health', async (_req, res) => {
    const supabaseReady = isSupabaseConfigured();
    const razorpayReady = isRazorpayConfigured();
    let dbConnected = false;

    if (supabaseReady) {
      try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('site_settings').select('key').limit(1);
        dbConnected = !error;
      } catch {
        dbConnected = false;
      }
    }

    res.json({
      status: 'ok',
      service: 'ilangathir-api',
      supabaseConfigured: supabaseReady,
      databaseConnected: dbConnected,
      razorpayConfigured: razorpayReady,
      cacheEntries: apiCache.size()
    });
  });

  app.use('/api/public', publicRouter);
  app.use('/api/donations', donationsRouter);
  app.use('/api/admin', adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    }
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[API Error]', err);
    }
    res.status(status).json({
      error: env.NODE_ENV === 'production' && status >= 500
        ? 'An unexpected server error occurred. Please try again.'
        : err.message || 'Server error.'
    });
  });

  return app;
}

const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() || '');
if (isMainModule || process.env.START_API_SERVER === 'true') {
  const app = createApp();
  app.listen(env.API_PORT, () => {
    console.log(`[Ilangathir API] Listening on http://localhost:${env.API_PORT}`);
    console.log(`[Ilangathir API] Supabase configured: ${isSupabaseConfigured()} | Razorpay configured: ${isRazorpayConfigured()}`);
  });
}
