import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import {
  contactEnquirySchema,
  createDonationOrderSchema,
  DEFAULT_SOCIAL_LINKS,
  getEnabledSocialLinks,
  isDonationsEnabled,
  parseDonationConfig,
  parseSocialLinks,
  pickLocalized,
  receiptLookupSchema,
  sanitizePlainText,
  socialLinksUpdateSchema,
  TRUST_INFO,
  volunteerApplicationSchema
} from '@ilangathir/shared';
import { createApp } from '../src/index.js';
import { apiCache, withCache } from '../src/services/cache.js';
import {
  extractJwtSessionHash,
  parseDeviceMetadata,
  signSessionPayload,
  verifySessionSignature
} from '../src/services/device.js';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from '../src/services/razorpay.js';
import {
  buildGa4DimensionFilter,
  createServiceAccountJwt,
  validateAndResolveAnalyticsQuery
} from '../src/services/ga4.js';

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
    assert.equal(healthRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(healthRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
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

    const unlistedVercelCorsRes = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: 'https://ilangathir-unlisted-preview-admin.vercel.app' }
    });
    assert.equal(unlistedVercelCorsRes.status, 403);

    const orgCorsRes = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: 'https://www.ilangathirtrust.org' }
    });
    assert.equal(orgCorsRes.status, 200);
    assert.equal(orgCorsRes.headers.get('access-control-allow-origin'), 'https://www.ilangathirtrust.org');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Device metadata parser identifies desktop/mobile browsers and geo headers cleanly', () => {
  const desktopReq = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
      'x-forwarded-for': '203.0.113.42, 10.0.0.1',
      'x-vercel-ip-city': 'Dindigul',
      'x-vercel-ip-country-region': 'TN',
      'x-vercel-ip-country': 'IN',
      'x-device-id': 'dev_abc123456789'
    },
    ip: '127.0.0.1'
  } as unknown as import('express').Request;

  const meta = parseDeviceMetadata(desktopReq);
  assert.equal(meta.deviceType, 'desktop');
  assert.equal(meta.browser, 'Chrome');
  assert.equal(meta.os, 'Windows');
  assert.equal(meta.deviceName, 'Chrome on Windows');
  assert.equal(meta.ipAddress, '203.0.113.42');
  assert.equal(meta.geoLabel, 'Dindigul, TN, IN');
  assert.equal(meta.deviceId, 'dev_abc123456789');

  const h1 = extractJwtSessionHash('hdr.eyJzZXNzaW9uX2lkIjoic2VzXzEifQ.sig', 'dev_1');
  const h2 = extractJwtSessionHash('hdr.eyJzZXNzaW9uX2lkIjoic2VzXzIifQ.sig', 'dev_1');
  assert.notEqual(h1, h2);
});

test('Donation config helper parses enabled flag, amounts, and purposes cleanly', () => {
  assert.equal(isDonationsEnabled(undefined), true);
  assert.equal(isDonationsEnabled({ donation_config: { json_value: { enabled: false } } }), false);
  assert.equal(isDonationsEnabled({ donation_config: { json_value: { enabled: true } } }), true);

  const parsed = parseDonationConfig({
    donation_config: {
      json_value: {
        enabled: false,
        currency: 'INR',
        suggested_amounts: [200, 500],
        purposes: ['Education Support']
      }
    }
  });
  assert.equal(parsed.enabled, false);
  assert.deepEqual(parsed.suggested_amounts, [200, 500]);
  assert.deepEqual(parsed.purposes, ['Education Support']);
});

test('Digital session signature verification accepts valid HMAC-SHA256 signatures and rejects tampering', () => {
  const userId = 'user-111-owner';
  const deviceId = 'dev-abc1234567';
  const tokenHash = crypto.createHash('sha256').update('session-abc:dev-abc1234567').digest('hex');

  const signature = signSessionPayload({ userId, deviceId, tokenHash });
  assert.equal(signature.length, 64);

  assert.equal(verifySessionSignature({ userId, deviceId, tokenHash, signature }), true);
  assert.equal(verifySessionSignature({ userId: 'user-other', deviceId, tokenHash, signature }), false);
  assert.equal(verifySessionSignature({ userId, deviceId: 'dev-tampered', tokenHash, signature }), false);
  assert.equal(verifySessionSignature({ userId, deviceId, tokenHash: 'tampered', signature }), false);
  assert.equal(verifySessionSignature({ userId, deviceId, tokenHash, signature: '0'.repeat(64) }), false);
  assert.equal(verifySessionSignature({ userId, deviceId, tokenHash, signature: null }), false);
});

test('GA4 query validator resolves IST date ranges, previous periods, and filters safely', () => {
  // 2026-11-28T10:00:00Z = 2026-11-28 15:30 IST
  const ref = new Date('2026-11-28T10:00:00.000Z');
  const range7d = validateAndResolveAnalyticsQuery({ preset: '7d', compare: 'true', device: 'MOBILE' }, ref);
  assert.equal(range7d.startDate, '2026-11-22');
  assert.equal(range7d.endDate, '2026-11-28');
  assert.equal(range7d.prevStartDate, '2026-11-15');
  assert.equal(range7d.prevEndDate, '2026-11-21');
  assert.equal(range7d.device, 'mobile');

  const yesterday = validateAndResolveAnalyticsQuery({ preset: 'yesterday' }, ref);
  assert.equal(yesterday.startDate, '2026-11-27');
  assert.equal(yesterday.endDate, '2026-11-27');
  assert.equal(yesterday.prevStartDate, '2026-11-26');
  assert.equal(yesterday.prevEndDate, '2026-11-26');

  assert.throws(() => validateAndResolveAnalyticsQuery({ preset: 'custom', startDate: '2026-11-28', endDate: '2026-11-20' }, ref));
  assert.throws(() => validateAndResolveAnalyticsQuery({ preset: '28d', device: 'smartwatch' }, ref));

  const singleFilter = buildGa4DimensionFilter({ country: 'India', device: '', source: '', landingPage: '' });
  assert.deepEqual(singleFilter, {
    filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: 'India' } }
  });

  const multiFilter = buildGa4DimensionFilter({ country: 'India', device: 'mobile', source: 'google', landingPage: '' });
  assert.equal(Array.isArray((multiFilter as { andGroup?: { expressions: unknown[] } }).andGroup?.expressions), true);
});

test('GA4 Service Account RS256 JWT assertion verifies with corresponding public key', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const token = createServiceAccountJwt(
    { propertyId: '123456789', clientEmail: 'analytics@test.iam.gserviceaccount.com', privateKey },
    1_700_000_000
  );
  const parts = token.split('.');
  assert.equal(parts.length, 3);

  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
    iss: string;
    scope: string;
    aud: string;
  };
  assert.equal(claims.iss, 'analytics@test.iam.gserviceaccount.com');
  assert.equal(claims.scope, 'https://www.googleapis.com/auth/analytics.readonly');
  assert.equal(claims.aud, 'https://oauth2.googleapis.com/token');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  assert.equal(verifier.verify(publicKey, Buffer.from(parts[2], 'base64url')), true);
});

test('Social links parser, validation, receipt lookup, and trust metadata work cleanly', () => {
  assert.equal(TRUST_INFO.registrationNumber, 'Book - 4/47/2024');
  assert.equal(TRUST_INFO.panNumber, 'AACT13541A');
  assert.equal(TRUST_INFO.founderNameEn, 'Prejeval Prince');

  const defaults = parseSocialLinks(undefined);
  assert.equal(defaults.length, DEFAULT_SOCIAL_LINKS.length);
  assert.equal(defaults[0]?.url, 'https://instagram.com/ilangathirtrust');

  const enabled = getEnabledSocialLinks({
    social_links: {
      json_value: {
        items: [
          { ...DEFAULT_SOCIAL_LINKS[1], sort_order: 2, enabled: true },
          { ...DEFAULT_SOCIAL_LINKS[0], sort_order: 1, enabled: false },
          { ...DEFAULT_SOCIAL_LINKS[2], sort_order: 3, enabled: true }
        ]
      }
    }
  });
  assert.deepEqual(
    enabled.map((i) => i.platform),
    ['whatsapp', 'youtube']
  );

  // Reject unsafe javascript: protocol URLs
  assert.equal(
    socialLinksUpdateSchema.safeParse({
      items: [{ ...DEFAULT_SOCIAL_LINKS[0], url: 'javascript:alert(1)' }]
    }).success,
    false
  );

  assert.equal(
    receiptLookupSchema.safeParse({
      receipt_number: 'ILG-20261128-AB12CD',
      donor_email: 'donor@example.com'
    }).success,
    true
  );
  assert.equal(
    receiptLookupSchema.safeParse({
      receipt_number: '12',
      donor_email: 'bad-email'
    }).success,
    false
  );
});
