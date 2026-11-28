'use client';

import { useState } from 'react';
import { CalendarPlus, Check, Copy, Share2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

interface CalendarDetails {
  title: string;
  description: string;
  location: string;
  eventDate: string; // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
}

function buildIcsDate(dateStr: string, timeStr?: string | null): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) return cleanDate;
  const cleanTime = `${timeStr.slice(0, 5).replace(':', '')}00`;
  return `${cleanDate}T${cleanTime}`;
}

export function ShareActionsBar({
  title,
  path,
  calendar
}: {
  title: string;
  path: string;
  calendar?: CalendarDetails;
}) {
  const { lang } = useLanguage();
  const ui = getUi(lang);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${path}` : `https://www.ilangathirtrust.org${path}`;

  function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {});
  }

  function handleDownloadIcs() {
    if (!calendar) return;
    const hasTime = Boolean(calendar.startTime);
    const dtStart = buildIcsDate(calendar.eventDate, calendar.startTime);
    const dtEnd = buildIcsDate(
      calendar.eventDate,
      calendar.endTime || (calendar.startTime ? calendar.startTime : undefined)
    );

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ilangathir Trust//Events//EN',
      'BEGIN:VEVENT',
      `UID:ilangathir-${calendar.eventDate}-${encodeURIComponent(calendar.title).slice(0, 24)}@ilangathirtrust.org`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      hasTime ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
      hasTime ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${calendar.title.replace(/[\r\n]/g, ' ')}`,
      `DESCRIPTION:${calendar.description.slice(0, 400).replace(/[\r\n]+/g, ' ')}`,
      `LOCATION:${(calendar.location || 'V. Kallupatti, Dindigul, Tamil Nadu').replace(/[\r\n]/g, ' ')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilangathir-${calendar.eventDate}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const waShareHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <a
        href={waShareHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98]"
      >
        <Share2 className="h-3.5 w-3.5 shrink-0" />
        <span>{ui.shareWhatsapp}</span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-sand-100 active:scale-[0.98]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{copied ? ui.copied : ui.copyLink}</span>
      </button>

      {calendar && (
        <button
          type="button"
          onClick={handleDownloadIcs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-100 active:scale-[0.98]"
        >
          <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
          <span>{ui.addToCalendar}</span>
        </button>
      )}
    </div>
  );
}
