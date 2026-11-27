'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { formatClientError, readApiResponse } from '@/lib/client-error';
import { trackEvent } from '@/lib/analytics';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

export function ContactEnquiryForm() {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${API_URL}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...raw, preferred_lang: lang })
      });
      const json = await readApiResponse<{ message: string }>(
        res,
        lang,
        'Unable to send enquiry.',
        'உங்கள் தகவலை அனுப்ப முடியவில்லை.'
      );
      setStatus({ type: 'success', text: json.message });
      trackEvent('contact_form_submit', { language: lang });
      form.reset();
    } catch (err) {
      setStatus({
        type: 'error',
        text: formatClientError(
          err,
          lang,
          'Unable to send enquiry. Please try again.',
          'தகவலை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        )
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-heading text-xl font-bold text-slate-900">{ui.contactFormTitle}</h2>

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          <span>{ui.contactName}</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={160}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          <span>{ui.contactEmail}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={190}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          <span>{ui.contactPhone}</span>
          <input
            name="phone"
            type="tel"
            maxLength={30}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          <span>{ui.contactSubject}</span>
          <input
            name="subject"
            required
            minLength={2}
            maxLength={220}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
          <span>{ui.contactMessage}</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
        </label>
      </div>

      {status && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        <span>{submitting ? ui.submitting : ui.contactSubmit}</span>
      </button>
    </form>
  );
}

export function VolunteerForm() {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      full_name: String(fd.get('full_name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      district: String(fd.get('district') || ''),
      interest: String(fd.get('interest') || ''),
      availability: String(fd.get('availability') || ''),
      message: String(fd.get('message') || ''),
      consent: fd.get('consent') === 'on',
      preferred_lang: lang,
      website: String(fd.get('website') || '')
    };

    try {
      const res = await fetch(`${API_URL}/api/public/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await readApiResponse<{ message: string }>(
        res,
        lang,
        'Unable to submit application.',
        'விண்ணப்பத்தைச் சமர்ப்பிக்க முடியவில்லை.'
      );
      setStatus({ type: 'success', text: json.message });
      trackEvent('volunteer_form_submit', { language: lang, interest: payload.interest });
      form.reset();
    } catch (err) {
      setStatus({
        type: 'error',
        text: formatClientError(
          err,
          lang,
          'Unable to submit application. Please try again.',
          'விண்ணப்பத்தைச் சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        )
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="volunteer" onSubmit={handleSubmit} className="rounded-3xl border border-brand-800/30 bg-brand-950 p-6 text-white shadow-xl sm:p-8">
      <h2 className="font-heading text-xl font-bold text-white">{ui.volunteerFormTitle}</h2>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.contactName}</span>
          <input
            name="full_name"
            required
            minLength={2}
            maxLength={160}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.contactEmail}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={190}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.donorPhone}</span>
          <input
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={30}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.volunteerDistrict}</span>
          <input
            name="district"
            required
            minLength={2}
            maxLength={120}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.volunteerInterest}</span>
          <select
            name="interest"
            required
            className="w-full rounded-xl border border-white/15 bg-brand-900 px-3.5 py-2.5 text-sm font-normal text-white outline-none focus:border-amberwarm-400"
          >
            <option value="">{lang === 'ta' ? 'துறையைத் தேர்ந்தெடுக்கவும்' : 'Select an area'}</option>
            <option value="Education Support">{lang === 'ta' ? 'கல்வி உதவி' : 'Education Support'}</option>
            <option value="Medical & Health Camps">{lang === 'ta' ? 'மருத்துவ முகாம்கள்' : 'Medical & Health Camps'}</option>
            <option value="Environmental Care">{lang === 'ta' ? 'சுற்றுச்சூழல் பாதுகாப்பு' : 'Environmental Care'}</option>
            <option value="Community Relief & Events">{lang === 'ta' ? 'சமூக நிவாரணம் & நிகழ்வுகள்' : 'Community Relief & Events'}</option>
          </select>
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200">
          <span>{ui.volunteerAvailability}</span>
          <input
            name="availability"
            maxLength={120}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-200 sm:col-span-2">
          <span>{ui.contactMessage}</span>
          <textarea
            name="message"
            rows={3}
            maxLength={3000}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-normal text-white placeholder-slate-400 outline-none focus:border-amberwarm-400 focus:bg-white/15"
          />
        </label>

        <label className="flex items-start gap-2.5 text-xs font-medium text-slate-200 sm:col-span-2">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded accent-amberwarm-400" />
          <span>{ui.volunteerConsent}</span>
        </label>
      </div>

      {status && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40'
              : 'bg-red-500/20 text-red-100 border border-red-400/40'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amberwarm-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amberwarm-400 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        <span>{submitting ? ui.submitting : ui.volunteerSubmit}</span>
      </button>
    </form>
  );
}
