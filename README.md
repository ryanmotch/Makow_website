# Makow Genealogy Website

Full-stack genealogy website — React frontend + Node/Express + SQLite backend.

## Stack
- **Backend**: Node.js · Express · sql.js (SQLite, file-persisted to `makow.db`)
- **Frontend**: React 19 · Vite · React Router v7 · CSS Modules
- **Auth**: JWT tokens · bcrypt passwords
- **Polish Archives**: Premium-gated proxy to szukajwarchiwach.gov.pl

## Quick Start

### 1. Backend
```bash
cd backend
npm install
node server.js        # Runs on http://localhost:3001
                      # DB + admin user auto-created on first run
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

## Database Schema
```sql
users               (id, name, email, password, is_paid, is_admin, created_at)
contact_submissions (id, name, email, phone, service, ancestry, time_period,
                     geographic_region, budget, message, status, created_at)
messages            (id, sender_id, recipient_id, subject, body,
                     attachment_name, attachment_data, link, is_read, created_at)
```

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
