import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import {
  contactEnquirySchema,
  createDonationOrderSchema,
  pickLocalized,
  sanitizePlainText,
  volunteerApplicationSchema
} from '@ilangathir/shared';
import { createApp } from '../src/index.js';
import { apiCache, withCache } from '../src/services/cache.js';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from '../src/services/razorpay.js';

test('Razorpay payment signature verification accepts valid HMAC-SHA256 and rejects tampered inputs', () => {
  const secret = 'test_rzp_secret_12345';
  const orderId = 'order_test_999';
  const paymentId = 'pay_test_888';
  const validSig = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, validSig, secret), true);
  assert.equal(verifyRazorpayPaymentSignature(orderId, 'pay_tampered', validSig, secret), false);
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, '0'.repeat(64), secret), false);
});

test('Razorpay webhook signature verification validates raw payload buffer safely', () => {
  const webhookSecret = 'whsec_ilangathir_987';
  const payload = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } }));
  const validSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

  assert.equal(verifyRazorpayWebhookSignature(payload, validSig, webhookSecret), true);
  assert.equal(verifyRazorpayWebhookSignature(Buffer.from('tampered'), validSig, webhookSecret), false);
});

test('Shared Zod validation schemas enforce security, honeypot, and consent rules', () => {
  assert.equal(
    contactEnquirySchema.safeParse({
      name: 'Arun',
      email: 'arun@example.com',
      subject: 'Question',
      message: 'Hello, I want to learn more about Ilangathir Trust.',
      website: ''
    }).success,
    true
  );

  // Honeypot filled -> rejected
  assert.equal(
    contactEnquirySchema.safeParse({
      name: 'Bot',
      email: 'bot@example.com',
      subject: 'Spam',
      message: 'Spam message content here.',
      website: 'https://spam.invalid'
    }).success,
    false
  );

  // Volunteer without consent -> rejected
  assert.equal(
    volunteerApplicationSchema.safeParse({
      full_name: 'Priya',
      email: 'priya@example.com',
      phone: '+91 9876543210',
      district: 'Dindigul',
      interest: 'Education support',
      consent: false
    }).success,
    false
  );

  // Donation below minimum INR 100 -> rejected
  assert.equal(
    createDonationOrderSchema.safeParse({
      donor_name: 'Karthik',
      donor_email: 'karthik@example.com',
      donor_phone: '+91 9876543210',
      purpose: 'Education Support',
      amount_inr: 50
    }).success,
    false
  );
});

test('Bilingual helper and plain text sanitizer behave safely', () => {
  const record = { title_en: 'Health Camp', title_ta: 'மருத்துவ முகாம்' };
  assert.equal(pickLocalized(record, 'title', 'en'), 'Health Camp');
  assert.equal(pickLocalized(record, 'title', 'ta'), 'மருத்துவ முகாம்');
  assert.equal(pickLocalized({ title_en: 'Only EN', title_ta: '' }, 'title', 'ta'), 'Only EN');
  assert.equal(sanitizePlainText('  <script>alert(1)</script> Hello  '), 'scriptalert(1)/script Hello');
});

test('Memory cache stores, serves, and invalidates prefixes cleanly', async () => {
  apiCache.clear();
  let calls = 0;
  const v1 = await withCache('public:test:1', async () => {
    calls++;
    return { ok: true };
  }, 60);
  const v2 = await withCache('public:test:1', async () => {
    calls++;
    return { ok: false };
  }, 60);

  assert.equal(calls, 1);
  assert.deepEqual(v1, v2);
  assert.equal(apiCache.invalidatePrefix('public:'), 1);
  assert.equal(apiCache.size(), 0);
});

test('API server enforces auth on /api/admin/* and exposes /api/health', async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = (await healthRes.json()) as { status: string; service: string };
    assert.equal(healthJson.status, 'ok');
    assert.equal(healthJson.service, 'ilangathir-api');

    const adminRes = await fetch(`http://127.0.0.1:${port}/api/admin/dashboard`);
    assert.equal(adminRes.status, 401);

    const notFoundRes = await fetch(`http://127.0.0.1:${port}/api/non-existent-route`);
    assert.equal(notFoundRes.status, 404);

    const badJsonRes = await fetch(`http://127.0.0.1:${port}/api/public/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"broken_json": '
    });
    assert.equal(badJsonRes.status, 400);
    const badJsonBody = (await badJsonRes.json()) as { code?: string };
    assert.equal(badJsonBody.code, 'INVALID_JSON');

    const corsBlockedRes = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: 'https://evil-untrusted-origin.example' }
    });
    assert.equal(corsBlockedRes.status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
