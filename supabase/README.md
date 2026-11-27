# Supabase Architecture — Ilangathir Trust

This directory contains all version-controlled PostgreSQL migrations, reference queries, Storage bucket setup, and Row-Level Security (RLS) policies for **Ilangathir Trust**.

## Directory Structure

```
supabase/
├── config.toml                         # Supabase CLI & local dev settings
├── migrations/                         # Sequential, immutable SQL migrations
│   ├── v001_initial_schema.sql         # Extensions, shared triggers, schema tracking
│   ├── v002_auth_and_roles.sql         # Admin users, RBAC helpers, audit logs
│   ├── v003_website_content.sql        # Site settings, nav menus, page sections, FAQs, versions, forms
│   ├── v004_gallery_and_events.sql     # Events, folder-based gallery, media items, marquee
│   ├── v005_blog_management.sql        # Categories, bilingual blogs, SEO metadata
│   ├── v006_donations.sql              # Razorpay donations, idempotent webhook events
│   ├── v007_storage_and_policies.sql   # Storage buckets & RLS policies
│   └── v008_indexes_and_optimisation.sql # Composite, partial & full-text search indexes
├── queries/                            # Parameterized SQL reference queries
│   ├── v001_website_queries.sql
│   ├── v002_gallery_queries.sql
│   ├── v003_blog_queries.sql
│   ├── v004_events_queries.sql
│   └── v005_donation_queries.sql
├── storage/                            # Storage bucket & CDN optimization scripts
│   ├── v001_create_buckets.sql
│   ├── v002_storage_policies.sql
│   └── v003_storage_optimisation.sql
├── policies/                           # Standalone RLS reference definitions
│   ├── v001_database_rls.sql
│   └── v002_storage_rls.sql
└── README.md
```

## Migration Rules
1. Never modify or overwrite an existing `v00X_*.sql` file after it has been applied.
2. Always create a new sequential version (`v009_*.sql`, etc.) for schema changes.
3. Run migrations in order `v001` → `v008` in the Supabase SQL Editor or via `supabase db push`.
4. After creating your first user in **Supabase Auth -> Users**, promote them to `super_admin`:
   ```sql
   INSERT INTO public.admin_users (id, email, full_name, role, is_active)
   SELECT id, email, 'Trust Administrator', 'super_admin', true
   FROM auth.users WHERE email = 'ilangathirtrust@gmail.com'
   ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true;
   ```
5. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code (`apps/web` or `apps/admin`).
