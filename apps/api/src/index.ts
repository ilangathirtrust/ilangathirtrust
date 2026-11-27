import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import multer from 'multer';
import { env, isRazorpayConfigured, isServiceRoleKeyLikelyValid, isSupabaseConfigured } from './config/env.js';
import { getSupabaseAdmin } from './config/supabase.js';
import { adminRouter } from './routes/admin.js';
import { donationsRouter } from './routes/donations.js';
import { publicRouter } from './routes/public.js';
import { apiCache } from './services/cache.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const helmetFn = (
    (helmetModule as unknown as { default?: (...args: unknown[]) => express.RequestHandler }).default ??
    (helmetModule as unknown as (...args: unknown[]) => express.RequestHandler)
  );

  app.use(
    helmetFn({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const vercelOriginPattern = /^https:\/\/ilangathir-(?:[a-z0-9-]+-)?(web|admin)(?:-ilangathir-trust)?\.vercel\.app$/i;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin) || vercelOriginPattern.test(origin)) {
          return callback(null, true);
        }
        return callback(
          Object.assign(new Error(`Origin ${origin} is not allowed by CORS policy.`), {
            status: 403,
            code: 'CORS_NOT_ALLOWED'
          })
        );
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
      cacheEntries: apiCache.size(),
      checks: {
        hasSupabaseUrl: Boolean(env.SUPABASE_URL),
        hasSupabaseAnonKey: Boolean(env.SUPABASE_ANON_KEY),
        hasSupabaseServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
        serviceRoleKeyValid: isServiceRoleKeyLikelyValid(),
        hasRazorpayKeyId: Boolean(env.RAZORPAY_KEY_ID),
        hasRazorpayKeySecret: Boolean(env.RAZORPAY_KEY_SECRET),
        hasRazorpayWebhookSecret: Boolean(env.RAZORPAY_WEBHOOK_SECRET)
      }
    });
  });

  app.use('/api/public', publicRouter);
  app.use('/api/donations', donationsRouter);
  app.use('/api/admin', adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'API route not found.', code: 'ROUTE_NOT_FOUND' });
  });

  app.use(
    (
      err: Error & {
        status?: number;
        statusCode?: number;
        code?: string;
        type?: string;
        error?: { description?: string; code?: string };
      },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (err instanceof multer.MulterError) {
        const multerMessages: Record<string, string> = {
          LIMIT_FILE_SIZE: 'Uploaded file exceeds the maximum allowed size limit.',
          LIMIT_FILE_COUNT: 'Too many files uploaded at once (maximum 20 files).',
          LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload request.'
        };
        res.status(400).json({
          error: multerMessages[err.code] || `Upload error: ${err.message}`,
          code: err.code || 'UPLOAD_ERROR'
        });
        return;
      }

      if (err instanceof SyntaxError && (err.type === 'entity.parse.failed' || 'body' in err)) {
        res.status(400).json({
          error: 'Invalid JSON request body. Please check your input format.',
          code: 'INVALID_JSON'
        });
        return;
      }

      // Postgres / PostgREST error code mapping
      const dbErrorMap: Record<string, { status: number; message: string; code: string }> = {
        '23505': { status: 409, message: 'A record with this unique value or slug already exists.', code: 'DUPLICATE_RECORD' },
        '23503': { status: 400, message: 'Referenced record does not exist or cannot be removed while still in use.', code: 'FOREIGN_KEY_VIOLATION' },
        '23502': { status: 400, message: 'A required database field was missing.', code: 'MISSING_REQUIRED_FIELD' },
        '22P02': { status: 400, message: 'Invalid ID or parameter format.', code: 'INVALID_INPUT_SYNTAX' },
        '42501': { status: 403, message: 'Database permission denied. Ensure schema grants and policies are configured.', code: 'DB_PERMISSION_DENIED' },
        PGRST116: { status: 404, message: 'The requested record could not be found.', code: 'RECORD_NOT_FOUND' }
      };

      if (err.code && dbErrorMap[err.code]) {
        const mapped = dbErrorMap[err.code];
        if (mapped.status >= 500 || err.code === '42501') {
          console.error('[API DB Error]', err.code, err.message);
        }
        res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
        return;
      }

      // Razorpay SDK error shape ({ statusCode, error: { description, code } })
      if (typeof err.statusCode === 'number' && err.error?.description) {
        const safeStatus = err.statusCode >= 400 && err.statusCode < 500 ? 400 : 502;
        console.error('[Razorpay Error]', err.statusCode, err.error);
        res.status(safeStatus).json({
          error: `Payment gateway error: ${err.error.description}`,
          code: err.error.code || 'PAYMENT_GATEWAY_ERROR'
        });
        return;
      }

      const status = err.status || 500;
      if (status >= 500) {
        console.error('[API Error]', err);
      }

      const isSafeClientOrConfigError = status < 500 || status === 503;
      res.status(status).json({
        error:
          env.NODE_ENV === 'production' && !isSafeClientOrConfigError
            ? 'Something went wrong on our server. Please try again in a moment.'
            : err.message || 'Server error.',
        code: err.code || (status === 503 ? 'SERVICE_UNAVAILABLE' : status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR')
      });
    }
  );

  return app;
}

const app = createApp();
export default app;

const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() || '');
if (process.env.VERCEL !== '1' && (isMainModule || process.env.START_API_SERVER === 'true')) {
  app.listen(env.API_PORT, () => {
    console.log(`[Ilangathir API] Listening on http://localhost:${env.API_PORT}`);
    console.log(`[Ilangathir API] Supabase configured: ${isSupabaseConfigured()} | Razorpay configured: ${isRazorpayConfigured()}`);
  });
}
