import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Globe2,
  Laptop,
  Link2,
  Loader2,
  MousePointerClick,
  Radio,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Unlink,
  Users,
  X
} from 'lucide-react';
import { callGa4Edge, Ga4EdgeApiError } from '../lib/ga4Edge';
import { useAdminUi } from '../lib/admin-ui';
import { AnalyticsSkeleton } from '../components/PageSkeletons';
import {
  DonutChartCard,
  HorizontalBarList,
  RealtimeMinuteChart,
  TrendLineChart,
  formatIstShortDate
} from '../components/analytics/AnalyticsCharts';
import { WorldVisitorMap } from '../components/analytics/WorldVisitorMap';

type AnalyticsTab =
  | 'overview'
  | 'realtime'
  | 'audience'
  | 'traffic'
  | 'pages'
  | 'devices'
  | 'engagement'
  | 'conversions'
  | 'geography';

type DatePreset = 'today' | 'yesterday' | '7d' | '28d' | '30d' | '90d' | 'custom';

interface MetricSummary {
  value: number;
  prev: number | null;
  delta: number | null;
}

interface ConfigStatusPayload {
  configured: false;
  configStatus: {
    configured: boolean;
    oauthMode?: boolean;
    secretsReady?: boolean;
    migrationRequired?: boolean;
    hasClientId?: boolean;
    hasClientSecret?: boolean;
    hasPropertyId: boolean;
    connected?: boolean;
    redirectUri?: string;
    measurementId: string;
    timezone: string;
  };
}

interface CoreReportPayload {
  configured: true;
  measurementId: string;
  timezone: string;
  lastUpdatedAt: string;
  range: {
    preset: DatePreset;
    startDate: string;
    endDate: string;
    prevStartDate: string | null;
    prevEndDate: string | null;
    compare: boolean;
  };
  overview: {
    totalUsers: MetricSummary;
    activeUsers: MetricSummary;
    newUsers: MetricSummary;
    returningUsers: MetricSummary;
    sessions: MetricSummary;
    pageViews: MetricSummary;
    viewsPerSession: MetricSummary;
    avgEngagementSeconds: MetricSummary;
    engagementRate: MetricSummary;
    bounceRate: MetricSummary;
    eventCount: MetricSummary;
    conversions: MetricSummary;
  };
  trends: Array<{
    date: string;
    prevDate: string | null;
    activeUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    engagementSeconds: number;
    engagementRate: number;
    bounceRate: number;
    eventCount: number;
    conversions: number;
    prevActiveUsers: number | null;
    prevSessions: number | null;
    prevPageViews: number | null;
    prevConversions: number | null;
  }>;
  audience: {
    newUsers: number;
    returningUsers: number;
    languages: Array<{ language: string; activeUsers: number; totalUsers: number; sessions: number }>;
  };
  traffic: {
    channels: Array<{ channel: string; sessions: number; activeUsers: number; conversions: number }>;
    sources: Array<{
      channel: string;
      source: string;
      medium: string;
      campaign: string;
      sessions: number;
      activeUsers: number;
      newUsers: number;
      engagementRate: number;
      bounceRate: number;
      conversions: number;
    }>;
  };
  pages: {
    topPages: Array<{
      path: string;
      title: string;
      views: number;
      uniqueVisitors: number;
      avgEngagementSeconds: number;
      engagementRate: number;
      bounceRate: number;
    }>;
    landingPages: Array<{
      landingPage: string;
      sessions: number;
      activeUsers: number;
      engagementRate: number;
      bounceRate: number;
      conversions: number;
    }>;
  };
  devices: {
    categories: Array<{
      device: string;
      activeUsers: number;
      sessions: number;
      pageViews: number;
      engagementRate: number;
      bounceRate: number;
      conversions: number;
    }>;
    operatingSystems: Array<{ os: string; activeUsers: number; sessions: number }>;
    browsers: Array<{ browser: string; activeUsers: number; sessions: number }>;
    screenResolutions: Array<{ resolution: string; activeUsers: number; sessions: number }>;
  };
  engagement: {
    events: Array<{ eventName: string; eventCount: number; users: number; conversions: number }>;
  };
  conversions: {
    totalConversions: number;
    keyEvents: Array<{ eventName: string; eventCount: number; users: number; conversions: number }>;
  };
  geography: {
    countries: Array<{
      country: string;
      countryCode: string;
      activeUsers: number;
      totalUsers: number;
      sessions: number;
      engagementRate: number;
    }>;
    cities: Array<{
      city: string;
      country: string;
      countryCode: string;
      activeUsers: number;
      totalUsers: number;
      sessions: number;
      engagementRate: number;
    }>;
  };
  filterOptions: {
    countries: string[];
    devices: string[];
    sources: string[];
    landingPages: string[];
  };
}

interface RealtimePayload {
  configured: boolean;
  lastUpdatedAt?: string;
  summary?: {
    activeUsersLast30Min: number;
    pageViewsLast30Min: number;
    eventsLast30Min: number;
    conversionsLast30Min: number;
  };
  perMinute?: Array<{ minutesAgo: number; activeUsers: number; pageViews: number; eventCount: number }>;
  locations?: Array<{ country: string; city: string; activeUsers: number }>;
  activePages?: Array<{ page: string; activeUsers: number; pageViews: number }>;
  devices?: Array<{ device: string; activeUsers: number }>;
  events?: Array<{ eventName: string; eventCount: number }>;
}

function formatDurationSeconds(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (mins === 0) return `${rem}s`;
  return `${mins}m ${rem}s`;
}

function formatIstTimestamp(iso?: string): string {
  if (!iso) return '—';
  return (
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date(iso)) + ' IST'
  );
}

function getTodayIstYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const esc = (cell: string | number) => {
    const str = String(cell ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CLIENT_REPORT_CACHE = new Map<string, { data: CoreReportPayload | ConfigStatusPayload; expiresAt: number }>();

export function AnalyticsPage({
  onNotify,
  userRole
}: {
  onNotify: (msg: string, isErr?: boolean) => void;
  userRole?: string;
}) {
  const { tr } = useAdminUi();
  const canManageOAuth = userRole === 'super_admin' || userRole === 'admin';
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [disconnectingOAuth, setDisconnectingOAuth] = useState(false);

  // Filter & Range state
  const [preset, setPreset] = useState<DatePreset>('28d');
  const todayIst = getTodayIstYmd();
  const [customStart, setCustomStart] = useState(todayIst);
  const [customEnd, setCustomEnd] = useState(todayIst);
  const [compare, setCompare] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [landingPageFilter, setLandingPageFilter] = useState('');

  // Overview Trend selector
  const [trendMetric, setTrendMetric] = useState<'activeUsers' | 'sessions' | 'pageViews' | 'conversions'>('activeUsers');

  // Core data state
  const [report, setReport] = useState<CoreReportPayload | ConfigStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Realtime state
  const [realtime, setRealtime] = useState<RealtimePayload | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [rtError, setRtError] = useState('');
  const [autoRefreshRt, setAutoRefreshRt] = useState(true);

  const activeFilterCount = [countryFilter, deviceFilter, sourceFilter, landingPageFilter].filter(Boolean).length;

  async function loadReports(forceRefresh = false) {
    if (preset === 'custom' && (!customStart || !customEnd || customStart > customEnd)) {
      setError(tr('Select a valid custom date range (start date before end date).', 'சரியான தேதியைத் தேர்ந்தெடுங்க.'));
      return;
    }
    if (forceRefresh) setRefreshing(true);
    else if (!report) setLoading(true);
    setError('');

    try {
      const q = new URLSearchParams({
        preset,
        compare: String(compare)
      });
      if (preset === 'custom') {
        q.set('startDate', customStart);
        q.set('endDate', customEnd);
      }
      if (countryFilter) q.set('country', countryFilter);
      if (deviceFilter) q.set('device', deviceFilter);
      if (sourceFilter) q.set('source', sourceFilter);
      if (landingPageFilter) q.set('landingPage', landingPageFilter);

      const cacheKey = q.toString();
      if (!forceRefresh) {
        const cached = CLIENT_REPORT_CACHE.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          setReport(cached.data);
          return;
        }
      } else {
        CLIENT_REPORT_CACHE.clear();
        q.set('refresh', 'true');
      }

      const res = await callGa4Edge<CoreReportPayload | ConfigStatusPayload>(`/reports?${q.toString()}`);
      if (res.configured) {
        CLIENT_REPORT_CACHE.set(cacheKey, { data: res, expiresAt: Date.now() + 600_000 });
      }
      setReport(res);
    } catch (err) {
      if (err instanceof Ga4EdgeApiError && (err.code === 'GA4_REAUTH_REQUIRED' || err.code === 'GA4_NOT_CONNECTED')) {
        try {
          const st = await callGa4Edge<{
            secretsReady: boolean;
            migrationRequired: boolean;
            hasClientId: boolean;
            hasClientSecret: boolean;
            hasPropertyId: boolean;
            connected: boolean;
            redirectUri: string;
            measurementId: string;
            timezone: string;
          }>('/status');
          setReport({
            configured: false,
            configStatus: { ...st, configured: false, oauthMode: true }
          });
          setError(err.message);
          return;
        } catch {
          // fall through to standard error handling
        }
      }
      const msg = err instanceof Error ? err.message : tr('Unable to load Google Analytics reports.', 'அனலிடிக்ஸ் விவரம் லோடு ஆகலைங்க.');
      setError(msg);
      onNotify(msg, true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleConnectOAuth() {
    setConnectingOAuth(true);
    try {
      const res = await callGa4Edge<{ authUrl: string }>('/oauth/start', {
        method: 'POST',
        body: { returnOrigin: window.location.origin }
      });
      window.location.href = res.authUrl;
    } catch (err) {
      setConnectingOAuth(false);
      onNotify(
        err instanceof Error ? err.message : tr('Unable to start Google OAuth flow.', 'கூகுள் அனுமதி தொடங்க முடியலைங்க.'),
        true
      );
    }
  }

  async function handleDisconnectOAuth() {
    if (!confirm(tr('Disconnect Google Analytics 4 OAuth connection?', 'கூகுள் அனலிடிக்ஸ் இணைப்பைத் துண்டிக்கலாமா?'))) return;
    setDisconnectingOAuth(true);
    try {
      await callGa4Edge('/disconnect', { method: 'POST' });
      CLIENT_REPORT_CACHE.clear();
      onNotify(tr('Google Analytics disconnected.', 'கூகுள் அனலிடிக்ஸ் துண்டிக்கப்பட்டது.'));
      await loadReports(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to disconnect.', 'துண்டிக்க முடியலைங்க.'), true);
    } finally {
      setDisconnectingOAuth(false);
    }
  }

  async function loadRealtime(forceRefresh = false) {
    setRtLoading(true);
    setRtError('');
    try {
      const q = forceRefresh ? '?refresh=true' : '';
      const res = await callGa4Edge<RealtimePayload>(`/realtime${q}`);
      setRealtime(res);
    } catch (err) {
      setRtError(err instanceof Error ? err.message : tr('Unable to fetch realtime analytics.', 'லைவ் விவரம் வரலைங்க.'));
    } finally {
      setRtLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('ga4_connected') === '1') {
        onNotify(tr('Google Analytics 4 connected successfully via OAuth 2.0!', 'கூகுள் அனலிடிக்ஸ் (GA4) வெற்றிகரமா இணைக்கப்பட்டது!'));
        window.history.replaceState(null, '', '/analytics');
      } else if (sp.get('ga4_error')) {
        const errCode = sp.get('ga4_error') || 'oauth_failed';
        onNotify(tr(`Google Analytics connection failed: ${errCode}`, `இணைப்பு தோல்வி: ${errCode}`), true);
        window.history.replaceState(null, '', '/analytics');
      }
    }
  }, []);

  useEffect(() => {
    if (preset === 'custom') return;
    loadReports(false);
  }, [preset, compare, countryFilter, deviceFilter, sourceFilter, landingPageFilter]);

  useEffect(() => {
    if (activeTab !== 'realtime' || !report?.configured) return;
    loadRealtime(false);
    if (!autoRefreshRt) return;
    const timer = window.setInterval(() => loadRealtime(true), 30_000);
    return () => window.clearInterval(timer);
  }, [activeTab, autoRefreshRt, report?.configured]);

  const trendPoints = useMemo(() => {
    if (!report || !report.configured) return [];
    return report.trends.map((t) => ({
      date: t.date,
      prevDate: t.prevDate,
      value: t[trendMetric],
      prevValue:
        trendMetric === 'activeUsers'
          ? t.prevActiveUsers
          : trendMetric === 'sessions'
          ? t.prevSessions
          : trendMetric === 'pageViews'
          ? t.prevPageViews
          : t.prevConversions
    }));
  }, [report, trendMetric]);

  function handleExportCsv() {
    if (!report || !report.configured) return;
    const tag = `${report.range.startDate}_to_${report.range.endDate}`;

    switch (activeTab) {
      case 'traffic':
        downloadCsv(
          `analytics-traffic-${tag}.csv`,
          ['Channel', 'Source', 'Medium', 'Campaign', 'Sessions', 'Active Users', 'New Users', 'Engagement Rate (%)', 'Bounce Rate (%)', 'Key Events'],
          report.traffic.sources.map((s) => [
            s.channel, s.source, s.medium, s.campaign, s.sessions, s.activeUsers, s.newUsers, s.engagementRate, s.bounceRate, s.conversions
          ])
        );
        break;
      case 'pages':
        downloadCsv(
          `analytics-pages-${tag}.csv`,
          ['Page Path', 'Page Title', 'Page Views', 'Unique Visitors', 'Avg Engagement (s)', 'Engagement Rate (%)', 'Bounce Rate (%)'],
          report.pages.topPages.map((p) => [
            p.path, p.title, p.views, p.uniqueVisitors, p.avgEngagementSeconds, p.engagementRate, p.bounceRate
          ])
        );
        break;
      case 'devices':
        downloadCsv(
          `analytics-devices-${tag}.csv`,
          ['Device Category', 'Active Users', 'Sessions', 'Page Views', 'Engagement Rate (%)', 'Bounce Rate (%)', 'Key Events'],
          report.devices.categories.map((d) => [
            d.device, d.activeUsers, d.sessions, d.pageViews, d.engagementRate, d.bounceRate, d.conversions
          ])
        );
        break;
      case 'engagement':
        downloadCsv(
          `analytics-events-${tag}.csv`,
          ['Event Name', 'Event Count', 'Users', 'Key Events'],
          report.engagement.events.map((e) => [e.eventName, e.eventCount, e.users, e.conversions])
        );
        break;
      case 'conversions':
        downloadCsv(
          `analytics-conversions-${tag}.csv`,
          ['Key Event', 'Conversions', 'Total Events', 'Users'],
          report.conversions.keyEvents.map((k) => [k.eventName, k.conversions, k.eventCount, k.users])
        );
        break;
      case 'geography':
      case 'audience':
        downloadCsv(
          `analytics-geography-${tag}.csv`,
          ['Country', 'Country Code', 'Active Users', 'Total Users', 'Sessions', 'Engagement Rate (%)'],
          report.geography.countries.map((c) => [
            c.country, c.countryCode, c.activeUsers, c.totalUsers, c.sessions, c.engagementRate
          ])
        );
        break;
      default:
        downloadCsv(
          `analytics-overview-trend-${tag}.csv`,
          ['Date (IST)', 'Active Users', 'New Users', 'Sessions', 'Page Views', 'Engagement Rate (%)', 'Bounce Rate (%)', 'Events', 'Key Events'],
          report.trends.map((t) => [
            t.date, t.activeUsers, t.newUsers, t.sessions, t.pageViews, t.engagementRate, t.bounceRate, t.eventCount, t.conversions
          ])
        );
    }
    onNotify(tr('Report exported to CSV.', 'ரிப்போர்ட் CSV ஃபைலா டவுன்லோட் ஆச்சுங்க.'));
  }

  if (loading && !report) {
    return <AnalyticsSkeleton />;
  }

  // Disconnected / Not Configured State (Google OAuth 2.0 via Supabase Edge Function)
  if (report && !report.configured) {
    const cs = report.configStatus;
    const secretsReady = Boolean(cs.secretsReady);
    const canStartOAuth = canManageOAuth && secretsReady && !cs.migrationRequired;

    return (
      <div className="space-y-4">
        <div className="admin-card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                  {tr('Connect Google Analytics 4 (OAuth 2.0)', 'கூகுள் அனலிடிக்ஸ் (GA4) இணைப்பு')}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {tr(
                    `Website tracking tag ${cs.measurementId} is active. Authorize your Google Analytics account securely via Supabase Edge Functions to view live reports.`,
                    `வெப்சைட்ல ${cs.measurementId} டிராக்கிங் ரெடியா இருக்கு. இங்க லைவ் ரிப்போர்ட் பார்க்க உங்க கூகுள் அக்கவுண்ட்டை பாதுகாப்பா இணைங்க.`
                  )}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
              {cs.migrationRequired
                ? tr('Migration Required', 'டேபிள் அப்டேட் தேவை')
                : secretsReady
                ? tr('Ready to Authorize', 'இணைக்கத் தயார்')
                : tr('Edge Secrets Needed', 'சீக்ரெட்ஸ் தேவை')}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { name: 'GOOGLE_CLIENT_ID', ok: Boolean(cs.hasClientId), desc: tr('Google OAuth Web Application Client ID', 'கூகுள் OAuth கிளையண்ட் ஐடி') },
              { name: 'GOOGLE_CLIENT_SECRET', ok: Boolean(cs.hasClientSecret), desc: tr('Stored securely in Supabase Edge Secrets', 'சீக்ரெட் சுப்பபேஸ்ல பாதுகாப்பா இருக்கு') },
              { name: 'GA4_PROPERTY_ID', ok: Boolean(cs.hasPropertyId), desc: tr('Numeric GA4 Property ID (digits only)', 'GA4 ப்ராப்பர்ட்டி நம்பர்') }
            ].map((item) => (
              <div key={item.name} className="admin-subcard flex items-start gap-2.5">
                {item.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {cs.migrationRequired && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
              {tr(
                'Run supabase/migrations/v016_ga4_oauth_tokens.sql in Supabase SQL Editor first to create the encrypted OAuth token store.',
                'முதல்ல சுப்பபேஸ் SQL எடிட்டர்ல v016_ga4_oauth_tokens.sql ரன் பண்ணுங்க.'
              )}
            </div>
          )}

          {cs.redirectUri && (
            <div className="admin-subcard space-y-2 text-xs">
              <p className="font-bold text-slate-900">
                {tr('Authorized Redirect URI in Google Cloud Console:', 'கூகுள் கிளவுட் Redirect URI:')}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-800 dark:border-[#2C313D] dark:bg-[#161920]">
                <span className="break-all">{cs.redirectUri}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(cs.redirectUri || '');
                    onNotify(tr('Redirect URI copied.', 'லிங்க் காப்பி ஆச்சுங்க.'));
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  <Copy className="h-3 w-3" />
                  <span>{tr('Copy', 'காப்பி')}</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>{tr('Open Google Analytics Admin', 'கூகுள் அனலிடிக்ஸ் திற')}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {canManageOAuth ? (
              <button
                type="button"
                disabled={!canStartOAuth || connectingOAuth}
                onClick={handleConnectOAuth}
                className="admin-btn-primary px-5 py-2.5"
              >
                {connectingOAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                <span>
                  {connectingOAuth
                    ? tr('Redirecting to Google…', 'கூகுளுக்குப் போகுது…')
                    : tr('Connect Google Analytics (OAuth 2.0)', 'கூகுள் அனலிடிக்ஸ் இணை')}
                </span>
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                {tr('Ask an Admin or Super Admin to authorize Google Analytics.', 'அட்மின் இதை இணைச்சதும் இங்க டேட்டா காட்டும்.')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const data = report as CoreReportPayload | null;

  const tabs: Array<{ id: AnalyticsTab; label: string; icon: typeof Activity }> = [
    { id: 'overview', label: tr('Overview', 'சுருக்கம்'), icon: Activity },
    { id: 'realtime', label: tr('Realtime', 'லைவ்'), icon: Radio },
    { id: 'audience', label: tr('Audience', 'பார்வையாளர்'), icon: Users },
    { id: 'traffic', label: tr('Traffic Sources', 'டிராஃபிக் வழி'), icon: SlidersHorizontal },
    { id: 'pages', label: tr('Pages', 'பக்கங்கள்'), icon: FileText },
    { id: 'devices', label: tr('Devices', 'டிவைஸ்கள்'), icon: Laptop },
    { id: 'engagement', label: tr('Engagement', 'ஈடுபாடு'), icon: MousePointerClick },
    { id: 'conversions', label: tr('Conversions', 'இலக்குகள்'), icon: Target },
    { id: 'geography', label: tr('Geography', 'நாடுகள் & ஊர்'), icon: Globe2 }
  ];

  const presets: Array<{ id: DatePreset; label: string }> = [
    { id: 'today', label: tr('Today', 'இன்று') },
    { id: 'yesterday', label: tr('Yesterday', 'நேற்று') },
    { id: '7d', label: tr('7D', '7 நாள்') },
    { id: '28d', label: tr('28D', '28 நாள்') },
    { id: '30d', label: tr('30D', '30 நாள்') },
    { id: '90d', label: tr('90D', '90 நாள்') },
    { id: 'custom', label: tr('Custom', 'தேதி தேர்வு') }
  ];

  const renderDeltaBadge = (delta: number | null, invertGood = false) => {
    if (delta === null) return null;
    const isPositive = delta > 0;
    const isNeutral = delta === 0;
    const isGood = isNeutral ? false : invertGood ? !isPositive : isPositive;
    const cls = isNeutral
      ? 'bg-slate-100 text-slate-600'
      : isGood
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-red-50 text-red-700';

    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${cls}`}>
        {!isNeutral && (isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
        {delta > 0 ? `+${delta}%` : `${delta}%`}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filters & Date Range Bar */}
      <div className="admin-card space-y-3 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Date Presets */}
          <div className="flex flex-wrap items-center gap-1">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                  preset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#1C2029] dark:text-slate-300 dark:hover:bg-[#242936]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-[#2C313D] dark:bg-[#1C2029]">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-blue-600"
              />
              <span>{tr('Compare prev', 'முந்தைய ஒப்பீடு')}</span>
            </label>

            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`admin-btn-secondary py-1.5 px-3 text-[11px] ${
                activeFilterCount > 0 ? 'border-blue-500 text-blue-600' : ''
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{tr('Filters', 'வடிகட்டி')}</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] text-white">{activeFilterCount}</span>
              )}
            </button>

            <button
              type="button"
              disabled={!data}
              onClick={handleExportCsv}
              className="admin-btn-secondary py-1.5 px-3 text-[11px]"
              title={tr('Export current report as CSV', 'CSV டவுன்லோட்')}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden min-[380px]:inline">CSV</span>
            </button>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => (activeTab === 'realtime' ? loadRealtime(true) : loadReports(true))}
              className="admin-btn-primary py-1.5 px-3 text-[11px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing || rtLoading ? 'animate-spin' : ''}`} />
              <span>{tr('Refresh', 'புதுப்பி')}</span>
            </button>

            {canManageOAuth && data && (
              <button
                type="button"
                disabled={disconnectingOAuth}
                onClick={handleDisconnectOAuth}
                className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                title={tr('Disconnect Google Analytics OAuth', 'இணைப்பைத் துண்டி')}
              >
                <Unlink className="inline h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Range Picker Row */}
        {preset === 'custom' && (
          <div className="admin-subcard flex flex-wrap items-end gap-2.5">
            <label className="admin-label min-w-[130px] flex-1">
              <span>{tr('Start Date (IST)', 'தொடக்க தேதி')}</span>
              <input
                type="date"
                max={todayIst}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="admin-input py-1.5 text-xs"
              />
            </label>
            <label className="admin-label min-w-[130px] flex-1">
              <span>{tr('End Date (IST)', 'முடிவு தேதி')}</span>
              <input
                type="date"
                max={todayIst}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="admin-input py-1.5 text-xs"
              />
            </label>
            <button type="button" onClick={() => loadReports(true)} className="admin-btn-primary py-2 px-4">
              {tr('Apply Range', 'பொருத்து')}
            </button>
          </div>
        )}

        {/* Collapsible Dimension Filters */}
        {(showFilters || activeFilterCount > 0) && data && (
          <div className="admin-subcard grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="admin-input py-1.5 text-xs">
              <option value="">{tr('All Countries', 'எல்லா நாடும்')}</option>
              {data.filterOptions.countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)} className="admin-input py-1.5 text-xs">
              <option value="">{tr('All Devices', 'எல்லா டிவைஸும்')}</option>
              <option value="mobile">{tr('Mobile', 'மொபைல்')}</option>
              <option value="desktop">{tr('Desktop', 'கம்ப்யூட்டர்')}</option>
              <option value="tablet">{tr('Tablet', 'டேப்லெட்')}</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="admin-input py-1.5 text-xs">
              <option value="">{tr('All Sources', 'எல்லா சோர்ஸும்')}</option>
              {data.filterOptions.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={landingPageFilter} onChange={(e) => setLandingPageFilter(e.target.value)} className="admin-input py-1.5 text-xs">
              <option value="">{tr('All Landing Pages', 'எல்லா பக்கமும்')}</option>
              {data.filterOptions.landingPages.map((lp) => (
                <option key={lp} value={lp}>{lp}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setCountryFilter('');
                setDeviceFilter('');
                setSourceFilter('');
                setLandingPageFilter('');
              }}
              className="admin-btn-secondary py-1.5 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>{tr('Clear Filters', 'நீக்கு')}</span>
            </button>
          </div>
        )}

        {/* IST Meta Strip */}
        {data && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="font-medium">
              {formatIstShortDate(data.range.startDate)} – {formatIstShortDate(data.range.endDate)} ({data.timezone})
              {data.range.compare && data.range.prevStartDate && data.range.prevEndDate
                ? ` • ${tr('vs', 'ஒப்பீடு')} ${formatIstShortDate(data.range.prevStartDate)} – ${formatIstShortDate(data.range.prevEndDate)}`
                : ''}
            </span>
            <span>
              {tr('Last updated:', 'கடைசியா புதுப்பிச்சது:')} <strong>{formatIstTimestamp(data.lastUpdatedAt)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Section Tabs */}
      <div className="admin-sidebar-scroll flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#262A34] dark:bg-[#161920] dark:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 text-xs font-semibold text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => loadReports(true)} className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white">
            {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
          </button>
        </div>
      )}

      {/* ==================== 1. OVERVIEW ==================== */}
      {activeTab === 'overview' && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {[
              { label: tr('Total Users', 'மொத்த யூசர்ஸ்'), m: data.overview.totalUsers, val: data.overview.totalUsers.value.toLocaleString('en-IN') },
              { label: tr('Active Users', 'ஆக்டிவ் யூசர்ஸ்'), m: data.overview.activeUsers, val: data.overview.activeUsers.value.toLocaleString('en-IN') },
              { label: tr('New Users', 'புது யூசர்ஸ்'), m: data.overview.newUsers, val: data.overview.newUsers.value.toLocaleString('en-IN') },
              { label: tr('Returning Users', 'திரும்ப வந்தவங்க'), m: data.overview.returningUsers, val: data.overview.returningUsers.value.toLocaleString('en-IN') },
              { label: tr('Total Sessions', 'மொத்த செஷன்'), m: data.overview.sessions, val: data.overview.sessions.value.toLocaleString('en-IN') },
              { label: tr('Page Views', 'பக்க பார்வைகள்'), m: data.overview.pageViews, val: data.overview.pageViews.value.toLocaleString('en-IN') },
              { label: tr('Views / Session', 'ஒரு செஷனுக்கு பார்வை'), m: data.overview.viewsPerSession, val: String(data.overview.viewsPerSession.value) },
              { label: tr('Avg Engagement', 'சராசரி நேரம்'), m: data.overview.avgEngagementSeconds, val: formatDurationSeconds(data.overview.avgEngagementSeconds.value) },
              { label: tr('Engagement Rate', 'ஈடுபாடு விகிதம்'), m: data.overview.engagementRate, val: `${data.overview.engagementRate.value}%` },
              { label: tr('Bounce Rate', 'பவுன்ஸ் விகிதம்'), m: data.overview.bounceRate, val: `${data.overview.bounceRate.value}%`, invert: true },
              { label: tr('Event Count', 'மொத்த ஈவென்ட்ஸ்'), m: data.overview.eventCount, val: data.overview.eventCount.value.toLocaleString('en-IN') },
              { label: tr('Key Events', 'முக்கிய இலக்குகள்'), m: data.overview.conversions, val: data.overview.conversions.value.toLocaleString('en-IN') }
            ].map((card) => (
              <div key={card.label} className="admin-card flex flex-col justify-between p-3.5">
                <span className="truncate text-[11px] font-bold text-slate-500">{card.label}</span>
                <p className="mt-1.5 text-lg font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-xl">
                  {card.val}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  {renderDeltaBadge(card.m.delta, Boolean(card.invert)) || (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Primary Traffic Trend Chart */}
          <div className="admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Traffic Trend', 'டிராஃபிக் போக்கு')}</h2>
                <p className="text-[11px] text-slate-500">{tr('Daily performance in Asia/Kolkata (IST)', 'தினசரி பார்வையாளர் எண்ணிக்கை')}</p>
              </div>
              <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-[#1C2029]">
                {[
                  { id: 'activeUsers', label: tr('Users', 'யூசர்ஸ்') },
                  { id: 'sessions', label: tr('Sessions', 'செஷன்') },
                  { id: 'pageViews', label: tr('Views', 'பார்வை') },
                  { id: 'conversions', label: tr('Key Events', 'இலக்கு') }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTrendMetric(opt.id as typeof trendMetric)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      trendMetric === opt.id
                        ? 'bg-white text-blue-600 shadow-xs dark:bg-[#252A36] dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <TrendLineChart
              points={trendPoints}
              currentLabel={tr('Current', 'இப்போ')}
              compareLabel={tr('Previous', 'முந்தைய')}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Traffic Channels', 'வருகிற வழிகள்')}</h3>
              <DonutChartCard
                items={data.traffic.channels.map((c) => ({ label: c.channel, value: c.sessions }))}
                centerLabel={tr('Sessions', 'செஷன்')}
              />
            </div>

            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Top Pages', 'அதிகம் பார்த்த பக்கங்கள்')}</h3>
              <HorizontalBarList
                items={data.pages.topPages.slice(0, 6).map((p) => ({
                  label: p.path,
                  subLabel: p.title,
                  value: p.views,
                  rightLabel: `${p.views.toLocaleString('en-IN')} views`
                }))}
              />
            </div>

            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Top Countries', 'முக்கிய நாடுகள்')}</h3>
              <HorizontalBarList
                items={data.geography.countries.slice(0, 6).map((c) => ({
                  label: c.country,
                  value: c.activeUsers,
                  rightLabel: `${c.activeUsers.toLocaleString('en-IN')} users`
                }))}
                barColor="#10B981"
                onSelect={(country) => setCountryFilter(country)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. REALTIME ==================== */}
      {activeTab === 'realtime' && (
        <div className="space-y-4">
          <div className="admin-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  {tr('Realtime Activity (Last 30 Minutes)', 'லைவ் பார்வையாளர்கள் (கடைசி 30 நிமிஷம்)')}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {realtime?.lastUpdatedAt ? `${tr('Updated:', 'புதுப்பிச்சது:')} ${formatIstTimestamp(realtime.lastUpdatedAt)}` : tr('Streaming live GA4 data…', 'லைவ் டேட்டா வருதுங்க…')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRefreshRt}
                  onChange={(e) => setAutoRefreshRt(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-emerald-600"
                />
                <span>{tr('Auto 30s', '30 வினாடிக்கு ஒருமுறை')}</span>
              </label>
              <button type="button" onClick={() => loadRealtime(true)} className="admin-btn-secondary py-1.5 px-3">
                {rtLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span>{tr('Refresh Live', 'லைவ் புதுப்பி')}</span>
              </button>
            </div>
          </div>

          {rtError && (
            <div className="admin-card border-red-200 bg-red-50 text-xs font-semibold text-red-800">{rtError}</div>
          )}

          {realtime?.summary ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="admin-card p-4">
                  <span className="text-xs font-bold text-slate-500">{tr('Active Users (30m)', 'இப்போ பார்ப்பவங்க')}</span>
                  <p className="mt-1.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
                    {realtime.summary.activeUsersLast30Min.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="admin-card p-4">
                  <span className="text-xs font-bold text-slate-500">{tr('Views (30m)', 'பக்க பார்வைகள்')}</span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
                    {realtime.summary.pageViewsLast30Min.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="admin-card p-4">
                  <span className="text-xs font-bold text-slate-500">{tr('Events (30m)', 'ஈவென்ட்ஸ்')}</span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
                    {realtime.summary.eventsLast30Min.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="admin-card p-4">
                  <span className="text-xs font-bold text-slate-500">{tr('Key Events (30m)', 'இலக்குகள்')}</span>
                  <p className="mt-1.5 text-2xl font-extrabold text-blue-600 tabular-nums">
                    {realtime.summary.conversionsLast30Min.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{tr('Users Per Minute', 'நிமிஷத்துக்கு எத்தனை பேர்')}</h3>
                  <RealtimeMinuteChart data={realtime.perMinute || []} />
                </div>

                <div className="admin-card space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{tr('Active Users by Device', 'டிவைஸ் வாரியா லைவ்')}</h3>
                  <DonutChartCard
                    items={(realtime.devices || []).map((d) => ({ label: d.device, value: d.activeUsers }))}
                    centerLabel={tr('Active', 'ஆக்டிவ்')}
                    emptyText={tr('No active devices in the last 30 minutes.', 'கடைசி 30 நிமிஷத்துல யாரும் ஆன்லைன்ல இல்லீங்க.')}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="admin-card space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{tr('Currently Viewed Pages', 'இப்போ பார்க்குற பக்கங்கள்')}</h3>
                  <HorizontalBarList
                    items={(realtime.activePages || []).map((p) => ({
                      label: p.page,
                      value: p.activeUsers,
                      rightLabel: `${p.activeUsers} • ${p.pageViews} views`
                    }))}
                    emptyText={tr('No live page views right now.', 'தற்போது பக்க பார்வை எதுவும் இல்லீங்க.')}
                  />
                </div>

                <div className="admin-card space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{tr('Visitors by Country & City', 'நாடு & ஊர் வாரியா')}</h3>
                  <HorizontalBarList
                    items={(realtime.locations || []).map((l) => ({
                      label: `${l.city !== '(not set)' ? `${l.city}, ` : ''}${l.country}`,
                      value: l.activeUsers,
                      rightLabel: `${l.activeUsers} users`
                    }))}
                    barColor="#10B981"
                    emptyText={tr('No live location activity right now.', 'லைவ் லொகேஷன் டேட்டா இல்லீங்க.')}
                  />
                </div>

                <div className="admin-card space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">{tr('Realtime Event Activity', 'லைவ் ஈவென்ட்ஸ்')}</h3>
                  <HorizontalBarList
                    items={(realtime.events || []).map((ev) => ({
                      label: ev.eventName,
                      value: ev.eventCount,
                      rightLabel: `${ev.eventCount}x`
                    }))}
                    barColor="#8B5CF6"
                    emptyText={tr('No realtime events yet.', 'லைவ் ஈவென்ட் இன்னும் பதிவாகலை.')}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="admin-card py-10 text-center text-xs text-slate-500">
              {rtLoading ? tr('Fetching realtime visitors…', 'லைவ் விவரம் எடுக்குது…') : tr('Click Refresh Live to load realtime GA4 visitors.', 'லைவ் விவரம் பார்க்க Refresh அழுத்துங்க.')}
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. AUDIENCE ==================== */}
      {activeTab === 'audience' && data && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('New vs Returning Visitors', 'புது & திரும்ப வந்த பார்வையாளர்கள்')}</h2>
              <DonutChartCard
                items={[
                  { label: tr('New Users', 'புது யூசர்ஸ்'), value: data.audience.newUsers, color: '#2563EB' },
                  { label: tr('Returning Users', 'திரும்ப வந்தவங்க'), value: data.audience.returningUsers, color: '#10B981' }
                ]}
                centerLabel={tr('Users', 'யூசர்ஸ்')}
              />
            </div>

            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Audience Languages', 'மொழி வாரியான பார்வையாளர்கள்')}</h2>
              <HorizontalBarList
                items={data.audience.languages.slice(0, 8).map((l) => ({
                  label: l.language,
                  subLabel: `${l.sessions.toLocaleString('en-IN')} sessions`,
                  value: l.activeUsers,
                  rightLabel: `${l.activeUsers.toLocaleString('en-IN')} users`
                }))}
                barColor="#6366F1"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card overflow-hidden p-0">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{tr('Country-wise Visitors', 'நாடு வாரியா')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="p-3">{tr('Country', 'நாடு')}</th>
                      <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                      <th className="p-3 text-right">{tr('Sessions', 'செஷன்')}</th>
                      <th className="p-3 text-right">{tr('Eng %', 'ஈடுபாடு %')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.geography.countries.slice(0, 15).map((c) => (
                      <tr key={c.country} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{c.country}</td>
                        <td className="p-3 text-right tabular-nums">{c.activeUsers.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{c.sessions.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{c.engagementRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card overflow-hidden p-0">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{tr('City-wise Visitors', 'நகரம் வாரியா')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="p-3">{tr('City', 'நகரம்')}</th>
                      <th className="p-3">{tr('Country', 'நாடு')}</th>
                      <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                      <th className="p-3 text-right">{tr('Sessions', 'செஷன்')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.geography.cities.slice(0, 15).map((c, idx) => (
                      <tr key={`${c.city}-${idx}`} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{c.city}</td>
                        <td className="p-3 text-slate-500">{c.country}</td>
                        <td className="p-3 text-right tabular-nums">{c.activeUsers.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{c.sessions.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. TRAFFIC SOURCES ==================== */}
      {activeTab === 'traffic' && data && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Channel Distribution', 'வருகிற சேனல்கள்')}</h2>
              <DonutChartCard
                items={data.traffic.channels.map((c) => ({ label: c.channel, value: c.sessions }))}
                centerLabel={tr('Sessions', 'செஷன்')}
              />
            </div>

            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Top Sources', 'முக்கிய சோர்ஸ்கள்')}</h2>
              <HorizontalBarList
                items={data.traffic.sources.slice(0, 8).map((s) => ({
                  label: `${s.source} / ${s.medium}`,
                  subLabel: s.channel,
                  value: s.sessions,
                  rightLabel: `${s.sessions.toLocaleString('en-IN')} sessions`
                }))}
                onSelect={(lbl) => setSourceFilter(lbl.split(' / ')[0])}
              />
            </div>
          </div>

          <div className="admin-card overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Source / Medium & Campaign Performance', 'சோர்ஸ் / மீடியம் & கேம்பெய்ன்')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="p-3">{tr('Channel', 'சேனல்')}</th>
                    <th className="p-3">{tr('Source / Medium', 'சோர்ஸ் / மீடியம்')}</th>
                    <th className="p-3">{tr('Campaign', 'கேம்பெய்ன்')}</th>
                    <th className="p-3 text-right">{tr('Sessions', 'செஷன்')}</th>
                    <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                    <th className="p-3 text-right">{tr('Eng %', 'ஈடுபாடு')}</th>
                    <th className="p-3 text-right">{tr('Key Events', 'இலக்கு')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.traffic.sources.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">{tr('No traffic source rows in this period.', 'டேட்டா எதுவும் இல்லீங்க.')}</td></tr>
                  ) : (
                    data.traffic.sources.map((s, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{s.channel}</td>
                        <td className="p-3 font-mono text-slate-700">{s.source} / {s.medium}</td>
                        <td className="p-3 text-slate-500">{s.campaign}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{s.sessions.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{s.activeUsers.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{s.engagementRate}%</td>
                        <td className="p-3 text-right font-bold tabular-nums text-blue-600">{s.conversions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. PAGE ANALYTICS ==================== */}
      {activeTab === 'pages' && data && (
        <div className="space-y-4">
          <div className="admin-card space-y-3">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Most Visited Pages', 'அதிகம் பார்த்த பக்கங்கள்')}</h2>
            <HorizontalBarList
              items={data.pages.topPages.slice(0, 10).map((p) => ({
                label: p.path,
                subLabel: p.title,
                value: p.views,
                rightLabel: `${p.views.toLocaleString('en-IN')} views • ${formatDurationSeconds(p.avgEngagementSeconds)}`
              }))}
            />
          </div>

          <div className="admin-card overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Page Views, Unique Visitors & Engagement', 'பக்கங்கள் முழு விவரம்')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="p-3">{tr('Page Path & Title', 'பக்கம் & தலைப்பு')}</th>
                    <th className="p-3 text-right">{tr('Views', 'பார்வை')}</th>
                    <th className="p-3 text-right">{tr('Unique Users', 'யூசர்ஸ்')}</th>
                    <th className="p-3 text-right">{tr('Avg Time', 'நேரம்')}</th>
                    <th className="p-3 text-right">{tr('Eng Rate', 'ஈடுபாடு %')}</th>
                    <th className="p-3 text-right">{tr('Bounce Rate', 'பவுன்ஸ் %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.topPages.map((p, idx) => (
                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 max-w-[260px]">
                        <p className="truncate font-mono font-bold text-slate-900">{p.path}</p>
                        <p className="truncate text-[11px] text-slate-500">{p.title}</p>
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">{p.views.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums">{p.uniqueVisitors.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums">{formatDurationSeconds(p.avgEngagementSeconds)}</td>
                      <td className="p-3 text-right tabular-nums text-emerald-600">{p.engagementRate}%</td>
                      <td className="p-3 text-right tabular-nums">{p.bounceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Landing Pages', 'முதல் வருகை பக்கங்கள் (Landing Pages)')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="p-3">{tr('Landing URL', 'பக்கம்')}</th>
                    <th className="p-3 text-right">{tr('Sessions', 'செஷன்')}</th>
                    <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                    <th className="p-3 text-right">{tr('Eng %', 'ஈடுபாடு')}</th>
                    <th className="p-3 text-right">{tr('Bounce %', 'பவுன்ஸ்')}</th>
                    <th className="p-3 text-right">{tr('Key Events', 'இலக்கு')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.landingPages.map((lp, idx) => (
                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 max-w-[260px] truncate font-mono font-bold text-slate-900">{lp.landingPage}</td>
                      <td className="p-3 text-right font-bold tabular-nums">{lp.sessions.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums">{lp.activeUsers.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums">{lp.engagementRate}%</td>
                      <td className="p-3 text-right tabular-nums">{lp.bounceRate}%</td>
                      <td className="p-3 text-right font-bold tabular-nums text-blue-600">{lp.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. DEVICES ==================== */}
      {activeTab === 'devices' && data && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Device Categories (Mobile / Desktop / Tablet)', 'டிவைஸ் வகைகள்')}</h2>
              <DonutChartCard
                items={data.devices.categories.map((d) => ({ label: d.device, value: d.sessions }))}
                centerLabel={tr('Sessions', 'செஷன்')}
              />
            </div>

            <div className="admin-card space-y-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Operating Systems', 'ஆப்பரேட்டிங் சிஸ்டம்')}</h2>
              <HorizontalBarList
                items={data.devices.operatingSystems.map((o) => ({
                  label: o.os,
                  value: o.sessions,
                  rightLabel: `${o.sessions.toLocaleString('en-IN')} sessions`
                }))}
                barColor="#6366F1"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Browsers', 'பிரவுசர்கள்')}</h3>
              <HorizontalBarList
                items={data.devices.browsers.map((b) => ({
                  label: b.browser,
                  value: b.sessions,
                  rightLabel: `${b.sessions.toLocaleString('en-IN')} sessions`
                }))}
                barColor="#10B981"
              />
            </div>

            <div className="admin-card overflow-hidden p-0">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{tr('Screen Resolutions', 'திரை அளவுகள்')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="p-3">{tr('Resolution', 'அளவு')}</th>
                      <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                      <th className="p-3 text-right">{tr('Sessions', 'செஷன்')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.devices.screenResolutions.map((sr, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="p-3 font-mono font-bold text-slate-900">{sr.resolution}</td>
                        <td className="p-3 text-right tabular-nums">{sr.activeUsers.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{sr.sessions.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 7. ENGAGEMENT ==================== */}
      {activeTab === 'engagement' && data && (
        <div className="space-y-4">
          {/* Enhanced Measurement Event Cards (Strictly from actual GA4 events) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { event: 'scroll', label: tr('Scroll Events (90%)', 'ஸ்க்ரோல் நிகழ்வுகள்') },
              { event: 'click', label: tr('Outbound Link Clicks', 'வெளி லிங்க் க்ளிக்') },
              { event: 'file_download', label: tr('File Downloads', 'ஃபைல் டவுன்லோட்') },
              { event: 'form_submit', label: tr('Form Interactions', 'ஃபார்ம் சமர்ப்பிப்பு') }
            ].map((em) => {
              const found = data.engagement.events.find((e) => e.eventName === em.event);
              return (
                <div key={em.event} className="admin-card p-3.5 sm:p-4">
                  <span className="text-[11px] font-bold text-slate-500">{em.label}</span>
                  <p className="mt-1.5 text-xl font-extrabold tabular-nums text-slate-900">
                    {(found?.eventCount ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">{em.event}</p>
                </div>
              );
            })}
          </div>

          <div className="admin-card space-y-3">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Daily Event Count Trend', 'தினசரி ஈவென்ட் போக்கு')}</h2>
            <TrendLineChart
              points={data.trends.map((t) => ({
                date: t.date,
                prevDate: null,
                value: t.eventCount,
                prevValue: null
              }))}
              accentColor="#8B5CF6"
              currentLabel={tr('Events', 'ஈவென்ட்ஸ்')}
            />
          </div>

          <div className="admin-card overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Events by Event Name', 'நிகழ்வு பெயர் வாரியான விவரம்')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="p-3">{tr('Event Name', 'ஈவென்ட் பெயர்')}</th>
                    <th className="p-3 text-right">{tr('Event Count', 'எண்ணிக்கை')}</th>
                    <th className="p-3 text-right">{tr('Total Users', 'யூசர்ஸ்')}</th>
                    <th className="p-3 text-right">{tr('Key Events', 'இலக்கு')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.engagement.events.map((ev) => (
                    <tr key={ev.eventName} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{ev.eventName}</td>
                      <td className="p-3 text-right font-bold tabular-nums">{ev.eventCount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums">{ev.users.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right tabular-nums text-blue-600">{ev.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 8. CONVERSIONS (KEY EVENTS) ==================== */}
      {activeTab === 'conversions' && data && (
        <div className="space-y-4">
          <div className="admin-card flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{tr('Configured Key Events Collected', 'பதிவான முக்கிய இலக்குகள்')}</span>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-blue-600">
                {data.conversions.totalConversions.toLocaleString('en-IN')}
              </p>
            </div>
            {renderDeltaBadge(data.overview.conversions.delta)}
          </div>

          <div className="admin-card space-y-3">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Conversion Trends', 'இலக்கு மாற்றப் போக்கு')}</h2>
            <TrendLineChart
              points={data.trends.map((t) => ({
                date: t.date,
                prevDate: t.prevDate,
                value: t.conversions,
                prevValue: t.prevConversions
              }))}
              accentColor="#10B981"
              currentLabel={tr('Key Events', 'இப்போ')}
              compareLabel={tr('Previous', 'முந்தைய')}
            />
          </div>

          {data.conversions.keyEvents.length === 0 ? (
            <div className="admin-card border-dashed py-10 text-center text-xs text-slate-500">
              {tr(
                'No configured GA4 Key Events recorded in this period. Only events marked as Key Events in Google Analytics Admin appear here.',
                'இந்த தேதியில எந்த Key Event-உம் பதிவாகலீங்க. GA4 அட்மின்ல Key Event செட் பண்ணா மட்டுமே இங்க காட்டும்.'
              )}
            </div>
          ) : (
            <div className="admin-card overflow-hidden p-0">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{tr('Event-wise Conversion Performance', 'ஈவென்ட் வாரியா இலக்குகள்')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="p-3">{tr('Key Event Name', 'இலக்கு பெயர்')}</th>
                      <th className="p-3 text-right">{tr('Key Events', 'எண்ணிக்கை')}</th>
                      <th className="p-3 text-right">{tr('Total Events', 'மொத்த நிகழ்வு')}</th>
                      <th className="p-3 text-right">{tr('Users', 'யூசர்ஸ்')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversions.keyEvents.map((ke) => (
                      <tr key={ke.eventName} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-900">{ke.eventName}</td>
                        <td className="p-3 text-right font-bold tabular-nums text-emerald-600">{ke.conversions.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{ke.eventCount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right tabular-nums">{ke.users.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 9. GEOGRAPHY ==================== */}
      {activeTab === 'geography' && data && (
        <div className="space-y-4">
          <div className="admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{tr('Global Visitor Distribution', 'உலக அளவில் பார்வையாளர்கள்')}</h2>
              {countryFilter && (
                <button type="button" onClick={() => setCountryFilter('')} className="text-xs font-bold text-blue-600 hover:underline">
                  {tr(`Filtered: ${countryFilter} ×`, `நாடு: ${countryFilter} ×`)}
                </button>
              )}
            </div>
            <WorldVisitorMap countries={data.geography.countries} onSelectCountry={(c) => setCountryFilter(c)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Top Countries', 'முக்கிய நாடுகள்')}</h3>
              <HorizontalBarList
                items={data.geography.countries.slice(0, 12).map((c) => ({
                  label: c.country,
                  subLabel: `${c.sessions.toLocaleString('en-IN')} sessions • ${c.engagementRate}% eng`,
                  value: c.activeUsers,
                  rightLabel: `${c.activeUsers.toLocaleString('en-IN')} users`
                }))}
                onSelect={(country) => setCountryFilter(country)}
              />
            </div>

            <div className="admin-card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{tr('Top Cities', 'முக்கிய நகரங்கள்')}</h3>
              <HorizontalBarList
                items={data.geography.cities.slice(0, 12).map((c) => ({
                  label: `${c.city} (${c.country})`,
                  subLabel: `${c.sessions.toLocaleString('en-IN')} sessions`,
                  value: c.activeUsers,
                  rightLabel: `${c.activeUsers.toLocaleString('en-IN')} users`
                }))}
                barColor="#10B981"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
