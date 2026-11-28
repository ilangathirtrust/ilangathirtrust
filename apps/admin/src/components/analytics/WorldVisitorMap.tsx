import { useState } from 'react';

interface CountryMetric {
  country: string;
  countryCode: string;
  activeUsers: number;
  sessions: number;
}

// Accurate equirectangular lat/lng projection onto 1000x480 world map viewBox
function latLngToXY(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 480;
  return [x, y];
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  IN: [21, 78],
  India: [21, 78],
  US: [39, -98],
  'United States': [39, -98],
  GB: [54, -2],
  'United Kingdom': [54, -2],
  SG: [1.3, 103.8],
  Singapore: [1.3, 103.8],
  MY: [4.2, 101.9],
  Malaysia: [4.2, 101.9],
  AE: [24, 54],
  'United Arab Emirates': [24, 54],
  CA: [56, -106],
  Canada: [56, -106],
  AU: [-25, 133],
  Australia: [-25, 133],
  DE: [51, 10],
  Germany: [51, 10],
  FR: [46, 2],
  France: [46, 2],
  LK: [7.8, 80.7],
  'Sri Lanka': [7.8, 80.7],
  JP: [36, 138],
  Japan: [36, 138],
  SA: [24, 45],
  'Saudi Arabia': [24, 45],
  QA: [25.3, 51.2],
  Qatar: [25.3, 51.2],
  KW: [29.3, 47.5],
  Kuwait: [29.3, 47.5],
  OM: [21.5, 55.9],
  Oman: [21.5, 55.9],
  BH: [26, 50.5],
  Bahrain: [26, 50.5],
  NL: [52.1, 5.3],
  Netherlands: [52.1, 5.3],
  CH: [46.8, 8.2],
  Switzerland: [46.8, 8.2],
  IT: [42.5, 12.5],
  Italy: [42.5, 12.5],
  ES: [40.4, -3.7],
  Spain: [40.4, -3.7],
  BR: [-14, -51],
  Brazil: [-14, -51],
  ZA: [-30, 25],
  'South Africa': [-30, 25],
  KR: [36.5, 127.8],
  'South Korea': [36.5, 127.8],
  ID: [-2, 118],
  Indonesia: [-2, 118],
  TH: [15.8, 100.9],
  Thailand: [15.8, 100.9],
  NZ: [-41, 174],
  'New Zealand': [-41, 174],
  IE: [53.4, -8.2],
  Ireland: [53.4, -8.2],
  SE: [60.1, 18.6],
  Sweden: [60.1, 18.6],
  NO: [60.5, 8.5],
  Norway: [60.5, 8.5],
  FI: [61.9, 25.7],
  Finland: [61.9, 25.7],
  PL: [52.1, 19.1],
  Poland: [52.1, 19.1],
  MX: [23.6, -102.5],
  Mexico: [23.6, -102.5],
  KE: [-0.02, 37.9],
  Kenya: [-0.02, 37.9],
  NG: [9.0, 8.7],
  Nigeria: [9.0, 8.7],
  BD: [23.7, 90.4],
  Bangladesh: [23.7, 90.4],
  NP: [28.4, 84.1],
  Nepal: [28.4, 84.1],
  PK: [30.4, 69.3],
  Pakistan: [30.4, 69.3],
  CN: [35.9, 104.2],
  China: [35.9, 104.2],
  RU: [61.5, 105.3],
  Russia: [61.5, 105.3]
};

// Lightweight crisp vector continental silhouettes for fast responsive rendering down to 300px
const CONTINENT_PATHS = [
  // North & Central America
  'M78,86 L150,58 L255,62 L302,104 L276,162 L248,176 L218,224 L196,232 L176,192 L120,174 L92,126 Z',
  // Greenland
  'M330,36 L388,28 L405,68 L360,86 L332,68 Z',
  // South America
  'M238,244 L292,248 L338,288 L330,342 L292,398 L268,434 L246,412 L242,334 L224,284 Z',
  // Europe + UK
  'M448,88 L508,70 L558,76 L562,122 L538,144 L484,148 L450,136 Z',
  'M442,98 L456,94 L458,116 L442,118 Z',
  // Africa
  'M448,156 L518,154 L568,188 L584,242 L556,316 L526,374 L496,368 L480,302 L454,244 L434,198 Z',
  // Middle East & Asia
  'M542,144 L610,126 L734,88 L836,96 L880,130 L856,184 L810,208 L766,222 L724,258 L694,252 L658,214 L608,218 L576,194 Z',
  // India peninsula detail
  'M676,192 L714,192 L724,234 L700,264 L684,232 Z',
  // SE Asia islands + Japan
  'M774,264 L828,274 L842,296 L788,298 Z',
  'M846,144 L864,134 L868,166 L848,170 Z',
  // Australia + NZ
  'M778,322 L862,318 L890,358 L874,394 L816,396 L776,364 Z',
  'M908,382 L926,374 L924,406 L906,408 Z'
];

export function WorldVisitorMap({
  countries,
  onSelectCountry
}: {
  countries: CountryMetric[];
  onSelectCountry?: (country: string) => void;
}) {
  const [hovered, setHovered] = useState<CountryMetric | null>(null);

  const totalUsers = Math.max(
    1,
    countries.reduce((acc, c) => acc + c.activeUsers, 0)
  );
  const maxCountryUsers = Math.max(1, ...countries.map((c) => c.activeUsers));

  const plotted = countries
    .map((c) => {
      const coords = COUNTRY_COORDS[c.countryCode] || COUNTRY_COORDS[c.country];
      if (!coords || c.activeUsers <= 0) return null;
      const [x, y] = latLngToXY(coords[0], coords[1]);
      return { ...c, x, y };
    })
    .filter((c): c is CountryMetric & { x: number; y: number } => Boolean(c));

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-[#2A2F3B] dark:bg-[#111319]">
      <svg viewBox="0 0 1000 460" className="h-auto w-full select-none">
        {/* Subtle latitude grid lines */}
        {[115, 230, 345].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="980"
            y2={y}
            stroke="currentColor"
            className="text-slate-200/60 dark:text-slate-800/70"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}

        {/* World landmasses */}
        {CONTINENT_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            className="fill-slate-200/90 stroke-slate-300/80 dark:fill-[#222733] dark:stroke-[#2E3440]"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        ))}

        {/* Active Visitor Country Bubbles */}
        {plotted.map((pt) => {
          const ratio = pt.activeUsers / maxCountryUsers;
          const radius = 5 + ratio * 14;
          const isHovered = hovered?.country === pt.country;
          return (
            <g
              key={pt.country}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(pt)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCountry?.(pt.country)}
            >
              <circle cx={pt.x} cy={pt.y} r={radius + 6} fill="#2563EB" fillOpacity={isHovered ? 0.28 : 0.16} />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={radius}
                fill={isHovered ? '#10B981' : '#2563EB'}
                fillOpacity="0.88"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>

      {hovered ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs dark:border-[#2C313D] dark:bg-[#1C2029]">
          <span className="font-bold text-slate-900">
            {hovered.country} {hovered.countryCode ? `(${hovered.countryCode})` : ''}
          </span>
          <span className="tabular-nums text-slate-600">
            <strong className="text-blue-600">{hovered.activeUsers.toLocaleString('en-IN')}</strong> users (
            {((hovered.activeUsers / totalUsers) * 100).toFixed(1)}%) •{' '}
            <strong>{hovered.sessions.toLocaleString('en-IN')}</strong> sessions
          </span>
        </div>
      ) : (
        <p className="mt-2 text-center text-[11px] text-slate-500">
          {plotted.length > 0
            ? 'Hover or tap any highlighted country marker to view visitor counts or filter.'
            : 'Visitor markers appear automatically once geographic data is collected.'}
        </p>
      )}
    </div>
  );
}
