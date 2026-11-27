-- =============================================================================
-- Migration v006: Razorpay Donations & Idempotent Webhook Processing
-- Project: Ilangathir Trust (ilangathirtrust.org)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_status') THEN
    CREATE TYPE public.donation_status AS ENUM ('created', 'pending', 'paid', 'failed', 'refunded');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  donor_pan TEXT DEFAULT '',
  donor_address TEXT DEFAULT '',
  purpose TEXT NOT NULL DEFAULT 'General Welfare',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 10000), -- Minimum INR 100
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  idempotency_key TEXT UNIQUE,
  status public.donation_status NOT NULL DEFAULT 'created',
  payment_method TEXT DEFAULT '',
  failure_reason TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.donation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generate human-readable receipt number when donation transitions to paid
CREATE OR REPLACE FUNCTION public.assign_donation_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND (NEW.receipt_number IS NULL OR NEW.receipt_number = '') THEN
    NEW.receipt_number := 'ILG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6));
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_donation_receipt ON public.donations;
CREATE TRIGGER trg_assign_donation_receipt
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.assign_donation_receipt();

INSERT INTO public.schema_migrations (version, description)
VALUES ('v006', 'Razorpay donations, receipt generation, and webhook idempotency')
ON CONFLICT (version) DO NOTHING;
