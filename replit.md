# GroupWatch Platform

A general-purpose group incident reporting SaaS platform. Any organised group (angling clubs, environmental groups, neighbourhood watch, HOAs, football clubs, animal welfare) can subscribe to manage incident reporting for their members.

## Production Deployment

- **Live URL**: https://groupwatchplatform.com
- **VPS**: Ubuntu 24.04 at 185.43.233.219 (LetsHost Dublin)
- **Stack**: Docker Compose → nginx (port 80) + app (port 8080 internal) + PostgreSQL (host)
- **CI/CD**: GitHub Actions → ghcr.io/kainitiative/groupwatch → VPS pulls image manually
- **SSL**: Cloudflare Flexible (Cloudflare terminates TLS, origin is HTTP)
- **Repo**: github.com/Kainitiative/groupwatch (push to `main` branch to trigger Actions)
- **IMPORTANT — push from Replit**: always use `git push origin master:main` (local branch is `master`, Actions triggers on `main`)

## ⚠️ Known Replit Gotcha — Checkpoint Rollbacks

Replit automatically creates checkpoints during sessions. These checkpoints can **silently revert file changes** if a checkpoint was created before the edit was committed. This has caused lost work before (e.g. `SidebarLayout.tsx` billing link was reverted by a checkpoint on 28 Mar 2026, causing hours of debugging).

**How to protect against this:**
1. After making any code change, **immediately run `git add . && git commit`** before doing anything else
2. Always push with `git push origin master:main` so the code is safely in GitHub
3. If a deployed change isn't showing up, run `grep -n "YourNewCode" path/to/file.tsx` to verify the file wasn't rolled back
4. If rolled back, re-apply the change and commit again — the Docker build cache means only genuinely changed files trigger a rebuild

## VPS Deployment Process

After pushing to `main` on GitHub, GitHub Actions auto-deploys (~2 mins build + deploy). No manual action needed on the VPS.

If you ever need to force a manual redeploy:
```bash
cd /opt/groupwatch && docker compose pull app && docker compose up -d --force-recreate app
```

### GHCR Authentication
- **GHCR package**: ghcr.io/kainitiative/groupwatch is currently **PUBLIC** — no login needed on VPS
- **If package is made private**: VPS needs `docker login ghcr.io -u Kainitiative --password-stdin` with a PAT that has `read:packages` scope
- **Token on VPS**: The `read:packages` PAT created on 28 Mar 2026 was shared in chat and is **COMPROMISED** — delete it at github.com/settings/tokens and create a new one
- **Action needed**: After rotating, run `echo "NEW_TOKEN" | docker login ghcr.io -u Kainitiative --password-stdin` on the VPS (only needed if GHCR package is made private)

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

**Domain:** `groupwatchplatform.com`
**VPS:** LetsHost, Dublin, 2 CPU / 4GB RAM / 40GB disk

Deployment files in project root:
- `Dockerfile` — 5-stage build: deps → frontend-build → api-build → runner (production) → migrator
- `docker-compose.yml` — `app` (API+static) + `nginx` + `migrator` (profile: migration) services; uploads volume; healthcheck
- `deploy/nginx/nginx.conf` — serves `groupwatchplatform.com`, gzip, security headers, 10 MB upload limit
- `.env.example` — all required environment variables with comments
- `.github/workflows/deploy.yml` — CI: builds `app` + `migrator` images, pushes to GHCR; CD: SCP files, run migrator, restart app

**GitHub Actions secrets required:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DATABASE_URL`

**Health check endpoint:** `GET /api/healthz`

**SSL: Cloudflare (free)**
- Add `groupwatchplatform.com` to Cloudflare (free account)
- Point domain registrar nameservers to Cloudflare's
- In Cloudflare dashboard: SSL/TLS → set mode to **Full**
- Cloudflare handles HTTPS — Nginx only listens on port 80

**First-time VPS setup:**
```bash
# 1. Install Docker + Docker Compose
# 2. Copy .env.example to /opt/groupwatch/.env and fill in values
# 3. docker compose up -d
```

**Running DB migrations manually:**
```bash
# On the VPS after SSHing in:
cd /opt/groupwatch
GITHUB_REPOSITORY=<your-github-repo> docker compose --profile migration run --rm migrator
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

## Completed Feature: groupType-Driven Terminology & Defaults

### Goal
Keep one platform, one codebase. Use the group's `groupType` to adapt language, default categories, and UI copy so each organisation feels like the product was built for them — without building separate apps.

### What exists today
- `groupType` is a free-text field on the `groups` table, captured at registration
- It is stored but not used to drive anything in the UI or API
- Incident categories are created manually by each group admin after sign-up

---

### Phase 1 — Formalise the groupType enum

**Data layer:**
- Change `groupType` from free-text to a constrained enum (or enforce via validation)
- Defined values to start:
  - `angling_club`
  - `neighbourhood_watch`
  - `hoa` (homeowners association)
  - `sports_club`
  - `tidy_towns`
  - `other` (catch-all for unrecognised types)
- Existing free-text values should be mapped to the enum on migration (most will be `other`)
- Update the Create Group form to use a dropdown instead of a text input

---

### Phase 2 — Terminology config system

Create a shared config file (e.g. `lib/shared/src/groupTypeConfig.ts`) that maps each groupType to its terminology overrides:

```
groupType → {
  reportNoun: "report" | "sighting" | "incident" | "complaint" | "observation"
  reportVerb: "report" | "log" | "submit" | "flag"
  memberNoun: "member" | "resident" | "angler" | "warden"
  areaLabel: "area" | "water" | "estate" | "zone" | "patch"
}
```

Example mappings:
- `angling_club` → sighting, log, angler, water
- `neighbourhood_watch` → incident, report, resident, area
- `hoa` → complaint, submit, resident, estate
- `tidy_towns` → observation, log, volunteer, patch
- `sports_club` → report, flag, member, zone

The API returns the group's `groupType` in the group object (it already does). The frontend reads it and looks up the terminology config to swap in the right words at render time. No separate API calls needed.

---

### Phase 3 — Default incident categories on group creation

When a group is created, the API seeds a set of default incident types based on the groupType. Admin can edit/delete/add after the fact.

Example seed sets:
- `angling_club` → Illegal netting, Pollution, Poaching, Bank damage, Fish kill
- `neighbourhood_watch` → Suspicious activity, Vandalism, Theft, Anti-social behaviour, Fly-tipping
- `tidy_towns` → Litter, Illegal dumping, Graffiti, Overgrown verge, Pothole
- `hoa` → Noise complaint, Parking violation, Property damage, Maintenance issue, Security concern
- `sports_club` → Trespassing, Field damage, Equipment theft, Anti-social behaviour, Safety hazard
- `other` → Generic set: Incident, Suspicious activity, Damage, Safety concern

This replaces the current blank slate that every new admin faces, reducing time-to-value.

---

### Phase 4 — UI copy adaptation

Places in the UI where terminology swaps apply:
- Report submission page heading and button labels
- Dashboard section headings ("Recent Reports" → "Recent Sightings")
- Sidebar navigation labels
- Empty states ("No reports yet" → "No sightings logged yet")
- Notification/email subjects

Implementation: a `useGroupTerminology(groupType)` hook in the frontend that returns the terminology object. Components pull from this hook rather than hardcoding strings.

---

### What this does NOT include
- Separate routing or feature sets per groupType — all groups use the same pages
- Role/permission differences per groupType — permissions stay the same
- Separate billing tiers per groupType — all on the same €20/month plan

---

### Files that will need changes
- `lib/db/src/schema/groups.ts` — add enum constraint to `groupType`
- `lib/shared/src/groupTypeConfig.ts` — new file, the terminology and seed data config
- `artifacts/api-server/src/routes/groups.ts` — seed default incident types on creation
- `artifacts/app/src/pages/groups/CreateGroup.tsx` — dropdown instead of text input
- `artifacts/app/src/hooks/useGroupTerminology.ts` — new hook
- Multiple pages in `artifacts/app/src/pages/` — swap hardcoded strings to use the hook

## Target Groups to Add (Marketing & Onboarding)

- **Tidy Towns committees** — ✅ pillar page live at `/for/tidy-towns`. Community groups responsible for local environmental upkeep; good fit for reporting litter, dumping, vandalism, and maintenance issues within a defined area.

## Planned Feature: Optional Self-Assignment When Filing a Report

### Problem
When an admin files a report today, they are automatically claimed as the responder on it (`auto_claim`). There is no way to just log the incident and leave it open for another responder to pick up.

### What exists today
- Reports have a `status` field: `open`, `in_progress`, `escalated`, `resolved`
- Report updates track actions including `claim` and `auto_claim`
- When an admin submits a report, an `auto_claim` update is logged and status moves to `in_progress`

---

### Plan

**Report submission form — one small addition:**
Add a checkbox or toggle on the submission form, visible only to admins/responders:

> ☑ Assign this report to me
> (uncheck to leave it open for another responder)

Checked by default to preserve existing behaviour. If unchecked, the report is submitted with status `open` and no `auto_claim` update is created.

**API change — conditional auto-claim:**
The report creation route currently writes an `auto_claim` report update and sets status to `in_progress` whenever the submitter is an admin/responder. Add an optional `assignToSelf: boolean` field to the submission payload. If `false`, skip the auto-claim step and leave status as `open`.

**Responder dashboard — surface unassigned reports:**
Unassigned `open` reports should be clearly visible on the responder dashboard with a prominent "Take it" / "Claim" button. This already partially exists since the claim flow is built — it just needs the unassigned open reports to be surfaced more prominently, perhaps as their own section: "Needs a Responder".

**No data model changes needed** — the existing `status` and report update types (`claim`, `auto_claim`) already support this. It's purely a behaviour change on submission and a UI change on the dashboard.

---

### Files that will need changes
- `artifacts/app/src/pages/reports/SubmitReport.tsx` — add "Assign to me" toggle (admin-only)
- `artifacts/api-server/src/routes/reports.ts` — make auto-claim conditional on `assignToSelf`
- `artifacts/app/src/pages/groups/ReportsDashboard.tsx` — add "Needs a Responder" section for open unassigned reports

## Planned Feature: Zone-Based Responder Routing

### Goal
Allow group admins to assign responders to one or more named map boundaries (zones). Responders assigned to specific zones see **only** the reports that fall within their zones. Responders not assigned to any zone retain the current behaviour — they see all reports.

### Problem
A group with a large area (e.g. a river divided into North Beat, South Beat, Lake Zone) currently shows every responder every report across the whole area. As groups scale, responders get overwhelmed with irrelevant incidents outside their patch.

### What exists today
- `map_boundaries` table — named polygon/line boundaries per group, with `geometry` (GeoJSON stored as JSONB)
- `map_sections` table — sub-divisions of a boundary
- `group_members` + `group_member_permissions` — per-member role and permission flags
- No link between a member and a boundary exists yet
- Reports have `latitude` / `longitude` but are not tagged with a boundary ID

---

### Data model changes

**New join table: `boundary_responders`**
```
boundary_responders
  id          uuid  PK
  boundary_id uuid  FK → map_boundaries.id  (cascade delete)
  member_id   uuid  FK → group_members.id   (cascade delete)
  group_id    uuid  FK → groups.id          (cascade delete — belt + braces index)
  created_at  timestamp
```
One row per (boundary, member) pair. A responder can have many rows (multiple zones). No row = unzoned (sees everything).

**`incident_reports` table — new nullable column:**
```
boundary_id  uuid  FK → map_boundaries.id  nullable
```
Populated at report creation by a point-in-polygon check against the group's active boundaries. If the report has no GPS or falls outside all drawn zones, `boundary_id` stays null and the report is visible to all responders.

---

### Backend changes

1. **Point-in-polygon on report creation** (`routes/reports.ts`)
   - After inserting a report, load the group's active boundaries
   - Run a point-in-polygon test (`@turf/boolean-point-in-polygon`) against each boundary's GeoJSON geometry
   - Write the matched `boundary_id` (or null) back to the report row
   - This happens synchronously before the 201 response

2. **Report list filter** (`routes/reports.ts` — `GET /groups/:slug/reports`)
   - After auth, look up whether the requesting user has any `boundary_responder` rows for this group
   - If they do → add a `WHERE boundary_id IN (...)` filter to the reports query
   - If they don't (or they're an admin) → no filter, see everything as today

3. **New boundary member endpoints** (`routes/boundaries.ts`)
   - `GET  /groups/:slug/boundaries/:boundaryId/responders` — list assigned responders
   - `POST /groups/:slug/boundaries/:boundaryId/responders` — assign a member `{ memberId }`
   - `DELETE /groups/:slug/boundaries/:boundaryId/responders/:memberId` — remove assignment
   - All require admin auth

---

### Frontend changes

**Map Boundaries page (`/g/:slug/map`)**
- For each saved boundary in the sidebar list, add an "Assign Responders" expandable panel
- Panel shows current assignees (avatar + name + remove button)
- Dropdown/search to add a member (filtered to members with responder role)

**Reports Dashboard filter behaviour**
- If the logged-in user is a zone-restricted responder, a subtle info banner: "Showing reports in your assigned zones"
- Admin users always see all reports; no change for them

---

### What this does NOT include
- Auto-routing notifications by zone (can follow as a separate feature)
- Members (non-responders) being zone-restricted
- Sub-zone nesting beyond the existing boundary → sections hierarchy

---

### Files that will need changes
- `lib/db/src/schema/boundaries.ts` — add `boundary_responders` table; add `boundaryId` nullable FK to `incident_reports`
- `artifacts/api-server/src/routes/reports.ts` — point-in-polygon tagging on create; zone filter on list
- `artifacts/api-server/src/routes/boundaries.ts` — three new responder assignment endpoints
- `lib/api-spec/openapi.yaml` — document new endpoints + new `boundaryId` field on report
- `artifacts/app/src/pages/groups/MapBoundaries.tsx` — "Assign Responders" panel per boundary
- `artifacts/app/src/pages/groups/ReportsDashboard.tsx` — zone-restricted info banner

---

## Future Development (Logged)

- **Frontend error capture** — Add Sentry to capture React/JavaScript crashes in the browser. Server-side errors are already captured in the Super Admin error log. Frontend capture is low priority until active user base grows. 30-minute job when needed.

## User Preferences

- Platform is general-purpose — no fishing/sport-specific terminology
- Report submission page is mobile-first with large touch targets
- Pricing in EUR only (€20/month, €200/year)
- Free trial is 1 month, no credit card required
- Report immutability is non-negotiable (legal/court use)
