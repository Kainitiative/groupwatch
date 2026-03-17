# GroupWatch Platform

A general-purpose group incident reporting SaaS platform. Any organised group (angling clubs, environmental groups, neighbourhood watch, HOAs, football clubs, animal welfare) can subscribe to manage incident reporting for their members.

## Architecture

**Monorepo (pnpm workspaces)**

| Package | Purpose |
|---|---|
| `artifacts/app` | React + Vite PWA frontend (port 23863 in dev) |
| `artifacts/api-server` | Express 5 API server (port 8080) |
| `lib/db` | Drizzle ORM schema + database client |
| `lib/api-spec` | OpenAPI 3.1 spec + Orval codegen config |
| `lib/api-client-react` | Generated React Query hooks (from codegen) |
| `lib/api-zod` | Generated Zod validation schemas (from codegen) |

## Key Concepts

- **Groups** are the central entity — each has a unique slug, custom incident types, and a subscription
- **Three roles per group**: admin, responder, member
- **Four independent permission flags** for responders: canReceiveNotifications, canViewDashboard, canActionReports, canFileReports
- **Report immutability**: core report fields are never updated; all changes go into `report_updates` rows (critical for court/legal use)
- **1-month free trial** auto-activated on group creation, no credit card required
- **Pricing**: €20/month or €200/year (EUR only)

## Database Schema

9 schema files in `lib/db/src/schema/`:
- `users.ts` — users, password_reset_tokens
- `groups.ts` — groups, subscriptions, setup_progress
- `members.ts` — group_members, group_member_permissions, join_requests, member_invites
- `incident-types.ts` — incident_types
- `reports.ts` — incident_reports, report_photos, report_updates
- `push.ts` — push_subscriptions (Web Push VAPID)
- `platform.ts` — platform_settings, api_keys
- `escalation.ts` — escalation_contacts
- `boundaries.ts` — map_boundaries, map_sections

## API Endpoints

- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — current user
- `GET/PATCH /api/users/me` — profile
- `GET /api/users/me/groups` — user's groups
- `GET /api/users/me/reports` — user's submitted reports
- `POST /api/groups` — create group (starts trial)
- `GET /api/groups/:slug` — group public profile
- `PATCH /api/groups/:slug` — update group (admin)
- `GET /api/groups/:slug/join-link` — shareable join URL
- `POST /api/groups/join/:token` — join via link
- `GET /api/groups/:slug/setup-progress` — onboarding checklist
- `GET/POST /api/groups/:slug/members` — member management
- `GET/POST /api/groups/:slug/incident-types` — incident types
- `GET/POST /api/groups/:slug/reports` — reports
- `GET /api/groups/:slug/reports/:ref/updates` — report timeline
- `GET /api/push/vapid-public-key` — VAPID key
- `POST /api/push/subscribe` / `/unsubscribe` — push subscriptions
- `POST /api/billing/:slug/checkout` — Stripe checkout (monthly/annual)
- `POST /api/billing/:slug/portal` — Stripe billing portal
- `GET /api/billing/:slug/status` — subscription status
- `POST /api/billing/webhooks` — Stripe webhook handler
- `GET /api/admin/groups` — super admin group list
- `GET/PATCH /api/admin/platform-settings` — platform config
- `GET /api/admin/revenue` — MRR overview
- `GET /api/groups/:slug/escalation-contacts` — escalation contacts list
- `POST/PATCH/DELETE /api/groups/:slug/escalation-contacts/:id` — manage contacts
- `GET /api/groups/:slug/analytics?period=week|month|year|all` — analytics data
- `GET /api/groups/:slug/reports/export/csv` — CSV export
- `GET/POST/PATCH/DELETE /api/groups/:slug/boundaries` — map boundaries
- `GET /api/widget/:slug` — public widget info (no auth, group must have publicReportingEnabled)
- `POST /api/widget/:slug/report` — submit public report (no auth, 10/IP/hour rate limit)
- `GET /api/groups/:slug/api-keys` — list API keys (admin)
- `POST /api/groups/:slug/api-keys` — create API key (admin, returns key once)
- `DELETE /api/groups/:slug/api-keys/:keyId` — revoke API key (admin)
- `GET /api/v1/groups/:slug/incident-types` — list incident types (API key auth)
- `GET /api/v1/groups/:slug/incidents` — list incidents (API key auth)
- `POST /api/v1/groups/:slug/incidents` — create incident (API key auth)

## Frontend Pages

- `/` — Landing page (hero, pricing, group types)
- `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- `/dashboard` — user's groups dashboard
- `/groups/new` — group creation wizard
- `/g/:slug` — public group profile page
- `/g/:slug/settings` — group admin settings (tabs: Profile, Members, Incident Types, Escalation, Public Widget, API Keys, Billing)
- `/g/:slug/analytics` — analytics charts (reports over time, by type, by severity, day-of-week, KPIs)
- `/g/:slug/map` — map boundary drawing (Leaflet Draw — polygon boundaries)
- `/g/:slug/reports/:ref/print` — print-to-PDF individual report (court-quality, auto-triggers print)
- `/report/:slug` — mobile-first incident report submission (members)
- `/r/:slug` — public report widget embed page (no auth required)
- `/my-reports` — user's submitted reports
- `/admin` — super admin dashboard

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret (use `openssl rand -hex 32`) |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_EMAIL` | Web Push admin email |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_MONTHLY_PRICE_ID` | Stripe price ID for €20/month plan |
| `STRIPE_ANNUAL_PRICE_ID` | Stripe price ID for €200/year plan |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email configuration |
| `APP_URL` | Public app URL (for email links) |
| `ALLOWED_ORIGINS` | CORS allowed origins |

## Deployment

VPS: LetsHost, Dublin, 2 CPU / 4GB RAM / 40GB disk

Deployment files in project root:
- `Dockerfile` — multi-stage build; Node 20 Alpine; builds frontend + API server, serves static files in prod
- `docker-compose.yml` — `app` (API+static) + `nginx` services; uploads volume; healthcheck
- `deploy/nginx/nginx.conf` — TLS, HTTP→HTTPS, gzip, security headers, 10 MB upload limit
- `.env.example` — all required environment variables with comments
- `.github/workflows/deploy.yml` — CI: build Docker image, push to GHCR; CD: SCP files + SSH restart on VPS

**GitHub Actions secrets required:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

**First-time VPS setup:**
```bash
# 1. Install Docker + Docker Compose
# 2. Install Certbot: apt install certbot
# 3. Get TLS cert: certbot certonly --standalone -d app.groupwatch.io
# 4. Copy .env.example to /opt/groupwatch/.env and fill in values
# 5. docker compose up -d
```

## Development Commands

```bash
# Start both services (configured as workflows)
# API server: port 8080
# Frontend: port 23863

# Push DB schema changes
pnpm --filter @workspace/db run push

# Rebuild codegen after changing openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# TypeCheck API server
pnpm --filter @workspace/api-server run typecheck
```

## PWA Features

- Service worker via vite-plugin-pwa + Workbox
- Background sync for offline report queueing (IndexedDB)
- Web App Manifest (display: standalone)
- iOS install prompt (detect iPhone/iPad + !standalone)
- Android install prompt (beforeinstallprompt event)
- Online/offline connectivity banner
- Direct native camera capture (`capture="camera"` on file inputs)

## Completed Features

**Phase 1–3 (Core Platform):** Auth, groups, report submission (offline/PWA), photo upload + EXIF, voice-to-text, member management, roles + permissions, push notifications, incident types, onboarding checklist, Stripe billing (monthly/annual), escalation contacts, analytics (charts + KPIs + CSV export), individual report print/PDF, map boundaries (Leaflet + leaflet-draw).

**Phase 4 (UX Polish + Content):**
- `HelpTooltip` component (`components/ui/HelpTooltip.tsx`) — wraps Radix tooltip with a `?` icon; deployed on Analytics KPI cards
- Onboarding checklist steps are now clickable links (deep-link to the relevant settings tab or map page)
- GroupSettings supports `?tab=xxx` URL search params for deep-linking from the checklist
- Help centre (`/help`) rewritten with real article content in expandable accordions (6 sections, 28 articles)
- 2 new pillar pages: Neighbourhood Watch (`/for/neighbourhood-watch`), HOA/Residents (`/for/residents`)
- Footer "Use Cases" updated to include all 5 pillar pages

**Phase 5 (COMPLETE):**
- Public reporting widget (`/r/:slug`) — standalone embed form, no auth, GPS, photos, severity selector
- Widget management in GroupSettings (Public Widget tab — toggle, embed code, QR code, preview link)
- API Keys management (GroupSettings API Keys tab — create/revoke, 10-key limit, SHA-256 hashed)
- Public REST API v1 (`/api/v1/...`) — Bearer token auth, group-scoped, list/create incidents + list types

**Deployment (COMPLETE):**
- `Dockerfile` — multi-stage build (frontend + API), Node 20 Alpine, serves static files in production
- `docker-compose.yml` — app + nginx services, volume for uploads, healthcheck
- `deploy/nginx/nginx.conf` — TLS termination, HTTP→HTTPS redirect, gzip, security headers
- `.github/workflows/deploy.yml` — Docker build+push to GHCR, SSH deploy to VPS
- `.env.example` — all required environment variables documented

## User Preferences

- Platform is general-purpose — no fishing/sport-specific terminology
- Report submission page is mobile-first with large touch targets
- Pricing in EUR only (€20/month, €200/year)
- Free trial is 1 month, no credit card required
- Report immutability is non-negotiable (legal/court use)
