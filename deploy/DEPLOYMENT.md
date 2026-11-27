# Production Deployment Guide — Ilangathir Trust

## 1. DNS Configuration
Point the following DNS records to your server / hosting providers:
- `ilangathirtrust.com` (`A` / `ALIAS`) → Reverse proxy / Edge redirect to `https://www.ilangathirtrust.com`
- `www.ilangathirtrust.com` (`CNAME` / `A`) → `apps/web` (Next.js on port 3000)
- `admin.ilangathirtrust.com` (`CNAME` / `A`) → `apps/admin/dist` static build
- `api.ilangathirtrust.com` (`CNAME` / `A`) → `apps/api` (Express on port 4000)

## 2. Reverse Proxy
Use `deploy/Caddyfile` (automatic Let's Encrypt HTTPS) or `deploy/nginx.conf`.

## 3. Razorpay Webhook
In **Razorpay Dashboard → Webhooks**, configure:
- URL: `https://api.ilangathirtrust.com/api/donations/webhook`
- Secret: match `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`

## 4. Supabase Auth Redirects
In **Supabase Dashboard → Authentication → URL Configuration**:
- Site URL: `https://admin.ilangathirtrust.com`
- Redirect URLs: `https://admin.ilangathirtrust.com/**`
