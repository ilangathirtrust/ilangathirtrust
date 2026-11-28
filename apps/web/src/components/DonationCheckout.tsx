'use client';

import { useState } from 'react';
import Script from 'next/script';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileSearch,
  Heart,
  Loader2,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { TRUST_INFO } from '@ilangathir/shared';
import { API_URL } from '@/lib/api';
import { formatClientError, readApiResponse } from '@/lib/client-error';
import { trackEvent } from '@/lib/analytics';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
    };
  }
}

interface DonationCheckoutProps {
  suggestedAmounts: number[];
  purposes?: string[];
}

interface DonationReceiptData {
  receipt_number: string;
  amount_inr: number;
  purpose: string;
  paid_at?: string;
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  payment_method?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
}

export function DonationCheckout({ suggestedAmounts, purposes = ['General Welfare'] }: DonationCheckoutProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const defaultPurpose = purposes[0] || 'General Welfare';
  const [amountInr, setAmountInr] = useState<number>(suggestedAmounts[1] || 1000);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<DonationReceiptData | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupReceiptNo, setLookupReceiptNo] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (amountInr < 100) {
      setError(lang === 'ta' ? 'குறைந்தபட்ச நன்கொடை ₹100 ஆகும்.' : 'Minimum donation amount is ₹100.');
      return;
    }

    setLoading(true);
    const idempotencyKey = `ilg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    try {
      trackEvent('begin_donation', { amount_inr: amountInr, purpose: defaultPurpose });

      const orderRes = await fetch(`${API_URL}/api/donations/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName,
          donor_phone: donorPhone,
          donor_email: donorEmail.trim(),
          purpose: defaultPurpose,
          amount_inr: Number(amountInr),
          idempotency_key: idempotencyKey
        })
      });

      const orderData = await readApiResponse<{
        donation_id: string;
        order_id: string;
        amount_paise: number;
        currency: string;
        key_id: string;
      }>(
        orderRes,
        lang,
        'Could not initialize payment order.',
        'கட்டண ஆணையைத் தொடங்க முடியவில்லை.'
      );

      if (!window.Razorpay) {
        throw new Error(
          lang === 'ta'
            ? 'ஆன்லைன் கட்டணப் பக்கம் திறக்கப்படவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Online payment checkout could not load. Please refresh and try again.'
        );
      }

      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency,
        name: 'Ilangathir Trust',
        description: `Donation — ${defaultPurpose}`,
        image: '/logos/icon.webp',
        order_id: orderData.order_id,
        prefill: {
          name: donorName,
          contact: donorPhone,
          ...(donorEmail.trim() ? { email: donorEmail.trim() } : {})
        },
        theme: { color: '#1727d8' },
        modal: {
          ondismiss: async () => {
            await fetch(`${API_URL}/api/donations/mark-failed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.order_id,
                reason: 'Donor closed checkout modal'
              })
            }).catch(() => { });
            setLoading(false);
          }
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${API_URL}/api/donations/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const verifyJson = await readApiResponse<
              DonationReceiptData & { verified: boolean }
            >(
              verifyRes,
              lang,
              'Payment verification failed.',
              'கட்டணச் சரிபார்ப்பு தோல்வியடைந்தது.'
            );
            if (!verifyJson.verified) {
              throw new Error(
                lang === 'ta'
                  ? 'கட்டணச் சரிபார்ப்பு நிறைவடையவில்லை. தயவுசெய்து தொடர்பு கொள்ளுங்கள்.'
                  : 'Payment verification did not complete. Please contact support with your payment ID.'
              );
            }
            setReceipt({
              ...verifyJson,
              donor_name: verifyJson.donor_name || donorName,
              donor_email: verifyJson.donor_email || donorEmail,
              donor_phone: verifyJson.donor_phone || donorPhone
            });
            trackEvent('donation_completed', {
              amount_inr: verifyJson.amount_inr,
              purpose: verifyJson.purpose,
              receipt_number: verifyJson.receipt_number
            });
          } catch (verErr) {
            setError(
              formatClientError(
                verErr,
                lang,
                'Payment verification failed. Please contact support if amount was debited.',
                'கட்டணச் சரிபார்ப்பு தோல்வியடைந்தது. தொகை பிடித்தம் செய்யப்பட்டால் எங்களைத் தொடர்பு கொள்ளவும்.'
              )
            );
          } finally {
            setLoading(false);
          }
        }
      });

      rzp.on('payment.failed', async (failRes) => {
        const desc = failRes?.error?.description || 'Payment failed';
        await fetch(`${API_URL}/api/donations/mark-failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_order_id: orderData.order_id, reason: desc })
        }).catch(() => { });
        setError(desc);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(
        formatClientError(
          err,
          lang,
          'Unable to start donation checkout. Please try again.',
          'நன்கொடைக் கட்டணத்தைத் தொடங்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        )
      );
      setLoading(false);
    }
  }

  async function handleReceiptLookup(e: React.FormEvent) {
    e.preventDefault();
    if (lookupLoading) return;
    setLookupError('');
    setLookupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/donations/receipt-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_number: lookupReceiptNo.trim(),
          contact: lookupContact.trim()
        })
      });
      const found = await readApiResponse<DonationReceiptData & { verified: boolean }>(
        res,
        lang,
        'No matching paid receipt found.',
        'பொருந்தும் கட்டண ரசீது கிடைக்கவில்லை.'
      );
      setReceipt(found);
      setLookupOpen(false);
    } catch (err) {
      setLookupError(
        formatClientError(
          err,
          lang,
          'Could not locate that receipt. Verify the receipt number and mobile/email.',
          'ரசீதைக் கண்டறிய முடியவில்லை. ரசீது எண்ணையும் கைபேசி/மின்னஞ்சலையும் சரிபார்க்கவும்.'
        )
      );
    } finally {
      setLookupLoading(false);
    }
  }

  function handleCopyReceiptNo() {
    if (!receipt?.receipt_number || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(receipt.receipt_number)
      .then(() => {
        setCopiedReceipt(true);
        setTimeout(() => setCopiedReceipt(false), 2500);
      })
      .catch(() => {});
  }

  if (receipt) {
    const formattedDate = receipt.paid_at
      ? new Date(receipt.paid_at).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

    return (
      <div className="receipt-printable rounded-3xl border border-emerald-200 bg-white p-5 shadow-xl sm:p-8 print:rounded-none print:border print:border-slate-300 print:p-6 print:shadow-none">
        {/* Trust Receipt Letterhead */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-sand-200 pb-5 text-center sm:flex-row sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img
              src="/logos/logo-navy-monochrome.webp"
              alt="Ilangathir Trust"
              className="h-12 w-12 object-contain print:hidden"
            />
            <img
              src="/logos/logo-black-monochrome.webp"
              alt="Ilangathir Trust"
              className="hidden h-12 w-12 object-contain print:block"
            />
            <div>
              <h2 className="font-heading text-lg font-extrabold text-brand-900 sm:text-xl">
                {TRUST_INFO.legalNameEn} ({TRUST_INFO.displayNameEn})
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                Reg. No: <span className="text-brand-900">{TRUST_INFO.registrationNumber}</span> • PAN:{' '}
                <span className="text-brand-900">{TRUST_INFO.panNumber}</span>
              </p>
              <p className="text-[11px] text-slate-500">{TRUST_INFO.addressEn}</p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-center print:border-slate-300 print:bg-slate-50">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 print:text-slate-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>{lang === 'ta' ? 'அதிகாரப்பூர்வ ரசீது' : 'Official Receipt'}</span>
            </div>
            <p className="mt-0.5 font-mono text-sm font-extrabold text-brand-900">{receipt.receipt_number}</p>
          </div>
        </div>

        {/* Highlight Banner */}
        <div className="mt-5 text-center sm:text-left">
          <h3 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
            {ui.paymentSuccessTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            ₹{receipt.amount_inr.toLocaleString('en-IN')} — {receipt.purpose}
          </p>
        </div>

        {/* Receipt Breakdown Grid */}
        <div className="mt-5 grid gap-4 rounded-2xl border border-sand-200 bg-sand-50/70 p-4 text-sm sm:grid-cols-2 sm:p-5 print:bg-white">
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {lang === 'ta' ? 'நன்கொடையாளர் விவரம்' : 'Donor Details'}
            </p>
            {receipt.donor_name && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">{lang === 'ta' ? 'பெயர்' : 'Donor Name'}</span>
                <span className="text-right font-bold text-slate-900">{receipt.donor_name}</span>
              </div>
            )}
            {receipt.donor_email && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">{lang === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</span>
                <span className="break-all text-right font-medium text-slate-800">{receipt.donor_email}</span>
              </div>
            )}
            {receipt.donor_phone && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">{lang === 'ta' ? 'கைபேசி' : 'Phone'}</span>
                <span className="text-right font-medium text-slate-800">{receipt.donor_phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 border-t border-sand-200 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {lang === 'ta' ? 'பரிவர்த்தனை விவரம்' : 'Transaction Summary'}
            </p>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{ui.receiptNumber}</span>
              <span className="font-mono font-bold text-slate-900">{receipt.receipt_number}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{ui.paymentId}</span>
              <span className="break-all font-mono text-xs font-semibold text-slate-800">{receipt.razorpay_payment_id}</span>
            </div>
            {receipt.razorpay_order_id && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">{lang === 'ta' ? 'ஆர்டர் எண்' : 'Order ID'}</span>
                <span className="break-all font-mono text-xs text-slate-700">{receipt.razorpay_order_id}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{lang === 'ta' ? 'தேதி & நேரம்' : 'Date & Time'}</span>
              <span className="text-right font-medium text-slate-800">{formattedDate}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-sand-200 pt-2 text-base">
              <span className="font-bold text-brand-900">{lang === 'ta' ? 'மொத்தத் தொகை' : 'Contribution'}</span>
              <span className="font-extrabold text-emerald-700 print:text-slate-900">
                ₹{receipt.amount_inr.toLocaleString('en-IN')} INR
              </span>
            </div>
          </div>
        </div>

        {/* Authorised Footer Note */}
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-dashed border-sand-300 pt-4 text-xs text-slate-500 sm:flex-row sm:items-end">
          <p>
            {lang === 'ta'
              ? `இது ${TRUST_INFO.legalNameTa} மூலம் கணினி வழியே வழங்கப்பட்ட அதிகாரப்பூர்வ ரசீது. உதவிக்கு: ${TRUST_INFO.email} | ${TRUST_INFO.phone}`
              : `Computer-generated official donation receipt issued by ${TRUST_INFO.legalNameEn}. For queries: ${TRUST_INFO.email} | ${TRUST_INFO.phone}`}
          </p>
          <div className="shrink-0 text-left sm:text-right">
            <p className="font-bold text-brand-900">{TRUST_INFO.founderNameEn}</p>
            <p>{lang === 'ta' ? 'நிர்வாக அறங்காவலர்' : 'Managing Trustee'}</p>
          </div>
        </div>

        {/* Actions (Hidden when printing) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 print:hidden sm:justify-start">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span>{ui.printReceipt}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReceiptNo}
            className="inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-sand-50 px-4 py-3 text-sm font-bold text-brand-900 transition hover:bg-sand-100 active:scale-[0.98]"
          >
            {copiedReceipt ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copiedReceipt ? ui.copied : ui.copyReceiptNo}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setError('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-saffron-300 bg-saffron-50 px-5 py-3 text-sm font-bold text-saffron-800 transition hover:bg-saffron-100 active:scale-[0.98]"
          >
            <Heart className="h-4 w-4" />
            <span>{ui.donateAnother}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <form
        id="donation-checkout"
        onSubmit={handleCheckout}
        className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-bold text-brand-900 sm:text-2xl">{ui.donateTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{ui.donateSubtitle}</p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs font-bold text-brand-900 sm:inline-flex">
            <ShieldCheck className="h-4 w-4 text-forest-600" />
            {lang === 'ta' ? 'பாதுகாப்பான கட்டணம்' : 'Encrypted Payment'}
          </span>
        </div>

        {/* Suggested Amounts */}
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {suggestedAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInr(amt)}
                className={`rounded-xl border py-3 text-sm font-bold transition ${amountInr === amt
                    ? 'border-saffron-600 bg-saffron-600 text-white shadow-sm'
                    : 'border-sand-200 bg-sand-50 text-brand-900 hover:border-saffron-300 hover:bg-saffron-50'
                  }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <label className="mt-4 block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.customAmount}</span>
            <input
              type="number"
              min={100}
              max={10000000}
              required
              value={amountInr}
              onChange={(e) => setAmountInr(Number(e.target.value))}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-base font-bold text-brand-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>
        </div>

        {/* Simple Donor Details (Max 3 Fields: Name, Mobile, Optional Email) */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
            <span>{ui.donorName}</span>
            <input
              required
              minLength={2}
              maxLength={160}
              placeholder={lang === 'ta' ? 'உங்கள் முழுப் பெயர்' : 'Your full name'}
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.donorPhone}</span>
            <input
              type="tel"
              required
              minLength={7}
              maxLength={30}
              placeholder="+91 98765 43210"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.donorEmail}</span>
            <input
              type="email"
              maxLength={190}
              placeholder={lang === 'ta' ? 'விருப்பம் (ரசீதுக்கு)' : 'Optional (for receipt copy)'}
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-saffron-700 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
          <span>{loading ? ui.submitting : `${ui.proceedToPay} (₹${Number(amountInr || 0).toLocaleString('en-IN')})`}</span>
        </button>
      </form>

      {/* Re-download / Print Past Donation Receipt */}
      <div className="mt-5 rounded-2xl border border-sand-200 bg-white p-4 shadow-xs sm:p-5 print:hidden">
        <button
          type="button"
          onClick={() => {
            setLookupOpen((v) => !v);
            setLookupError('');
          }}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-900 sm:text-sm">
            <FileSearch className="h-4 w-4 shrink-0 text-saffron-600" />
            <span>
              {lang === 'ta'
                ? 'ஏற்கனவே நன்கொடை அளித்தீர்களா? ரசீதை மீண்டும் அச்சிட'
                : 'Already donated? Retrieve & print a past receipt'}
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-saffron-700">
            {lookupOpen ? ui.close : ui.lookupReceipt}
          </span>
        </button>

        {lookupOpen && (
          <form onSubmit={handleReceiptLookup} className="mt-4 grid gap-3 border-t border-sand-200 pt-4 sm:grid-cols-3">
            <input
              required
              placeholder={lang === 'ta' ? 'ரசீது எண் (எ.கா., ILG-...)' : 'Receipt No (e.g., ILG-...)'}
              value={lookupReceiptNo}
              onChange={(e) => setLookupReceiptNo(e.target.value)}
              className="rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
            <input
              required
              placeholder={lang === 'ta' ? 'கைபேசி எண் அல்லது மின்னஞ்சல்' : 'Mobile Number or Email'}
              value={lookupContact}
              onChange={(e) => setLookupContact(e.target.value)}
              className="rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              <span>{ui.lookupReceipt}</span>
            </button>
            {lookupError && (
              <p className="text-xs font-semibold text-red-700 sm:col-span-3">{lookupError}</p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
