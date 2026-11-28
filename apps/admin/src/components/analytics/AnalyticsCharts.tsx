import { useState } from 'react';

export interface TrendPoint {
  date: string;
  prevDate: string | null;
  value: number;
  prevValue: number | null;
}

export function formatIstShortDate(ymd: string): string {
  if (!ymd || ymd.length < 10) return ymd;
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  }).format(dt);
}

export function TrendLineChart({
  points,
  valueFormatter = (v) => v.toLocaleString('en-IN'),
  accentColor = '#2563EB',
  compareLabel = 'Previous',
  currentLabel = 'Current',
  height = 230
}: {
  points: TrendPoint[];
  valueFormatter?: (v: number) => string;
  accentColor?: string;
  compareLabel?: string;
  currentLabel?: string;
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
        No trend points in selected range.
      </div>
    );
  }

  const W = 720;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = points.flatMap((p) => (p.prevValue !== null ? [p.value, p.prevValue] : [p.value]));
  const rawMax = Math.max(1, ...allVals);
  const maxVal = Math.ceil(rawMax * 1.15);

  const getX = (i: number) =>
    points.length === 1 ? padL + plotW / 2 : padL + (i / (points.length - 1)) * plotW;
  const getY = (v: number) => padT + plotH - (v / maxVal) * plotH;

  const currCoords = points.map((p, i) => ({ x: getX(i), y: getY(p.value) }));
  const currPath = currCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath =
    currCoords.length > 1
      ? `${currPath} L ${currCoords[currCoords.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${currCoords[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : '';

  const hasPrev = points.some((p) => p.prevValue !== null);
  const prevPath = hasPrev
    ? points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.prevValue ?? 0).toFixed(1)}`)
        .join(' ')
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + plotH - t * plotH,
    label: Math.round(t * maxVal)
  }));

  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;
  const activeCoord = hoverIdx !== null ? currCoords[hoverIdx] : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="ga4AreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line
              x1={padL}
              y1={tick.y}
              x2={W - padR}
              y2={tick.y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
              strokeDasharray={idx === 0 ? undefined : '3 3'}
            />
            <text
              x={padL - 8}
              y={tick.y + 3.5}
              textAnchor="end"
              className="fill-slate-400 text-[10px] font-medium"
            >
              {tick.label >= 1000 ? `${(tick.label / 1000).toFixed(1)}k` : tick.label}
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill="url(#ga4AreaGrad)" />}

        {prevPath && (
          <path
            d={prevPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {currPath && (
          <path
            d={currPath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p, i) => {
          if (i % labelStep !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={p.date}
              x={getX(i)}
              y={H - 6}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-medium"
            >
              {formatIstShortDate(p.date)}
            </text>
          );
        })}

        {activeCoord && (
          <>
            <line
              x1={activeCoord.x}
              y1={padT}
              x2={activeCoord.x}
              y2={padT + plotH}
              stroke={accentColor}
              strokeOpacity="0.35"
              strokeWidth="1.2"
            />
            <circle cx={activeCoord.x} cy={activeCoord.y} r="4.5" fill={accentColor} stroke="#fff" strokeWidth="2" />
          </>
        )}

        {/* Interactive Hover Columns */}
        {points.map((p, i) => {
          const x = getX(i);
          const sliceW = points.length > 1 ? plotW / points.length : plotW;
          return (
            <rect
              key={`hit-${p.date}`}
              x={Math.max(padL, x - sliceW / 2)}
              y={padT}
              width={sliceW}
              height={plotH}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => setHoverIdx(i)}
            />
          );
        })}
      </svg>

      {activePoint && activeCoord && (
        <div
          className="pointer-events-none absolute top-2 z-20 min-w-[150px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm dark:border-[#2C313D] dark:bg-[#1C2029]/95"
          style={{
            left: activeCoord.x > W * 0.62 ? undefined : `${Math.min(72, Math.max(8, (activeCoord.x / W) * 100))}%`,
            right: activeCoord.x > W * 0.62 ? '4%' : undefined
          }}
        >
          <p className="font-bold text-slate-900">{formatIstShortDate(activePoint.date)}</p>
          <p className="mt-1 flex items-center justify-between gap-3 text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
              {currentLabel}
            </span>
            <strong className="tabular-nums text-slate-900">{valueFormatter(activePoint.value)}</strong>
          </p>
          {activePoint.prevValue !== null && (
            <p className="mt-0.5 flex items-center justify-between gap-3 text-slate-500">
              <span>{compareLabel} ({formatIstShortDate(activePoint.prevDate || '')})</span>
              <span className="tabular-nums">{valueFormatter(activePoint.prevValue)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const DONUT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export function DonutChartCard({
  items,
  centerLabel,
  emptyText = 'No distribution data collected yet.'
}: {
  items: Array<{ label: string; value: number; color?: string }>;
  centerLabel: string;
  emptyText?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const filtered = items.filter((i) => i.value > 0);
  const total = filtered.reduce((acc, cur) => acc + cur.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
        {emptyText}
      </div>
    );
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 56;
  const circumference = 2 * Math.PI * r;

  let cumulativeOffset = 0;
  const segments = filtered.slice(0, 7).map((item, idx) => {
    const share = item.value / total;
    const dashLen = share * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLen;
    return {
      ...item,
      sharePct: (share * 100).toFixed(1),
      dashLen,
      offset,
      color: item.color || DONUT_COLORS[idx % DONUT_COLORS.length]
    };
  });

  const focused = hoverIdx !== null ? segments[hoverIdx] : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="18"
          />
          {segments.map((seg, idx) => (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoverIdx === idx ? 21 : 18}
              strokeDasharray={`${seg.dashLen} ${circumference - seg.dashLen}`}
              strokeDashoffset={-seg.offset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-base font-extrabold tabular-nums text-slate-900">
            {focused ? `${focused.sharePct}%` : total.toLocaleString('en-IN')}
          </span>
          <span className="max-w-[84px] truncate text-[10px] font-semibold text-slate-500">
            {focused ? focused.label : centerLabel}
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-2">
        {segments.map((seg, idx) => (
          <div
            key={seg.label}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition ${
              hoverIdx === idx ? 'bg-slate-100 dark:bg-[#222733]' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="truncate font-semibold capitalize text-slate-700">{seg.label}</span>
            </div>
            <div className="shrink-0 tabular-nums text-right">
              <span className="font-bold text-slate-900">{seg.value.toLocaleString('en-IN')}</span>
              <span className="ml-1.5 text-[11px] text-slate-500">({seg.sharePct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarList({
  items,
  unitLabel = '',
  barColor = '#2563EB',
  onSelect,
  emptyText = 'No data available for current filters.'
}: {
  items: Array<{ label: string; subLabel?: string; value: number; rightLabel?: string }>;
  unitLabel?: string;
  barColor?: string;
  onSelect?: (label: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
        {emptyText}
      </div>
    );
  }

  const maxVal = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const pct = Math.max(2, Math.round((item.value / maxVal) * 100));
        return (
          <button
            key={`${item.label}-${idx}`}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(item.label)}
            className={`block w-full text-left ${onSelect ? 'group cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-slate-800 group-hover:text-blue-600">{item.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-slate-900">
                {item.rightLabel || `${item.value.toLocaleString('en-IN')}${unitLabel ? ` ${unitLabel}` : ''}`}
              </span>
            </div>
            {item.subLabel && <p className="truncate text-[10px] text-slate-500">{item.subLabel}</p>}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#222733]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function RealtimeMinuteChart({
  data
}: {
  data: Array<{ minutesAgo: number; activeUsers: number; pageViews: number; eventCount: number }>;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = Math.max(1, ...data.map((d) => d.activeUsers));

  return (
    <div className="relative">
      <div className="flex h-36 items-end gap-[3px] pt-4">
        {data.map((pt, idx) => {
          const pct = pt.activeUsers > 0 ? Math.max(8, Math.round((pt.activeUsers / maxVal) * 100)) : 4;
          const isHovered = hoverIdx === idx;
          return (
            <div
              key={pt.minutesAgo}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="group relative flex h-full flex-1 flex-col justify-end"
            >
              <div
                className={`w-full rounded-t transition-all ${
                  pt.activeUsers > 0
                    ? isHovered
                      ? 'bg-emerald-400'
                      : 'bg-blue-600'
                    : 'bg-slate-200 dark:bg-[#242936]'
                }`}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
        <span>30m ago</span>
        <span>15m ago</span>
        <span>Now</span>
      </div>
      {hoverIdx !== null && data[hoverIdx] && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:bg-[#1C2029]">
          <span>
            {data[hoverIdx].minutesAgo === 0 ? 'Current minute' : `${data[hoverIdx].minutesAgo} min ago`}
          </span>
          <span className="tabular-nums">
            {data[hoverIdx].activeUsers} active • {data[hoverIdx].pageViews} views • {data[hoverIdx].eventCount} events
          </span>
        </div>
      )}
    </div>
  );
}
