-- =============================================================================
-- Queries v005: Donation Management, Reports & Idempotent Payment Lookups
-- =============================================================================

-- Admin donation summary aggregates
SELECT
  COALESCE(SUM(amount_paise) FILTER (WHERE status = 'paid'), 0) AS total_paid_paise,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
  COUNT(*) FILTER (WHERE status IN ('created', 'pending')) AS pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_count
FROM public.donations;

-- Paginated donation history with date & status filtering
SELECT
  id, receipt_number, donor_name, donor_email, donor_phone, donor_pan,
  purpose, is_anonymous, amount_paise, currency,
  razorpay_order_id, razorpay_payment_id, status, payment_method,
  failure_reason, paid_at, created_at
FROM public.donations
WHERE ($1::public.donation_status IS NULL OR status = $1)
  AND ($2::timestamptz IS NULL OR created_at >= $2)
  AND ($3::timestamptz IS NULL OR created_at <= $3)
  AND (
    $4::text IS NULL
    OR donor_name ILIKE '%' || $4 || '%'
    OR donor_email ILIKE '%' || $4 || '%'
    OR receipt_number ILIKE '%' || $4 || '%'
    OR razorpay_order_id ILIKE '%' || $4 || '%'
  )
ORDER BY created_at DESC
LIMIT $5 OFFSET $6;

-- Monthly donation report breakdown
SELECT
  DATE_TRUNC('month', paid_at) AS month,
  COUNT(*) AS donation_count,
  SUM(amount_paise) AS total_paise
FROM public.donations
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;
