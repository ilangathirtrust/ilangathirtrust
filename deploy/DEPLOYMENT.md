# Production Deployment Guide — Ilangathir Trust

## 1. DNS Configuration
Point the following DNS records to your server / hosting providers (Vercel / reverse proxy):
- `ilangathirtrust.org` (`A` `76.76.21.21` / `ALIAS`) → Redirect or serve primary web (`apps/web`)
- `www.ilangathirtrust.org` (`CNAME` `cname.vercel-dns.com`) → `apps/web` (Next.js)
- `admin.ilangathirtrust.org` (`CNAME` `cname.vercel-dns.com`) → `apps/admin` (Vite React SPA)
- `api.ilangathirtrust.org` (`CNAME` `cname.vercel-dns.com`) → `apps/api` (Express API)

## 2. Reverse Proxy (if self-hosting)
Use `deploy/Caddyfile` (automatic Let's Encrypt HTTPS) or `deploy/nginx.conf`.

## 3. Razorpay Webhook
In **Razorpay Dashboard → Webhooks**, configure:
- URL: `https://api.ilangathirtrust.org/api/donations/webhook`
- Secret: match `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`

## 4. Supabase Auth Redirects
In **Supabase Dashboard → Authentication → URL Configuration**:
- Site URL: `https://admin.ilangathirtrust.org`
- Redirect URLs:
  - `https://admin.ilangathirtrust.org/**`
  - `https://www.ilangathirtrust.org/**`
  - `https://ilangathirtrust.org/**`
