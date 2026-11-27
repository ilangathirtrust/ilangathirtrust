# Ilangathir Arakattalai — Trust Website

A responsive public website and Express/MySQL starter with a protected admin area.

## Included
- Public home page with About, Founder, Activities, Gallery, Join Us and Contact sections.
- Uploaded trust logo crop and founder portrait in `public/assets/`.
- Public contact and volunteer forms that store submissions in MySQL.
- Admin login using server-side password hash verification and an HTTP-only session cookie (JWT).
- Admin dashboard with live database counts and CRUD screens for activities, news, gallery and team members.
- Inbox views for contact enquiries and volunteer applications.
- Responsive layouts, basic SEO metadata, accessible labels, reduced-motion support, and image upload endpoint.
- SQL schema and environment-variable example.

## Requirements
- Node.js 18+ and npm
- MySQL 8+ (or compatible MySQL server)

## Setup
1. Install Node.js and MySQL.
2. Create the database tables:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Copy `.env.example` to `.env`.
4. Set database connection values, a long random `SESSION_SECRET` (at least 32 characters), and an admin email/password.
5. Install dependencies:
   ```bash
   npm install
   ```
6. Create the first admin account by running:
   ```bash
   node scripts/create-admin.js
   ```
   The script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`, hashes the password and inserts/updates the account.
7. Start the site:
   ```bash
   npm start
   ```
8. Open `http://localhost:3000` for the website and `http://localhost:3000/admin` for the admin dashboard.

## Important production checklist
- Change all example credentials and use a unique, randomly generated secret.
- Use HTTPS and `NODE_ENV=production` behind a properly configured reverse proxy.
- Add backups, monitoring, and a verified privacy policy.
- Restrict admin creation and keep the `.env` file out of version control.
- Confirm founder name/biography and all programme details with the trust before publishing.
- Do not upload private documents or images without permission.
- Configure CSP and CSRF protection appropriate to the final deployment; this starter disables Helmet CSP to allow a simple static frontend.
- Review role permissions and perform a security test before public deployment.

## Honest implementation notes
- Database-backed forms and content routes require MySQL and a configured `.env`; they will not persist until setup is complete.
- The uploaded founder portrait and a crop of the logo supplied in the chat are used as local assets. The logo source was a screenshot, so replace `public/assets/ilangathir-logo.jpg` with the original clean logo file for best quality.
- Names, biography, activities, and event history are not fabricated. Replace placeholder text with verified details.
- Admin content editing supports CRUD for the listed content models. Site settings are seeded in SQL; a dedicated settings editor and admin-user management screen are not included in this starter yet.
