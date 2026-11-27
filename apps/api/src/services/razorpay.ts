import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from '../config/env.js';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw Object.assign(
      new Error('Razorpay payment gateway is not configured yet. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'),
      { status: 503 }
    );
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret = env.RAZORPAY_KEY_SECRET
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function verifyRazorpayWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  webhookSecret = env.RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!rawBody || !signature || !webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
