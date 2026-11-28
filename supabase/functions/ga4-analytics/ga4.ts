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

interface Ga4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

interface Ga4ReportResponse {
  rows?: Ga4Row[];
  totals?: Ga4Row[];
}

export class Ga4EdgeError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 502, code = 'GA4_API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const IST_TIMEZONE = 'Asia/Kolkata';
const ALLOWED_PRESETS = new Set<DateRangePreset>(['today', 'yesterday', '7d', '28d', '30d', '90d', 'custom']);
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().slice(0, 10);
}

function diffDaysInclusive(startYmd: string, endYmd: string): number {
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  return Math.floor((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000) + 1;
}

export function validateAndResolveQuery(params: URLSearchParams, referenceDate = new Date()): AnalyticsQueryFilters {
  const rawPreset = (params.get('preset') || '28d') as DateRangePreset;
  if (!ALLOWED_PRESETS.has(rawPreset)) {
    throw new Ga4EdgeError('Unsupported date range preset.', 400, 'INVALID_DATE_PRESET');
  }

  const istToday = formatIstYmd(referenceDate);
  let startDate = istToday;
  let endDate = istToday;

  switch (rawPreset) {
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
      const s = (params.get('startDate') || '').trim();
      const e = (params.get('endDate') || '').trim();
      if (!YMD_RE.test(s) || !YMD_RE.test(e)) {
        throw new Ga4EdgeError('Custom date range requires YYYY-MM-DD startDate and endDate.', 400, 'INVALID_CUSTOM_RANGE');
      }
      if (s > e) {
        throw new Ga4EdgeError('Start date cannot be after end date.', 400, 'INVALID_DATE_ORDER');
      }
      if (s < '2020-01-01' || e > istToday) {
        throw new Ga4EdgeError('Custom date range is out of allowed bounds.', 400, 'DATE_OUT_OF_BOUNDS');
      }
      if (diffDaysInclusive(s, e) > 366) {
        throw new Ga4EdgeError('Custom date range cannot exceed 366 days.', 400, 'DATE_SPAN_TOO_LARGE');
      }
      startDate = s;
      endDate = e;
      break;
    }
  }

  const span = diffDaysInclusive(startDate, endDate);
  const prevEndDate = shiftYmd(startDate, -1);
  const prevStartDate = shiftYmd(prevEndDate, -(span - 1));
  const compare = (params.get('compare') ?? 'true') !== 'false';

  const country = (params.get('country') || '').trim().slice(0, 200);
  const device = (params.get('device') || '').trim().toLowerCase().slice(0, 32);
  if (device && !['desktop', 'mobile', 'tablet'].includes(device)) {
    throw new Ga4EdgeError('Device filter must be desktop, mobile, or tablet.', 400, 'INVALID_DEVICE_FILTER');
  }
  const source = (params.get('source') || '').trim().slice(0, 200);
  const landingPage = (params.get('landingPage') || '').trim().slice(0, 200);

  return {
    preset: rawPreset,
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

function buildGa4DimensionFilter(filters: AnalyticsQueryFilters) {
  const expressions: Array<Record<string, unknown>> = [];
  if (filters.country) {
    expressions.push({ filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: filters.country } } });
  }
  if (filters.device) {
    expressions.push({ filter: { fieldName: 'deviceCategory', stringFilter: { matchType: 'EXACT', value: filters.device } } });
  }
  if (filters.source) {
    expressions.push({ filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'EXACT', value: filters.source } } });
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

async function callGa4Json<T>(url: string, accessToken: string, payload: Record<string, unknown>, attempt = 0): Promise<T> {
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
    if (resp.status === 401 || errStatus === 'UNAUTHENTICATED') {
      throw new Ga4EdgeError('Google OAuth access expired or revoked. Reconnect Google Analytics.', 401, 'GA4_REAUTH_REQUIRED');
    }
    if (resp.status === 429 || errStatus === 'RESOURCE_EXHAUSTED') {
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 1200));
        return await callGa4Json<T>(url, accessToken, payload, attempt + 1);
      }
      throw new Ga4EdgeError(`Google Analytics Data API quota limit reached (${errMsg}). Please wait 60 seconds and refresh.`, 429, 'GA4_QUOTA_EXCEEDED');
    }
    if (resp.status === 403 || errStatus === 'PERMISSION_DENIED') {
      throw new Ga4EdgeError(
        'Signed-in Google account lacks Viewer permission on this GA4 Property ID, or Analytics Data API is disabled.',
        403,
        'GA4_PERMISSION_DENIED'
      );
    }
    throw new Ga4EdgeError(errMsg, resp.status >= 400 && resp.status < 500 ? 400 : 502, errStatus || 'GA4_API_ERROR');
  }

  return json;
}

const num = (v?: string): number => Number(v || 0) || 0;
const dim = (row: Ga4Row, idx: number): string => String(row.dimensionValues?.[idx]?.value || '');
const met = (row: Ga4Row, idx: number): number => num(row.metricValues?.[idx]?.value);

function calcDelta(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatGaDateYmd(raw: string): string {
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
}

export async function queryGa4CoreReports(
  propertyId: string,
  accessToken: string,
  filters: AnalyticsQueryFilters
) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`;
  const dimensionFilter = buildGa4DimensionFilter(filters);

  const dateRanges = filters.compare
    ? [
        { startDate: filters.startDate, endDate: filters.endDate },
        { startDate: filters.prevStartDate, endDate: filters.prevEndDate }
      ]
    : [{ startDate: filters.startDate, endDate: filters.endDate }];

  const currOnlyRange = [{ startDate: filters.startDate, endDate: filters.endDate }];
  const withFilter = (req: Record<string, unknown>) => (dimensionFilter ? { ...req, dimensionFilter } : req);

  // 2 sequential batches (5 + 5 = 10 reports max, <= 5 concurrent requests to respect GA4 quotas)
  // Batch 1: Overview (10 metrics in 1 req), newVsReturning, Daily Trend, Geo, Languages
  const b1 = await callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
      requests: [
        withFilter({
          dateRanges,
          metrics: [
            { name: 'totalUsers' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'userEngagementDuration' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
            { name: 'eventCount' },
            { name: 'keyEvents' }
          ]
        }),
        withFilter({
          dateRanges,
          dimensions: [{ name: 'newVsReturning' }],
          metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }]
        }),
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
        withFilter({
          dateRanges: currOnlyRange,
          dimensions: [{ name: 'country' }, { name: 'countryId' }, { name: 'city' }],
          metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }, { name: 'engagementRate' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 50
        }),
        withFilter({
          dateRanges: currOnlyRange,
          dimensions: [{ name: 'language' }],
          metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }, { name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 15
        })
      ]
    });

  // Batch 2: Sources, Top Pages, Landing Pages, Events, Device+OS+Browser (combined)
  const b2 = await callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
      requests: [
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
          limit: 45
        }),
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
          limit: 40
        }),
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
          limit: 30
        }),
        withFilter({
          dateRanges: currOnlyRange,
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 40
        }),
        withFilter({
          dateRanges: currOnlyRange,
          dimensions: [{ name: 'deviceCategory' }, { name: 'operatingSystem' }, { name: 'browser' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
            { name: 'keyEvents' }
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 45
        })
      ]
    });

  // Batch 3 (1 tiny report for screen resolutions)
  const b3 = await callGa4Json<{ reports?: Ga4ReportResponse[] }>(endpoint, accessToken, {
      requests: [
        withFilter({
          dateRanges: currOnlyRange,
          dimensions: [{ name: 'screenResolution' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 15
        })
      ]
    });

  const r1 = b1.reports || [];
  const r2 = b2.reports || [];
  const r3 = b3.reports || [];

  const extractRangeRow = (rep: Ga4ReportResponse | undefined, rangeIdx: number) => {
    const rows = rep?.rows || [];
    if (!filters.compare) return rows[0] || rep?.totals?.[0];
    const targetTag = rangeIdx === 0 ? 'date_range_0' : 'date_range_1';
    return rows.find((r) => dim(r, 0) === targetTag) || rows[rangeIdx];
  };

  const ovCurr = extractRangeRow(r1[0], 0);
  const ovPrev = filters.compare ? extractRangeRow(r1[0], 1) : undefined;

  let currReturning = 0;
  let prevReturning = 0;
  for (const row of r1[1]?.rows || []) {
    if (filters.compare) {
      if (dim(row, 0) === 'returning' && dim(row, 1) === 'date_range_0') currReturning += met(row, 0);
      if (dim(row, 0) === 'returning' && dim(row, 1) === 'date_range_1') prevReturning += met(row, 0);
    } else if (dim(row, 0) === 'returning') {
      currReturning += met(row, 0);
    }
  }

  const currTotalUsers = ovCurr ? met(ovCurr, 0) : 0;
  const prevTotalUsers = ovPrev ? met(ovPrev, 0) : null;
  const currActiveUsers = ovCurr ? met(ovCurr, 1) : 0;
  const prevActiveUsers = ovPrev ? met(ovPrev, 1) : null;
  const currNewUsers = ovCurr ? met(ovCurr, 2) : 0;
  const prevNewUsers = ovPrev ? met(ovPrev, 2) : null;
  const currSessions = ovCurr ? met(ovCurr, 3) : 0;
  const prevSessions = ovPrev ? met(ovPrev, 3) : null;
  const currViews = ovCurr ? met(ovCurr, 4) : 0;
  const prevViews = ovPrev ? met(ovPrev, 4) : null;
  const currViewsPerSession = currSessions > 0 ? Number((currViews / currSessions).toFixed(2)) : 0;
  const prevViewsPerSession =
    filters.compare && prevSessions !== null ? (prevSessions > 0 ? Number(((prevViews || 0) / prevSessions).toFixed(2)) : 0) : null;
  const currEngDurationTotal = ovCurr ? met(ovCurr, 5) : 0;
  const prevEngDurationTotal = ovPrev ? met(ovPrev, 5) : 0;
  const currAvgEngSeconds = currActiveUsers > 0 ? Math.round(currEngDurationTotal / currActiveUsers) : 0;
  const prevAvgEngSeconds =
    prevActiveUsers && prevActiveUsers > 0 ? Math.round(prevEngDurationTotal / prevActiveUsers) : filters.compare ? 0 : null;
  const currEngagementRate = ovCurr ? Number((met(ovCurr, 6) * 100).toFixed(1)) : 0;
  const prevEngagementRate = ovPrev ? Number((met(ovPrev, 6) * 100).toFixed(1)) : null;

  const currBounceRate = ovCurr ? Number((met(ovCurr, 7) * 100).toFixed(1)) : 0;
  const prevBounceRate = ovPrev ? Number((met(ovPrev, 7) * 100).toFixed(1)) : null;
  const currEventCount = ovCurr ? met(ovCurr, 8) : 0;
  const prevEventCount = ovPrev ? met(ovPrev, 8) : null;
  const currKeyEvents = ovCurr ? met(ovCurr, 9) : 0;
  const prevKeyEvents = ovPrev ? met(ovPrev, 9) : null;

  const returningVal = currReturning || Math.max(0, currTotalUsers - currNewUsers);
  const prevReturningVal = filters.compare
    ? prevReturning || Math.max(0, (prevTotalUsers || 0) - (prevNewUsers || 0))
    : null;

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

  for (const row of r1[2]?.rows || []) {
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
      currDays.set(rawDate, {
        date: rawDate,
        activeUsers: act,
        newUsers: met(row, 1),
        sessions: met(row, 2),
        pageViews: met(row, 3),
        engagementSeconds: act > 0 ? Math.round(met(row, 4) / act) : 0,
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

  const countryAgg = new Map<
    string,
    { country: string; countryCode: string; activeUsers: number; totalUsers: number; sessions: number; engWeighted: number }
  >();
  const cities: Array<{
    city: string;
    country: string;
    countryCode: string;
    activeUsers: number;
    totalUsers: number;
    sessions: number;
    engagementRate: number;
  }> = [];

  for (const row of r1[3]?.rows || []) {
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
    return {
      path,
      title,
      views,
      uniqueVisitors: activeUsers,
      avgEngagementSeconds: activeUsers > 0 ? Math.round(met(row, 2) / activeUsers) : 0,
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

  const languages = (r1[4]?.rows || []).map((row) => ({
    language: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    totalUsers: met(row, 1),
    sessions: met(row, 2)
  }));

  const devAgg = new Map<string, { device: string; activeUsers: number; sessions: number; pageViews: number; engWeighted: number; bounceWeighted: number; conversions: number }>();
  const osAgg = new Map<string, { os: string; activeUsers: number; sessions: number }>();
  const brAgg = new Map<string, { browser: string; activeUsers: number; sessions: number }>();

  for (const row of r2[4]?.rows || []) {
    const device = dim(row, 0) || 'desktop';
    const os = dim(row, 1) || 'Unknown';
    const browser = dim(row, 2) || 'Unknown';
    const activeUsers = met(row, 0);
    const sessions = met(row, 1);
    const pageViews = met(row, 2);
    const engRate = met(row, 3) * 100;
    const bounceRate = met(row, 4) * 100;
    const conversions = met(row, 5);

    const d = devAgg.get(device) || { device, activeUsers: 0, sessions: 0, pageViews: 0, engWeighted: 0, bounceWeighted: 0, conversions: 0 };
    d.activeUsers += activeUsers;
    d.sessions += sessions;
    d.pageViews += pageViews;
    d.engWeighted += engRate * Math.max(1, sessions);
    d.bounceWeighted += bounceRate * Math.max(1, sessions);
    d.conversions += conversions;
    devAgg.set(device, d);

    const o = osAgg.get(os) || { os, activeUsers: 0, sessions: 0 };
    o.activeUsers += activeUsers;
    o.sessions += sessions;
    osAgg.set(os, o);

    const b = brAgg.get(browser) || { browser, activeUsers: 0, sessions: 0 };
    b.activeUsers += activeUsers;
    b.sessions += sessions;
    brAgg.set(browser, b);
  }

  const deviceCategories = Array.from(devAgg.values())
    .map((d) => ({
      device: d.device,
      activeUsers: d.activeUsers,
      sessions: d.sessions,
      pageViews: d.pageViews,
      engagementRate: d.sessions > 0 ? Number((d.engWeighted / d.sessions).toFixed(1)) : 0,
      bounceRate: d.sessions > 0 ? Number((d.bounceWeighted / d.sessions).toFixed(1)) : 0,
      conversions: d.conversions
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const operatingSystems = Array.from(osAgg.values()).sort((a, b) => b.sessions - a.sessions).slice(0, 15);
  const browsers = Array.from(brAgg.values()).sort((a, b) => b.sessions - a.sessions).slice(0, 15);

  const screenResolutions = (r3[0]?.rows || []).map((row) => ({
    resolution: dim(row, 0) || 'Unknown',
    activeUsers: met(row, 0),
    sessions: met(row, 1)
  }));

  return {
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
      totalUsers: { value: currTotalUsers, prev: prevTotalUsers, delta: calcDelta(currTotalUsers, prevTotalUsers) },
      activeUsers: { value: currActiveUsers, prev: prevActiveUsers, delta: calcDelta(currActiveUsers, prevActiveUsers) },
      newUsers: { value: currNewUsers, prev: prevNewUsers, delta: calcDelta(currNewUsers, prevNewUsers) },
      returningUsers: { value: returningVal, prev: prevReturningVal, delta: calcDelta(returningVal, prevReturningVal) },
      sessions: { value: currSessions, prev: prevSessions, delta: calcDelta(currSessions, prevSessions) },
      pageViews: { value: currViews, prev: prevViews, delta: calcDelta(currViews, prevViews) },
      viewsPerSession: { value: currViewsPerSession, prev: prevViewsPerSession, delta: calcDelta(currViewsPerSession, prevViewsPerSession) },
      avgEngagementSeconds: { value: currAvgEngSeconds, prev: prevAvgEngSeconds, delta: calcDelta(currAvgEngSeconds, prevAvgEngSeconds) },
      engagementRate: { value: currEngagementRate, prev: prevEngagementRate, delta: calcDelta(currEngagementRate, prevEngagementRate) },
      bounceRate: { value: currBounceRate, prev: prevBounceRate, delta: calcDelta(currBounceRate, prevBounceRate) },
      eventCount: { value: currEventCount, prev: prevEventCount, delta: calcDelta(currEventCount, prevEventCount) },
      conversions: { value: currKeyEvents, prev: prevKeyEvents, delta: calcDelta(currKeyEvents, prevKeyEvents) }
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
}

export async function queryGa4RealtimeReport(propertyId: string, accessToken: string) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;

  const [minutesRes, geoRes] = await Promise.all([
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'minutesAgo' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'eventCount' }, { name: 'keyEvents' }]
    }),
    callGa4Json<Ga4ReportResponse>(endpoint, accessToken, {
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 25
    })
  ]);
  const [pagesDevRes, eventsRes] = await Promise.all([
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

  return {
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
}
