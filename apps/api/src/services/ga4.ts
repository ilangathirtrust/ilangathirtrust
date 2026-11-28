import crypto from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { apiCache } from './cache.js';

export type DateRangePreset = 'today' | 'yesterday' | '7d' | '28d' | '30d' | '90d' | 'custom';

export interface AnalyticsQueryFilters {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  compare: boolean;
  country: string;
  device: string;
  source: string;
  landingPage: string;
}

interface ResolvedGa4Creds {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
}

const REPORT_CACHE_TTL_SECONDS = 300;
const REALTIME_CACHE_TTL_SECONDS = 15;
const IST_TIMEZONE = 'Asia/Kolkata';

const presetSchema = z.enum(['today', 'yesterday', '7d', '28d', '30d', '90d', 'custom']);
const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const safeFilterSchema = z.string().trim().max(200);

interface Ga4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

interface Ga4ReportResponse {
  rows?: Ga4Row[];
  totals?: Ga4Row[];
}

export class Ga4ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 502, code = 'GA4_API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function resolveGa4Credentials(): ResolvedGa4Creds | null {
  let clientEmail = env.GA4_CLIENT_EMAIL;
  let privateKey = env.GA4_PRIVATE_KEY;

  if ((!clientEmail || !privateKey) && env.GA4_SERVICE_ACCOUNT_JSON) {
    try {
      const rawJson = env.GA4_SERVICE_ACCOUNT_JSON.startsWith('{')
        ? env.GA4_SERVICE_ACCOUNT_JSON
        : Buffer.from(env.GA4_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8');
      const parsed = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
      clientEmail = clientEmail || String(parsed.client_email || '').trim();
      privateKey = privateKey || String(parsed.private_key || '').replace(/\\n/g, '\n').trim();
    } catch {
      return null;
    }
  }

  const propertyId = env.GA4_PROPERTY_ID;
  if (!propertyId || !/^\d{5,16}$/.test(propertyId)) return null;
  if (!clientEmail || !clientEmail.includes('@')) return null;
  if (!privateKey || !privateKey.includes('PRIVATE KEY')) return null;

  return { propertyId, clientEmail, privateKey };
}

export function isGa4Configured(): boolean {
  return Boolean(resolveGa4Credentials());
}

export function getGa4ConfigStatus() {
  let hasEmail = Boolean(env.GA4_CLIENT_EMAIL);
  let hasKey = Boolean(env.GA4_PRIVATE_KEY);
  if ((!hasEmail || !hasKey) && env.GA4_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = env.GA4_SERVICE_ACCOUNT_JSON.startsWith('{')
        ? env.GA4_SERVICE_ACCOUNT_JSON
        : Buffer.from(env.GA4_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8');
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      hasEmail = hasEmail || Boolean(parsed.client_email);
      hasKey = hasKey || Boolean(parsed.private_key);
    } catch {
      // ignore invalid json
    }
  }
  const hasPropertyId = /^\d{5,16}$/.test(env.GA4_PROPERTY_ID);
  const creds = resolveGa4Credentials();
  return {
    configured: Boolean(creds),
    hasPropertyId,
    hasClientEmail: hasEmail,
    hasPrivateKey: hasKey,
    measurementId: 'G-VNPQW61EYH',
    timezone: IST_TIMEZONE,
    requiredEnvVars: ['GA4_PROPERTY_ID', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY']
  };
}

export function formatIstYmd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function shiftYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

function diffDaysInclusive(startYmd: string, endYmd: string): number {
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

export function validateAndResolveAnalyticsQuery(query: Record<string, unknown>, referenceDate = new Date()): AnalyticsQueryFilters {
  const parsedPreset = presetSchema.safeParse(String(query.preset || '28d'));
  if (!parsedPreset.success) {
    throw new Ga4ApiError('Unsupported date range preset.', 400, 'INVALID_DATE_PRESET');
  }

  const preset = parsedPreset.data;
  const istToday = formatIstYmd(referenceDate);
  let startDate = istToday;
  let endDate = istToday;

  switch (preset) {
    case 'today':
      startDate = istToday;
      endDate = istToday;
      break;
    case 'yesterday': {
      const y = shiftYmd(istToday, -1);
      startDate = y;
      endDate = y;
      break;
    }
    case '7d':
      startDate = shiftYmd(istToday, -6);
      endDate = istToday;
      break;
    case '28d':
      startDate = shiftYmd(istToday, -27);
      endDate = istToday;
      break;
    case '30d':
      startDate = shiftYmd(istToday, -29);
      endDate = istToday;
      break;
    case '90d':
      startDate = shiftYmd(istToday, -89);
      endDate = istToday;
      break;
    case 'custom': {
      const s = ymdSchema.safeParse(String(query.startDate || ''));
      const e = ymdSchema.safeParse(String(query.endDate || ''));
      if (!s.success || !e.success) {
        throw new Ga4ApiError('Custom date range requires valid YYYY-MM-DD startDate and endDate.', 400, 'INVALID_CUSTOM_RANGE');
      }
      if (s.data > e.data) {
        throw new Ga4ApiError('Start date cannot be after end date.', 400, 'INVALID_DATE_ORDER');
      }
      if (s.data < '2020-01-01' || e.data > istToday) {
        throw new Ga4ApiError('Selected custom date range is out of supported bounds.', 400, 'DATE_OUT_OF_BOUNDS');
      }
      if (diffDaysInclusive(s.data, e.data) > 366) {
        throw new Ga4ApiError('Custom date range cannot exceed 366 days per request.', 400, 'DATE_SPAN_TOO_LARGE');
      }
      startDate = s.data;
      endDate = e.data;
      break;
    }
  }

  const span = diffDaysInclusive(startDate, endDate);
  const prevEndDate = shiftYmd(startDate, -1);
  const prevStartDate = shiftYmd(prevEndDate, -(span - 1));
  const compare = String(query.compare ?? 'true') !== 'false';

  const country = safeFilterSchema.parse(String(query.country || ''));
  const device = safeFilterSchema.parse(String(query.device || '').toLowerCase());
  if (device && !['desktop', 'mobile', 'tablet'].includes(device)) {
    throw new Ga4ApiError('Device filter must be desktop, mobile, or tablet.', 400, 'INVALID_DEVICE_FILTER');
  }
  const source = safeFilterSchema.parse(String(query.source || ''));
  const landingPage = safeFilterSchema.parse(String(query.landingPage || ''));

  return {
    preset,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    compare,
    country,
    device,
    source,
    landingPage
  };
}

export function buildGa4DimensionFilter(filters: Pick<AnalyticsQueryFilters, 'country' | 'device' | 'source' | 'landingPage'>) {
  const expressions: Array<Record<string, unknown>> = [];
  if (filters.country) {
    expressions.push({
      filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: filters.country } }
    });
  }
  if (filters.device) {
    expressions.push({
      filter: { fieldName: 'deviceCategory', stringFilter: { matchType: 'EXACT', value: filters.device } }
    });
  }
  if (filters.source) {
    expressions.push({
      filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'EXACT', value: filters.source } }
    });
  }
  if (filters.landingPage) {
    expressions.push({
      filter: { fieldName: 'landingPagePlusQueryString', stringFilter: { matchType: 'EXACT', value: filters.landingPage } }
    });
  }
  if (expressions.length === 0) return undefined;
  if (expressions.length === 1) return expressions[0];
  return { andGroup: { expressions } };
}

export function createServiceAccountJwt(creds: ResolvedGa4Creds, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSeconds,
      exp: nowSeconds + 3600
    })
  ).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(creds.privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

async function getGa4AccessToken(creds: ResolvedGa4Creds): Promise<string> {
  const cacheKey = `ga4:oauth:${creds.clientEmail}`;
  const cached = apiCache.get<string>(cacheKey);
  if (cached) return cached;

  const assertion = createServiceAccountJwt(creds);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const json = (await resp.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!resp.ok || !json.access_token) {
    throw new Ga4ApiError(
      json.error_description || json.error || 'Failed to authenticate Google Service Account with GA4.',
      resp.status === 401 || resp.status === 400 ? 401 : 502,
      'GA4_AUTH_FAILED'
    );
  }

  const ttl = Math.max(60, Math.min(3400, (json.expires_in || 3600) - 180));
  apiCache.set(cacheKey, json.access_token, ttl);
  return json.access_token;
}

async function callGa4Json<T>(url: string, accessToken: string, payload: Record<string, unknown>): Promise<T> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = (await resp.json().catch(() => ({}))) as T & {
    error?: { code?: number; message?: string; status?: string };
  };

  if (!resp.ok) {
    const errStatus = json?.error?.status || '';
    const errMsg = json?.error?.message || `Google Analytics Data API error (${resp.status}).`;
    if (resp.status === 429 || errStatus === 'RESOURCE_EXHAUSTED') {
      throw new Ga4ApiError('Google Analytics Data API quota limit reached. Please wait briefly and try again.', 429, 'GA4_QUOTA_EXCEEDED');
    }
    if (resp.status === 403 || errStatus === 'PERMISSION_DENIED') {
      throw new Ga4ApiError(
        'Permission denied on GA4 Property. Ensure the Google Service Account email has Viewer access in GA4 Property Access Management.',
        403,
        'GA4_PERMISSION_DENIED'
      );
    }
    throw new Ga4ApiError(errMsg, resp.status >= 400 && resp.status < 500 ? 400 : 502, errStatus || 'GA4_API_ERROR');
  }

  return json;
}

const n = (v?: string): number => Number(v || 0) || 0;
const dim = (row: Ga4Row, idx: number): string => String(row.dimensionValues?.[idx]?.value || '');
const met = (row: Ga4Row, idx: number): number => n(row.metricValues?.[idx]?.value);

function calcDeltaPercent(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatGaDateYmd(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

export async function fetchGa4CoreReports(filters: AnalyticsQueryFilters, forceRefresh = false) {
  const creds = resolveGa4Credentials();
  if (!creds) {
    return {
      configured: false as const,
      configStatus: getGa4ConfigStatus()
    };
  }

  const cacheKey = `ga4:reports:${creds.propertyId}:${JSON.stringify(filters)}`;
  if (!forceRefresh) {
    const cached = apiCache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;
  }

  const accessToken = await getGa4AccessToken(creds);
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${creds.propertyId}:batchRunReports`;
  const dimensionFilter = buildGa4DimensionFilter(filters);

  const dateRanges = filters.compare
    ? [
        { startDate: filters.startDate, endDate: filters.endDate },
        { startDate: filters.prevStartDate, endDate: filters.prevEndDate }
      ]
    : [{ startDate: filters.startDate, endDate: filters.endDate }];

  const currOnlyRange = [{ startDate: filters.startDate, endDate: filters.endDate }];

  const withFilter = (req: Record<string, unknown>) => (dimensionFilter ? { ...req, dimensionFilter } : req);

  // Batch 1 (max 5 reports)
  const batch1Promise = callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
    requests: [
      // 0: Overview Metrics part 1 (8 metrics)
      withFilter({
        dateRanges,
        metrics: [
          { name: 'totalUsers' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'screenPageViewsPerSession' },
          { name: 'userEngagementDuration' },
          { name: 'engagementRate' }
        ]
      }),
      // 1: Overview Metrics part 2 (3 metrics)
      withFilter({
        dateRanges,
        metrics: [{ name: 'bounceRate' }, { name: 'eventCount' }, { name: 'keyEvents' }]
      }),
      // 2: New vs Returning Users
      withFilter({
        dateRanges,
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }]
      }),
      // 3: Daily Traffic & Engagement Trend
      withFilter({
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'eventCount' },
          { name: 'keyEvents' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: 400
      }),
      // 4: Geographic Locations (Country + City)
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'country' }, { name: 'countryId' }, { name: 'city' }],
        metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }, { name: 'engagementRate' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 60
      })
    ]
  });

  // Batch 2 (max 5 reports)
  const batch2Promise = callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
    requests: [
      // 0: Traffic Sources & Campaigns
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [
          { name: 'sessionDefaultChannelGroup' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaignName' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'keyEvents' }
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 60
      }),
      // 1: Top Pages
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'userEngagementDuration' },
          { name: 'engagementRate' },
          { name: 'bounceRate' }
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 50
      }),
      // 2: Landing Pages
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'keyEvents' }
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 40
      }),
      // 3: Events by Name (Engagement + Conversions)
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 50
      }),
      // 4: Languages
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'language' }],
        metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 20
      })
    ]
  });

  // Batch 3 (4 reports: Device, OS, Browser, Resolution)
  const batch3Promise = callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
    requests: [
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'keyEvents' }
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
      }),
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'operatingSystem' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15
      }),
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'browser' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15
      }),
      withFilter({
        dateRanges: currOnlyRange,
        dimensions: [{ name: 'screenResolution' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15
      })
    ]
  });

  const [b1, b2, b3] = await Promise.all([batch1Promise, batch2Promise, batch3Promise]);
  const r1 = b1.reports || [];
  const r2 = b2.reports || [];
  const r3 = b3.reports || [];

  // Parse overview current vs previous rows
  const extractRangeRow = (rep: Ga4ReportResponse | undefined, rangeIdx: number) => {
    const rows = rep?.rows || [];
    if (!filters.compare) return rows[0] || rep?.totals?.[0];
    const targetTag = rangeIdx === 0 ? 'date_range_0' : 'date_range_1';
    return rows.find((r) => dim(r, 0) === targetTag) || rows[rangeIdx];
  };

  const ov1Curr = extractRangeRow(r1[0], 0);
  const ov1Prev = filters.compare ? extractRangeRow(r1[0], 1) : undefined;
  const ov2Curr = extractRangeRow(r1[1], 0);
  const ov2Prev = filters.compare ? extractRangeRow(r1[1], 1) : undefined;

  // Parse newVsReturning report
  let currReturning = 0;
  let prevReturning = 0;
  for (const row of r1[2]?.rows || []) {
    if (filters.compare) {
      const seg = dim(row, 0);
      const dr = dim(row, 1);
      if (seg === 'returning' && dr === 'date_range_0') currReturning += met(row, 0);
      if (seg === 'returning' && dr === 'date_range_1') prevReturning += met(row, 0);
    } else {
      if (dim(row, 0) === 'returning') currReturning += met(row, 0);
    }
  }

  const currTotalUsers = ov1Curr ? met(ov1Curr, 0) : 0;
  const prevTotalUsers = ov1Prev ? met(ov1Prev, 0) : null;
  const currActiveUsers = ov1Curr ? met(ov1Curr, 1) : 0;
  const prevActiveUsers = ov1Prev ? met(ov1Prev, 1) : null;
  const currNewUsers = ov1Curr ? met(ov1Curr, 2) : 0;
  const prevNewUsers = ov1Prev ? met(ov1Prev, 2) : null;
  const currSessions = ov1Curr ? met(ov1Curr, 3) : 0;
  const prevSessions = ov1Prev ? met(ov1Prev, 3) : null;
  const currViews = ov1Curr ? met(ov1Curr, 4) : 0;
  const prevViews = ov1Prev ? met(ov1Prev, 4) : null;
  const currViewsPerSession = ov1Curr ? Number(met(ov1Curr, 5).toFixed(2)) : 0;
  const prevViewsPerSession = ov1Prev ? Number(met(ov1Prev, 5).toFixed(2)) : null;
  const currEngDurationTotal = ov1Curr ? met(ov1Curr, 6) : 0;
  const prevEngDurationTotal = ov1Prev ? met(ov1Prev, 6) : 0;
  const currAvgEngSeconds = currActiveUsers > 0 ? Math.round(currEngDurationTotal / currActiveUsers) : 0;
  const prevAvgEngSeconds =
    prevActiveUsers && prevActiveUsers > 0 ? Math.round(prevEngDurationTotal / prevActiveUsers) : filters.compare ? 0 : null;
  const currEngagementRate = ov1Curr ? Number((met(ov1Curr, 7) * 100).toFixed(1)) : 0;
  const prevEngagementRate = ov1Prev ? Number((met(ov1Prev, 7) * 100).toFixed(1)) : null;

  const currBounceRate = ov2Curr ? Number((met(ov2Curr, 0) * 100).toFixed(1)) : 0;
  const prevBounceRate = ov2Prev ? Number((met(ov2Prev, 0) * 100).toFixed(1)) : null;
  const currEventCount = ov2Curr ? met(ov2Curr, 1) : 0;
  const prevEventCount = ov2Prev ? met(ov2Prev, 1) : null;
  const currKeyEvents = ov2Curr ? met(ov2Curr, 2) : 0;
  const prevKeyEvents = ov2Prev ? met(ov2Prev, 2) : null;

  const returningVal = currReturning || Math.max(0, currTotalUsers - currNewUsers);
  const prevReturningVal = filters.compare
    ? prevReturning || Math.max(0, (prevTotalUsers || 0) - (prevNewUsers || 0))
    : null;

  // Build aligned daily trend
  const currDays = new Map<
    string,
    {
      date: string;
      activeUsers: number;
      newUsers: number;
      sessions: number;
      pageViews: number;
      engagementSeconds: number;
      engagementRate: number;
      bounceRate: number;
      eventCount: number;
      conversions: number;
    }
  >();
  const prevDays = new Map<string, { activeUsers: number; sessions: number; pageViews: number; conversions: number }>();

  for (const row of r1[3]?.rows || []) {
    const rawDate = formatGaDateYmd(dim(row, 0));
    const rangeTag = filters.compare ? dim(row, 1) : 'date_range_0';
    const act = met(row, 0);
    if (rangeTag === 'date_range_1') {
      prevDays.set(rawDate, {
        activeUsers: act,
        sessions: met(row, 2),
        pageViews: met(row, 3),
        conversions: met(row, 8)
      });
    } else {
      const totalDur = met(row, 4);
      currDays.set(rawDate, {
        date: rawDate,
        activeUsers: act,
        newUsers: met(row, 1),
        sessions: met(row, 2),
        pageViews: met(row, 3),
        engagementSeconds: act > 0 ? Math.round(totalDur / act) : 0,
        engagementRate: Number((met(row, 5) * 100).toFixed(1)),
        bounceRate: Number((met(row, 6) * 100).toFixed(1)),
        eventCount: met(row, 7),
        conversions: met(row, 8)
      });
    }
  }

  const totalSpan = diffDaysInclusive(filters.startDate, filters.endDate);
  const trends = Array.from({ length: totalSpan }).map((_, i) => {
    const date = shiftYmd(filters.startDate, i);
    const prevDate = shiftYmd(filters.prevStartDate, i);
    const c = currDays.get(date);
    const p = filters.compare ? prevDays.get(prevDate) : undefined;
    return {
      date,
      prevDate: filters.compare ? prevDate : null,
      activeUsers: c?.activeUsers ?? 0,
      newUsers: c?.newUsers ?? 0,
      sessions: c?.sessions ?? 0,
      pageViews: c?.pageViews ?? 0,
      engagementSeconds: c?.engagementSeconds ?? 0,
      engagementRate: c?.engagementRate ?? 0,
      bounceRate: c?.bounceRate ?? 0,
      eventCount: c?.eventCount ?? 0,
      conversions: c?.conversions ?? 0,
      prevActiveUsers: p?.activeUsers ?? (filters.compare ? 0 : null),
      prevSessions: p?.sessions ?? (filters.compare ? 0 : null),
      prevPageViews: p?.pageViews ?? (filters.compare ? 0 : null),
      prevConversions: p?.conversions ?? (filters.compare ? 0 : null)
    };
  });

  // Aggregate country list & city list
  const countryAgg = new Map<string, { country: string; countryCode: string; activeUsers: number; totalUsers: number; sessions: number; engWeighted: number }>();
  const cities: Array<{ city: string; country: string; countryCode: string; activeUsers: number; totalUsers: number; sessions: number; engagementRate: number }> = [];

  for (const row of r1[4]?.rows || []) {
    const country = dim(row, 0) || '(not set)';
    const countryCode = dim(row, 1) || '';
    const city = dim(row, 2) || '(not set)';
    const activeUsers = met(row, 0);
    const totalUsers = met(row, 1);
    const sessions = met(row, 2);
    const engagementRate = Number((met(row, 3) * 100).toFixed(1));

    if (city !== '(not set)') {
      cities.push({ city, country, countryCode, activeUsers, totalUsers, sessions, engagementRate });
    }
    const existing = countryAgg.get(country) || {
      country,
      countryCode,
      activeUsers: 0,
      totalUsers: 0,
      sessions: 0,
      engWeighted: 0
    };
    existing.activeUsers += activeUsers;
    existing.totalUsers += totalUsers;
    existing.sessions += sessions;
    existing.engWeighted += engagementRate * Math.max(1, sessions);
    countryAgg.set(country, existing);
  }

  const countries = Array.from(countryAgg.values())
    .map((c) => ({
      country: c.country,
      countryCode: c.countryCode,
      activeUsers: c.activeUsers,
      totalUsers: c.totalUsers,
      sessions: c.sessions,
      engagementRate: c.sessions > 0 ? Number((c.engWeighted / c.sessions).toFixed(1)) : 0
    }))
    .sort((a, b) => b.activeUsers - a.activeUsers);

  // Sources & Channels
  const channelAgg = new Map<string, { channel: string; sessions: number; activeUsers: number; conversions: number }>();
  const sources = (r2[0]?.rows || []).map((row) => {
    const channel = dim(row, 0) || 'Unassigned';
    const source = dim(row, 1) || '(direct)';
    const medium = dim(row, 2) || '(none)';
    const campaign = dim(row, 3) || '(not set)';
    const sessions = met(row, 0);
    const activeUsers = met(row, 1);
    const newUsers = met(row, 2);
    const engagementRate = Number((met(row, 3) * 100).toFixed(1));
    const bounceRate = Number((met(row, 4) * 100).toFixed(1));
    const conversions = met(row, 5);

    const ch = channelAgg.get(channel) || { channel, sessions: 0, activeUsers: 0, conversions: 0 };
    ch.sessions += sessions;
    ch.activeUsers += activeUsers;
    ch.conversions += conversions;
    channelAgg.set(channel, ch);

    return { channel, source, medium, campaign, sessions, activeUsers, newUsers, engagementRate, bounceRate, conversions };
  });

  const channels = Array.from(channelAgg.values()).sort((a, b) => b.sessions - a.sessions);

  const pages = (r2[1]?.rows || []).map((row) => {
    const path = dim(row, 0) || '/';
    const title = dim(row, 1) || path;
    const views = met(row, 0);
    const activeUsers = met(row, 1);
    const dur = met(row, 2);
    return {
      path,
      title,
      views,
      uniqueVisitors: activeUsers,
      avgEngagementSeconds: activeUsers > 0 ? Math.round(dur / activeUsers) : 0,
      engagementRate: Number((met(row, 3) * 100).toFixed(1)),
      bounceRate: Number((met(row, 4) * 100).toFixed(1))
    };
  });

  const landingPages = (r2[2]?.rows || []).map((row) => ({
    landingPage: dim(row, 0) || '/',
    sessions: met(row, 0),
    activeUsers: met(row, 1),
    engagementRate: Number((met(row, 2) * 100).toFixed(1)),
    bounceRate: Number((met(row, 3) * 100).toFixed(1)),
    conversions: met(row, 4)
  }));

  const events = (r2[3]?.rows || []).map((row) => ({
    eventName: dim(row, 0),
    eventCount: met(row, 0),
    users: met(row, 1),
    conversions: met(row, 2)
  }));

  const keyEvents = events.filter((e) => e.conversions > 0);

  const languages = (r2[4]?.rows || []).map((row) => ({
    language: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    totalUsers: met(row, 1),
    sessions: met(row, 2)
  }));

  const deviceCategories = (r3[0]?.rows || []).map((row) => ({
    device: dim(row, 0) || 'desktop',
    activeUsers: met(row, 0),
    sessions: met(row, 1),
    pageViews: met(row, 2),
    engagementRate: Number((met(row, 3) * 100).toFixed(1)),
    bounceRate: Number((met(row, 4) * 100).toFixed(1)),
    conversions: met(row, 5)
  }));

  const operatingSystems = (r3[1]?.rows || []).map((row) => ({
    os: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    sessions: met(row, 1)
  }));

  const browsers = (r3[2]?.rows || []).map((row) => ({
    browser: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    sessions: met(row, 1)
  }));

  const screenResolutions = (r3[3]?.rows || []).map((row) => ({
    resolution: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    sessions: met(row, 1)
  }));

  const result = {
    configured: true as const,
    measurementId: 'G-VNPQW61EYH',
    timezone: IST_TIMEZONE,
    lastUpdatedAt: new Date().toISOString(),
    range: {
      preset: filters.preset,
      startDate: filters.startDate,
      endDate: filters.endDate,
      prevStartDate: filters.compare ? filters.prevStartDate : null,
      prevEndDate: filters.compare ? filters.prevEndDate : null,
      compare: filters.compare
    },
    overview: {
      totalUsers: { value: currTotalUsers, prev: prevTotalUsers, delta: calcDeltaPercent(currTotalUsers, prevTotalUsers) },
      activeUsers: { value: currActiveUsers, prev: prevActiveUsers, delta: calcDeltaPercent(currActiveUsers, prevActiveUsers) },
      newUsers: { value: currNewUsers, prev: prevNewUsers, delta: calcDeltaPercent(currNewUsers, prevNewUsers) },
      returningUsers: { value: returningVal, prev: prevReturningVal, delta: calcDeltaPercent(returningVal, prevReturningVal) },
      sessions: { value: currSessions, prev: prevSessions, delta: calcDeltaPercent(currSessions, prevSessions) },
      pageViews: { value: currViews, prev: prevViews, delta: calcDeltaPercent(currViews, prevViews) },
      viewsPerSession: { value: currViewsPerSession, prev: prevViewsPerSession, delta: calcDeltaPercent(currViewsPerSession, prevViewsPerSession) },
      avgEngagementSeconds: { value: currAvgEngSeconds, prev: prevAvgEngSeconds, delta: calcDeltaPercent(currAvgEngSeconds, prevAvgEngSeconds) },
      engagementRate: { value: currEngagementRate, prev: prevEngagementRate, delta: calcDeltaPercent(currEngagementRate, prevEngagementRate) },
      bounceRate: { value: currBounceRate, prev: prevBounceRate, delta: calcDeltaPercent(currBounceRate, prevBounceRate) },
      eventCount: { value: currEventCount, prev: prevEventCount, delta: calcDeltaPercent(currEventCount, prevEventCount) },
      conversions: { value: currKeyEvents, prev: prevKeyEvents, delta: calcDeltaPercent(currKeyEvents, prevKeyEvents) }
    },
    trends,
    audience: {
      newUsers: currNewUsers,
      returningUsers: returningVal,
      languages
    },
    traffic: {
      channels,
      sources
    },
    pages: {
      topPages: pages,
      landingPages
    },
    devices: {
      categories: deviceCategories,
      operatingSystems,
      browsers,
      screenResolutions
    },
    engagement: {
      events
    },
    conversions: {
      totalConversions: currKeyEvents,
      keyEvents
    },
    geography: {
      countries,
      cities: cities.slice(0, 50)
    },
    filterOptions: {
      countries: countries.map((c) => c.country).filter((c) => c && c !== '(not set)').slice(0, 30),
      devices: ['desktop', 'mobile', 'tablet'],
      sources: Array.from(new Set(sources.map((s) => s.source).filter(Boolean))).slice(0, 30),
      landingPages: landingPages.map((l) => l.landingPage).filter(Boolean).slice(0, 30)
    }
  };

  apiCache.set(cacheKey, result, REPORT_CACHE_TTL_SECONDS);
  return result;
}

export async function fetchGa4RealtimeReport(forceRefresh = false) {
  const creds = resolveGa4Credentials();
  if (!creds) {
    return {
      configured: false as const,
      configStatus: getGa4ConfigStatus()
    };
  }

  const cacheKey = `ga4:realtime:${creds.propertyId}`;
  if (!forceRefresh) {
    const cached = apiCache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;
  }

  const accessToken = await getGa4AccessToken(creds);
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${creds.propertyId}:runRealtimeReport`;

  const [minutesRes, geoRes, pagesDevRes, eventsRes] = await Promise.all([
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'minutesAgo' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'eventCount' }, { name: 'keyEvents' }]
    }),
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 25
    }),
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'unifiedScreenName' }, { name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 30
    }),
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25
    })
  ]);

  const minuteMap = new Map<number, { activeUsers: number; pageViews: number; eventCount: number }>();
  let totalActive30Min = 0;
  let totalViews30Min = 0;
  let totalEvents30Min = 0;
  let totalConversions30Min = 0;

  for (const row of minutesRes.rows || []) {
    const minAgo = Number(dim(row, 0));
    const au = met(row, 0);
    const pv = met(row, 1);
    const ec = met(row, 2);
    const kc = met(row, 3);
    totalActive30Min += au;
    totalViews30Min += pv;
    totalEvents30Min += ec;
    totalConversions30Min += kc;
    if (!Number.isNaN(minAgo) && minAgo >= 0 && minAgo < 30) {
      minuteMap.set(minAgo, { activeUsers: au, pageViews: pv, eventCount: ec });
    }
  }

  // Overall active users across the 30m window from totals row if returned (prevents double counting multi-minute users)
  if (minutesRes.totals?.[0]) {
    totalActive30Min = met(minutesRes.totals[0], 0);
  }

  const perMinute = Array.from({ length: 30 }).map((_, idx) => {
    const minutesAgo = 29 - idx;
    const item = minuteMap.get(minutesAgo);
    return {
      minutesAgo,
      activeUsers: item?.activeUsers ?? 0,
      pageViews: item?.pageViews ?? 0,
      eventCount: item?.eventCount ?? 0
    };
  });

  // Aggregate pages and devices cleanly
  const pageAgg = new Map<string, { page: string; activeUsers: number; pageViews: number }>();
  const deviceAgg = new Map<string, number>();
  for (const row of pagesDevRes.rows || []) {
    const page = dim(row, 0) || '/';
    const device = dim(row, 1) || 'desktop';
    const au = met(row, 0);
    const pv = met(row, 1);

    const pEntry = pageAgg.get(page) || { page, activeUsers: 0, pageViews: 0 };
    pEntry.activeUsers += au;
    pEntry.pageViews += pv;
    pageAgg.set(page, pEntry);

    deviceAgg.set(device, (deviceAgg.get(device) || 0) + au);
  }

  const locations = (geoRes.rows || []).map((row) => ({
    country: dim(row, 0) || '(not set)',
    city: dim(row, 1) || '(not set)',
    activeUsers: met(row, 0)
  }));

  const result = {
    configured: true as const,
    measurementId: 'G-VNPQW61EYH',
    timezone: IST_TIMEZONE,
    lastUpdatedAt: new Date().toISOString(),
    summary: {
      activeUsersLast30Min: totalActive30Min,
      pageViewsLast30Min: totalViews30Min,
      eventsLast30Min: totalEvents30Min,
      conversionsLast30Min: totalConversions30Min
    },
    perMinute,
    locations,
    activePages: Array.from(pageAgg.values()).sort((a, b) => b.activeUsers - a.activeUsers),
    devices: Array.from(deviceAgg.entries())
      .map(([device, activeUsers]) => ({ device, activeUsers }))
      .sort((a, b) => b.activeUsers - a.activeUsers),
    events: (eventsRes.rows || []).map((row) => ({
      eventName: dim(row, 0),
      eventCount: met(row, 0)
    }))
  };

  apiCache.set(cacheKey, result, REALTIME_CACHE_TTL_SECONDS);
  return result;
}
