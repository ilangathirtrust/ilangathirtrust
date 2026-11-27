import { Router } from 'express';
import {
  createDonationOrderSchema,
  sanitizePlainText,
  verifyDonationSchema
} from '@ilangathir/shared';
import { env } from '../config/env.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { donationOrderLimiter } from '../middleware/rateLimit.js';
import {
  getRazorpayClient,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from '../services/razorpay.js';

export const donationsRouter = Router();

donationsRouter.post('/create-order', donationOrderLimiter, async (req, res, next) => {
  try {
    const parsed = createDonationOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      res.status(400).json({
        error: firstIssue || 'Invalid donation details. Minimum donation is INR 100.',
        issues: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const d = parsed.data;
    const amountPaise = Math.round(d.amount_inr * 100);
    const supabase = getSupabaseAdmin();

    // Idempotent check to prevent duplicate order creation on double-click or network retry
    if (d.idempotency_key) {
      const { data: existing } = await supabase
        .from('donations')
        .select('id, razorpay_order_id, amount_paise, currency, status')
        .eq('idempotency_key', d.idempotency_key)
        .maybeSingle();

      if (existing && existing.razorpay_order_id && existing.status === 'created') {
        res.status(200).json({
          donation_id: existing.id,
          order_id: existing.razorpay_order_id,
          amount_paise: existing.amount_paise,
          currency: existing.currency,
          key_id: env.RAZORPAY_KEY_ID
        });
        return;
      }
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `ilg_${Date.now()}`,
      notes: {
        purpose: sanitizePlainText(d.purpose),
        donor_name: sanitizePlainText(d.donor_name),
        donor_email: d.donor_email.toLowerCase()
      }
    });

    const { data: inserted, error: insertError } = await supabase
      .from('donations')
      .insert({
        donor_name: sanitizePlainText(d.donor_name),
        donor_email: d.donor_email.toLowerCase(),
        donor_phone: sanitizePlainText(d.donor_phone),
        donor_pan: sanitizePlainText(d.donor_pan).toUpperCase(),
        donor_address: sanitizePlainText(d.donor_address),
        purpose: sanitizePlainText(d.purpose),
        is_anonymous: d.is_anonymous,
        amount_paise: amountPaise,
        currency: 'INR',
        razorpay_order_id: order.id,
        idempotency_key: d.idempotency_key || null,
        status: 'created'
      })
      .select('id, razorpay_order_id, amount_paise, currency')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      donation_id: inserted.id,
      order_id: inserted.razorpay_order_id,
      amount_paise: inserted.amount_paise,
      currency: inserted.currency,
      key_id: env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
});

donationsRouter.post('/verify', donationOrderLimiter, async (req, res, next) => {
  try {
    const parsed = verifyDonationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payment verification payload.' });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
    const isValid = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabase
      .from('donations')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      res.status(404).json({ error: 'Donation order not found.' });
      return;
    }

    if (!isValid) {
      if (existing.status !== 'paid') {
        await supabase
          .from('donations')
          .update({
            status: 'failed',
            failure_reason: 'Invalid Razorpay signature verification'
          })
          .eq('id', existing.id);
      }
      res.status(400).json({ error: 'Payment signature verification failed.' });
      return;
    }

    // Idempotent return if already verified/captured via webhook or earlier call
    if (existing.status === 'paid') {
      res.json({
        verified: true,
        receipt_number: existing.receipt_number,
        amount_inr: existing.amount_paise / 100,
        purpose: existing.purpose,
        paid_at: existing.paid_at,
        razorpay_payment_id: existing.razorpay_payment_id
      });
      return;
    }

    let paymentMethod = '';
    try {
      const razorpay = getRazorpayClient();
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      paymentMethod = payment.method || '';
    } catch {
      // Non-fatal if Razorpay fetch fails after valid signature
    }

    const { data: updated, error: updateError } = await supabase
      .from('donations')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        payment_method: paymentMethod,
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select('receipt_number, amount_paise, purpose, paid_at, razorpay_payment_id')
      .single();

    if (updateError) throw updateError;

    res.json({
      verified: true,
      receipt_number: updated.receipt_number,
      amount_inr: updated.amount_paise / 100,
      purpose: updated.purpose,
      paid_at: updated.paid_at,
      razorpay_payment_id: updated.razorpay_payment_id
    });
  } catch (err) {
    next(err);
  }
});

donationsRouter.post('/mark-failed', donationOrderLimiter, async (req, res, next) => {
  try {
    const orderId = typeof req.body?.razorpay_order_id === 'string' ? req.body.razorpay_order_id.trim() : '';
    const reason = typeof req.body?.reason === 'string' ? sanitizePlainText(req.body.reason).slice(0, 300) : 'Payment cancelled or interrupted';
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    await supabase
      .from('donations')
      .update({ status: 'failed', failure_reason: reason })
      .eq('razorpay_order_id', orderId)
      .in('status', ['created', 'pending']);

    res.json({ recorded: true });
  } catch (err) {
    next(err);
  }
});

donationsRouter.get('/status/:orderId', donationOrderLimiter, async (req, res, next) => {
  try {
    const orderId = String(req.params.orderId || '').trim();
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('donations')
      .select('status, receipt_number, amount_paise, purpose, paid_at, razorpay_payment_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.json({
      status: data.status,
      receipt_number: data.receipt_number,
      amount_inr: data.amount_paise / 100,
      purpose: data.purpose,
      paid_at: data.paid_at,
      razorpay_payment_id: data.razorpay_payment_id
    });
  } catch (err) {
    next(err);
  }
});

donationsRouter.post('/webhook', async (req, res, next) => {
  try {
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const eventId = String(req.headers['x-razorpay-event-id'] || '');
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

    if (!rawBody || !verifyRazorpayWebhookSignature(rawBody, signature)) {
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; method?: string; error_description?: string } };
        order?: { entity?: { id?: string } };
        refund?: { entity?: { payment_id?: string } };
      };
    };

    const eventType = event.event || 'unknown';
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id || null;
    const paymentId = paymentEntity?.id || event.payload?.refund?.entity?.payment_id || null;

    const supabase = getSupabaseAdmin();

    // Idempotency guard via unique event_id
    if (eventId) {
      const { data: existingEvent } = await supabase
        .from('donation_webhooks')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();
      if (existingEvent) {
        res.status(200).json({ status: 'duplicate_ignored' });
        return;
      }
    }

    await supabase.from('donation_webhooks').insert({
      event_id: eventId || `rzp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event_type: eventType,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      signature_verified: true,
      payload: event
    });

    if ((eventType === 'payment.captured' || eventType === 'order.paid') && orderId) {
      await supabase
        .from('donations')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId || undefined,
          payment_method: paymentEntity?.method || undefined,
          paid_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', orderId)
        .neq('status', 'paid');
    } else if (eventType === 'payment.failed' && orderId) {
      await supabase
        .from('donations')
        .update({
          status: 'failed',
          razorpay_payment_id: paymentId || undefined,
          failure_reason: paymentEntity?.error_description || 'Payment failed at gateway'
        })
        .eq('razorpay_order_id', orderId)
        .in('status', ['created', 'pending']);
    } else if (eventType === 'refund.processed' && paymentId) {
      await supabase
        .from('donations')
        .update({ status: 'refunded' })
        .eq('razorpay_payment_id', paymentId);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});
