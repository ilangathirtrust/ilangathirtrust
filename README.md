# Ilangathir Trust — Full-Stack Web Platform

Modern, bilingual (English & தமிழ்) full-stack web platform for **Ilangathir Trust** (`ilangathirtrust.org`), powered by **Next.js 15**, **React + Vite Admin Portal**, **Express API**, **Supabase** (PostgreSQL, Auth, Storage), **Razorpay**, and **Google Analytics 4**.

## Architecture & Domain Layout

| Surface | Domain | Workspace |
| --- | --- | --- |
| Public Website (SSR/ISR) | `https://www.ilangathirtrust.org` (`ilangathirtrust.org` → 301 redirect) | `apps/web` |
| Secure Admin Portal | `https://admin.ilangathirtrust.org` | `apps/admin` |
| Backend REST & Webhook API | `https://api.ilangathirtrust.org` | `apps/api` |
| Shared Types & Zod Schemas | Internal workspace package | `packages/shared` |
| Database, Storage & RLS | Supabase SQL Migrations | `supabase/` |

## Setup & Installation

1. **Install dependencies** (Node.js 20+):
   ```bash
   npm install
   ```
2. **Apply Supabase SQL migrations** in order (`supabase/migrations/v001_initial_schema.sql` through `v008_indexes_and_optimisation.sql`).
3. **Create Admin User**:
   - Create your admin account in **Supabase Authentication → Users**.
   - Grant `super_admin` in SQL Editor:
     ```sql
     INSERT INTO public.admin_users (id, email, full_name, role, is_active)
     SELECT id, email, 'Trust Administrator', 'super_admin', true
     FROM auth.users WHERE email = 'ilangathirtrust@gmail.com'
     ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true;
     ```
4. **Configure Environment Variables**:
   - Copy `.env.example` to `.env` and fill in Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), Razorpay (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), and Google Analytics (`NEXT_PUBLIC_GA4_MEASUREMENT_ID`).
   - Mirror public client vars (`NEXT_PUBLIC_*`, `VITE_*`) in your hosting environment.
5. **Run Development Servers**:
   ```bash
   npm run dev
   ```
   - Public Website: `http://localhost:3000`
   - Admin Portal: `http://localhost:3001`
   - Backend API: `http://localhost:4000`
6. **Build & Test**:
   ```bash
   npm run build
   npm test
   ```
