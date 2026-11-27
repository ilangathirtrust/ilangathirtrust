'use client';

import { useState } from 'react';
import Script from 'next/script';
import { AlertCircle, CheckCircle2, Heart, Loader2, ShieldCheck } from 'lucide-react';
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
  purposes: string[];
}

export function DonationCheckout({ suggestedAmounts, purposes }: DonationCheckoutProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [amountInr, setAmountInr] = useState<number>(suggestedAmounts[1] || 1000);
  const [purpose, setPurpose] = useState<string>(purposes[0] || 'General Welfare');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{
    receipt_number: string;
    amount_inr: number;
    purpose: string;
    razorpay_payment_id: string;
  } | null>(null);

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
      trackEvent('begin_donation', { amount_inr: amountInr, purpose });

      const orderRes = await fetch(`${API_URL}/api/donations/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName,
          donor_email: donorEmail,
          donor_phone: donorPhone,
          donor_pan: donorPan,
          donor_address: donorAddress,
          purpose,
          is_anonymous: isAnonymous,
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
        description: `Donation — ${purpose}`,
        image: '/logos/icon.png',
        order_id: orderData.order_id,
        prefill: {
          name: donorName,
          email: donorEmail,
          contact: donorPhone
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
            const verifyJson = await readApiResponse<{
              verified: boolean;
              receipt_number: string;
              amount_inr: number;
              purpose: string;
              razorpay_payment_id: string;
            }>(
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
            setReceipt(verifyJson);
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

  if (receipt) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-5 flex justify-center">
          <img
            src="/logos/logo-navy-monochrome.png"
            alt="Ilangathir Trust"
            className="h-12 w-12 object-contain print:hidden"
          />
          <img
            src="/logos/logo-black-monochrome.png"
            alt="Ilangathir Trust"
            className="hidden h-12 w-12 object-contain print:block"
          />
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">
          {ui.paymentSuccessTitle}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          ₹{receipt.amount_inr.toLocaleString('en-IN')} — {receipt.purpose}
        </p>

        <div className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-slate-50 p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{ui.receiptNumber}</span>
            <span className="font-bold text-slate-900">{receipt.receipt_number}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{ui.paymentId}</span>
            <span className="font-mono text-xs font-semibold text-slate-800">{receipt.razorpay_payment_id}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setReceipt(null);
            setError('');
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          <Heart className="h-4 w-4" />
          <span>{ui.donateAnother}</span>
        </button>
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

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-xs font-bold text-slate-700">
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

            <label className="block space-y-1.5 text-xs font-bold text-slate-700">
              <span>{ui.purposeLabel}</span>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
              >
                {purposes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Donor Info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.donorName}</span>
            <input
              required
              minLength={2}
              maxLength={160}
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.donorEmail}</span>
            <input
              type="email"
              required
              maxLength={190}
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
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
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>{ui.donorPan}</span>
            <input
              maxLength={20}
              value={donorPan}
              onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal uppercase text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
            <span>{ui.donorAddress}</span>
            <input
              maxLength={400}
              value={donorAddress}
              onChange={(e) => setDonorAddress(e.target.value)}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-brand-700 focus:bg-white"
            />
          </label>

          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded accent-saffron-600"
            />
            <span>{ui.anonymousLabel}</span>
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
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-saffron-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
          <span>{loading ? ui.submitting : `${ui.proceedToPay} (₹${Number(amountInr || 0).toLocaleString('en-IN')})`}</span>
        </button>
      </form>
    </>
  );
}
