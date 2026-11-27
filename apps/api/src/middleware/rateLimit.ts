import type { RequestHandler } from 'express';
import * as rateLimitModule from 'express-rate-limit';

type RateLimitFn = (options?: Record<string, unknown>) => RequestHandler;

const rateLimit = (
  (rateLimitModule as unknown as { default?: RateLimitFn }).default ??
  (rateLimitModule as unknown as RateLimitFn)
);

export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' }
});

export const formSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please wait a few minutes before trying again.' }
});

export const donationOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many donation attempts. Please wait before retrying.' }
});

export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Admin rate limit reached. Please pause briefly.' }
});
