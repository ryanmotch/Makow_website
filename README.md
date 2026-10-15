# Makow Genealogy Website

Full-stack genealogy website — React frontend + Node/Express backend, deployed on Vercel.

## Stack
- **Backend**: Node.js · Express (deployed as a Vercel serverless function) · PostgreSQL (Neon, via Vercel's marketplace integration)
- **Frontend**: React 19 · Vite · React Router v7 · CSS Modules
- **Auth**: JWT tokens · bcrypt passwords
- **Polish Archives**: Premium-gated proxy to szukajwarchiwach.gov.pl
- **Deployment**: Vercel (frontend + backend as separate projects: `makow-genealogy`, `makow-genealogy-api`), auto-deployed on push to `master`

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# Requires a DATABASE_URL env var pointing at a Postgres instance -
# `vercel env pull` if the project is linked, or run against a local Postgres.
node --env-file=.env.local server.js   # Runs on http://localhost:3001
                                        # Schema + admin user auto-created on first run
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev           # Runs on http://localhost:3000
```

### 3. Open browser → http://localhost:3000



## Pages
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home — hero, services, stats |
| `/about` | Public | About — bio, credentials |
| `/contact` | Public | Contact form (stored to DB) |
| `/register` | Public | Create account |
| `/login` | Public | Sign in |
| `/account` | Auth | Inbox, sent messages, send message |
| `/polish-archives` | Auth + Paid | Polish vital records search |
| `/admin` | Admin | Users, contacts, messages |

## Polish Archives Feature
Premium users access `/polish-archives` which:
1. Shows a search form (surname, parish, year range, record type)
2. Backend route `GET /api/archives/search` verifies `is_paid = 1` via JWT
3. Attempts to proxy szukajwarchiwach.gov.pl and embed results in an iframe
4. Falls back to a direct link if the site blocks embedding (common with X-Frame-Options)
5. Always shows an "Open in New Tab" button for full access

## Database Schema (Postgres)
```sql
users               (id, name, email, password, is_paid, is_admin, created_at)
contact_submissions (id, name, email, phone, service, ancestry, time_period,
                     geographic_region, budget, message, status, created_at)
messages            (id, sender_id, recipient_id, subject, body,
                     attachment_name, attachment_data, link, is_read, created_at)
```
`db.js` translates the app's SQLite-style `?` positional placeholders to
Postgres `$1, $2, ...` and appends `RETURNING id` to inserts, so route
handlers use the same query style either way.

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/register | — | Create account |
| POST | /api/login | — | Login |
| GET | /api/me | User | Current user |
| POST | /api/contact | — | Submit contact form |
| GET | /api/messages/inbox | User | Inbox |
| GET | /api/messages/sent | User | Sent messages |
| PUT | /api/messages/:id/read | User | Mark read |
| POST | /api/messages/send | User | Send message (+ attachment) |
| GET | /api/archives/search | Paid | Polish archives proxy |
| GET | /api/admin/contacts | Admin | All form submissions |
| PUT | /api/admin/contacts/:id/status | Admin | Update status |
| GET | /api/admin/users | Admin | All users |
| PUT | /api/admin/users/:id/paid | Admin | Toggle paid access |
| GET | /api/admin/messages | Admin | All messages |
| GET | /api/users | User | User list (for messaging) |
| POST | /api/token/refresh | User | Re-issue JWT with current paid status |
| POST | /api/billing/checkout | User | Start $10/month Stripe Checkout |
| POST | /api/billing/confirm | User | Confirm checkout on return, grant paid |
| POST | /api/billing/portal | User | Stripe billing portal (update card / cancel) |
| POST | /api/billing/webhook | Stripe | Keeps `is_paid` in sync with the subscription |

## Membership Billing (Stripe)
Logged-in users click **Join Now** on `/account` to subscribe for $10/month via Stripe Checkout.
On return, `is_paid` is set immediately; the webhook then keeps it in sync (failed renewals
and cancellations revoke access). Backend env vars:

| Var | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for testing) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from the webhook endpoint below |
| `STRIPE_PRICE_ID` | Optional. A recurring Price ID; if unset, a $10/month price is created inline |

Webhook endpoint: `https://<api-domain>/api/billing/webhook`, events
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
