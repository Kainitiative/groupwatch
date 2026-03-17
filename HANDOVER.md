# GroupWatch Platform — Complete Project Handover

## 1. What It Is

GroupWatch Platform is a **general-purpose group incident reporting SaaS platform** for any organised group — angling clubs, environmental groups, neighbourhood watch, HOAs, sports clubs, etc. Groups sign up, customise their incident categories, and members (or the public) can submit geo-tagged, photo-attached incident reports. Responders claim and resolve reports from a dashboard. Everything is self-contained per group.

**Pricing:** €20/month or €200/year. One-month free trial, no card required.  
**Target infrastructure:** LetsHost VPS, Dublin — 2 CPU / 4 GB RAM — Docker + Nginx + Let's Encrypt + PostgreSQL.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Routing | Wouter |
| UI components | shadcn/ui (Radix + Tailwind) |
| Server state | TanStack Query v5 |
| API client | Orval-generated hooks (OpenAPI → React Query) |
| Backend | Express.js + TypeScript (tsx in dev, esbuild in prod) |
| Database ORM | Drizzle ORM |
| Database | PostgreSQL |
| Sessions | express-session + connect-pg-simple (cookie-based) |
| Payments | Stripe (Checkout + Customer Portal) |
| Email | Nodemailer (SMTP) |
| Push notifications | web-push (VAPID) |
| Photo uploads | Multer + disk storage |
| EXIF extraction | exifr |
| Monorepo | pnpm workspaces |

---

## 3. Repository Structure

```
/
├── artifacts/
│   ├── api-server/          Express API (port 8080)
│   │   └── src/
│   │       ├── app.ts       Express setup, CORS, global error handler
│   │       ├── index.ts     Server entry point
│   │       ├── lib/
│   │       │   ├── auth.ts          Password hashing (bcrypt)
│   │       │   ├── email.ts         Nodemailer email helpers
│   │       │   ├── groups.ts        Shared DB helpers (getGroupBySlug, etc.)
│   │       │   ├── logError.ts      Writes errors to error_logs table
│   │       │   ├── push.ts          Web push to group responders
│   │       │   └── session.ts       express-session middleware + requireAuth
│   │       └── routes/
│   │           ├── admin.ts         Super admin API
│   │           ├── analytics.ts     Group analytics
│   │           ├── api-keys.ts      API key management
│   │           ├── auth.ts          Register / login / password reset
│   │           ├── billing.ts       Stripe checkout, portal, webhooks
│   │           ├── boundaries.ts    Map boundaries (polygons)
│   │           ├── escalation.ts    Escalation contacts
│   │           ├── groups.ts        Group CRUD + settings
│   │           ├── health.ts        GET /api/health
│   │           ├── incident-types.ts  Custom incident categories
│   │           ├── members.ts       Invites, join requests, roles
│   │           ├── push.ts          Push subscription register/unregister
│   │           ├── reports.ts       Submit, list, claim, update, photo upload
│   │           ├── users.ts         Profile management
│   │           ├── v1.ts            Public REST API v1
│   │           └── widget.ts        Public report widget endpoints
│   │
│   └── app/                 React frontend (port auto-assigned)
│       └── src/
│           ├── App.tsx              All routes
│           ├── components/
│           │   ├── layout/
│           │   │   ├── SidebarLayout.tsx   Main authenticated layout
│           │   │   └── PublicLayout.tsx    Layout for public pages
│           │   ├── PwaPrompts.tsx          Install + update prompts
│           │   └── ui/                    shadcn/ui components
│           ├── hooks/
│           ├── pages/
│           │   ├── Landing.tsx
│           │   ├── Pricing.tsx
│           │   ├── Features.tsx
│           │   ├── Help.tsx / Legal.tsx / Contact.tsx
│           │   ├── OfflinePwa.tsx
│           │   ├── auth/
│           │   │   ├── Login.tsx
│           │   │   ├── Register.tsx
│           │   │   ├── ForgotPassword.tsx
│           │   │   └── ResetPassword.tsx
│           │   ├── groups/
│           │   │   ├── GroupProfile.tsx      Public group page
│           │   │   ├── GroupSettings.tsx     Settings tabs (profile, members, types, escalation, billing, widget, api-keys)
│           │   │   ├── CreateGroup.tsx
│           │   │   ├── ReportsDashboard.tsx  Responder/admin incident list
│           │   │   ├── ReportDetail.tsx      Full report view + timeline
│           │   │   ├── ReportPrint.tsx       Print-optimised report view
│           │   │   ├── Analytics.tsx         Charts and metrics
│           │   │   ├── MapBoundaries.tsx     Draw/edit map boundary polygons
│           │   │   └── PublicReport.tsx      Public embed widget (/r/:slug)
│           │   ├── reports/
│           │   │   ├── SubmitReport.tsx      Member report submission
│           │   │   └── MyReports.tsx         User's own report history
│           │   ├── admin/
│           │   │   └── SuperAdmin.tsx        Platform owner dashboard
│           │   └── pillar/
│           │       ├── AnglingClubs.tsx
│           │       ├── EnvironmentalGroups.tsx
│           │       ├── SportsClubs.tsx
│           │       ├── NeighbourhoodWatch.tsx
│           │       └── HOA.tsx
│           └── main.tsx
│
├── lib/
│   ├── db/                  Drizzle schema + DB client
│   │   └── src/
│   │       ├── index.ts     Exports pool, db, and all schema
│   │       └── schema/
│   │           ├── users.ts
│   │           ├── groups.ts
│   │           ├── members.ts
│   │           ├── incident-types.ts
│   │           ├── reports.ts
│   │           ├── escalation.ts
│   │           ├── push.ts
│   │           ├── boundaries.ts
│   │           └── platform.ts
│   └── api-client-react/    Orval-generated React Query hooks
│       └── src/generated/
│           ├── api.ts       All hooks (useLogin, useCreateReport, etc.)
│           └── api.schemas.ts
│
├── deploy/
│   ├── nginx/nginx.conf     TLS, HTTP→HTTPS, gzip, security headers
│   └── ...
├── Dockerfile               Multi-stage: builds frontend + API, serves both
├── docker-compose.yml       app + nginx services, uploads volume
└── .github/workflows/deploy.yml  Build → push GHCR → SSH deploy
```

---

## 4. Database Schema (17 tables)

| Table | Purpose |
|---|---|
| `users` | Accounts (name, email, hashed password, isSuperAdmin) |
| `password_reset_tokens` | Time-limited tokens for password reset |
| `groups` | Groups (name, slug, type, logo, brand colour, public flags, join token) |
| `subscriptions` | Stripe subscription state per group (trial/active/past_due/cancelled, plan, trial end date) |
| `setup_progress` | Onboarding checklist state per group |
| `group_members` | User ↔ Group membership (role: admin/member/responder, status: active/invited/suspended) |
| `group_member_permissions` | Fine-grained permissions per member (canViewDashboard, canRespondToReports, etc.) |
| `join_requests` | Pending requests from users to join a group |
| `member_invites` | Email invites sent by admins (token + expiry) |
| `incident_types` | Custom incident categories per group (name, colour, icon, severity levels) |
| `incident_reports` | Reports (reference number, GPS, severity, status, immutable after creation) |
| `report_photos` | Photos attached to reports (URL, EXIF GPS, timestamp) |
| `report_updates` | Append-only audit trail (claim, status_change, note, photo_added, escalation) |
| `escalation_contacts` | Named contacts + phone/email for escalation notifications |
| `push_subscriptions` | Browser push subscriptions (endpoint, keys) |
| `map_boundaries` / `map_sections` | GeoJSON polygon boundaries per group |
| `platform_settings` | Global platform flags (maintenanceMode, reportingEnabled) |
| `api_keys` | Per-group API keys (SHA-256 hashed, prefix shown only once) |
| `error_logs` | Server-side error log (level, message, stack, path, status code) |

**Key design rules:**
- `incident_reports` is **immutable** after creation — all changes are new rows in `report_updates`
- `report_updates` is **append-only** — never updated or deleted
- Report reference numbers are human-readable (e.g. `ARK-2026-0042`)

---

## 5. Frontend Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Landing | Public |
| `/pricing` | Pricing (€20/mo, €200/yr) | Public |
| `/features` | Features overview | Public |
| `/help` | Help / FAQ | Public |
| `/legal` | Terms & Privacy | Public |
| `/contact` | Contact form | Public |
| `/offline` | PWA offline fallback | Public |
| `/for/angling` | Angling clubs pillar page | Public |
| `/for/environment` | Environmental groups pillar | Public |
| `/for/sports` | Sports clubs pillar | Public |
| `/for/neighbourhood-watch` | Neighbourhood watch pillar | Public |
| `/for/residents` | HOA / residents pillar | Public |
| `/register` | Register | Public |
| `/login` | Login | Public |
| `/forgot-password` | Request reset | Public |
| `/reset-password/:token` | Confirm reset | Public |
| `/r/:slug` | Public report widget (embeddable) | Public |
| `/g/:slug` | Group public profile | Public |
| `/dashboard` | User dashboard (groups list) | Auth |
| `/groups/new` | Create a group | Auth |
| `/g/:slug/reports` | Reports dashboard | Auth |
| `/g/:slug/reports/:ref` | Report detail + timeline | Auth |
| `/g/:slug/reports/:ref/print` | Print view | Auth |
| `/g/:slug/analytics` | Analytics charts | Auth |
| `/g/:slug/map` | Map boundary editor | Auth |
| `/g/:slug/settings` | Group settings (7 tabs) | Auth (admin) |
| `/my-reports` | User's own submitted reports | Auth |
| `/admin` | Super admin panel | Auth + isSuperAdmin |

---

## 6. API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/password-reset/request
POST   /api/auth/password-reset/confirm
```

### Users
```
GET    /api/users/me/profile
PATCH  /api/users/me/profile
```

### Groups
```
GET    /api/groups                   (my groups)
POST   /api/groups
GET    /api/groups/:slug
PATCH  /api/groups/:slug
GET    /api/groups/:slug/join-link
POST   /api/groups/:slug/join        (via token)
GET    /api/groups/:slug/setup-progress
```

### Members
```
GET    /api/groups/:slug/members
POST   /api/groups/:slug/members/invite
GET    /api/groups/:slug/join-requests
POST   /api/groups/:slug/join-requests/:id/respond
PATCH  /api/groups/:slug/members/:userId
DELETE /api/groups/:slug/members/:userId
```

### Incident Types
```
GET    /api/groups/:slug/incident-types
POST   /api/groups/:slug/incident-types
PATCH  /api/groups/:slug/incident-types/:id
DELETE /api/groups/:slug/incident-types/:id
```

### Reports
```
GET    /api/groups/:slug/reports          (list, filterable)
GET    /api/groups/:slug/reports/stats
POST   /api/groups/:slug/reports          (submit)
GET    /api/groups/:slug/reports/:ref
POST   /api/groups/:slug/reports/:ref/updates   (status, note, claim)
POST   /api/groups/:slug/reports/:ref/photos
GET    /api/photos/:photoId
GET    /api/my-reports
```

### Escalation
```
GET    /api/groups/:slug/escalation-contacts
POST   /api/groups/:slug/escalation-contacts
PATCH  /api/groups/:slug/escalation-contacts/:id
DELETE /api/groups/:slug/escalation-contacts/:id
```

### Map Boundaries
```
GET    /api/groups/:slug/boundaries
POST   /api/groups/:slug/boundaries
PATCH  /api/groups/:slug/boundaries/:id
DELETE /api/groups/:slug/boundaries/:id
```

### Analytics
```
GET    /api/groups/:slug/analytics
```

### API Keys
```
GET    /api/groups/:slug/api-keys
POST   /api/groups/:slug/api-keys
DELETE /api/groups/:slug/api-keys/:id
```

### Public Widget
```
GET    /api/widget/:slug              (incident types for the group)
POST   /api/widget/:slug/reports      (rate-limited: 10/IP/hour)
```

### Public REST API v1
```
GET    /api/v1/groups/:slug/incident-types    (Bearer token)
GET    /api/v1/groups/:slug/incidents         (Bearer token)
POST   /api/v1/groups/:slug/incidents         (Bearer token)
```

### Billing
```
POST   /api/billing/:slug/checkout     (creates Stripe Checkout session)
POST   /api/billing/:slug/portal       (creates Stripe Customer Portal session)
GET    /api/billing/:slug/status
POST   /api/billing/webhooks           (Stripe webhook — raw body)
```

### Push Notifications
```
GET    /api/push/vapid-public-key
POST   /api/push/subscribe
DELETE /api/push/unsubscribe
```

### Super Admin
```
GET    /api/admin/groups
POST   /api/admin/groups/:slug/activate
GET    /api/admin/users
PATCH  /api/admin/users/:userId
GET    /api/admin/platform-settings
PATCH  /api/admin/platform-settings
GET    /api/admin/revenue
GET    /api/admin/errors
DELETE /api/admin/errors
DELETE /api/admin/errors/:id
```

---

## 7. GroupSettings Tabs

The settings page at `/g/:slug/settings` has 7 tabs, deep-linkable via `?tab=xxx`:

| Tab key | Content |
|---|---|
| `profile` | Name, description, logo, cover image, brand colour, website, social links, contact email |
| `members` | Member list, invite by email, approve/reject join requests, change roles, remove members |
| `incident-types` | Create/edit/delete custom incident categories with name, colour, icon |
| `escalation` | Escalation contacts (name, phone, email, role). Auto-escalation rules |
| `billing` | Current plan status, upgrade/downgrade to monthly or annual, Customer Portal link |
| `widget` | Toggle public reporting, embed `<iframe>` code, QR code for the `/r/:slug` widget |
| `api-keys` | Create and revoke API keys (shown once in full, stored as SHA-256 hash) |

---

## 8. What's Built vs What's Not

### ✅ Complete
- Auth (register, login, logout, password reset via email link)
- Welcome email on registration
- Group creation, settings, member management
- Custom incident types per group
- Incident report submission (GPS, photos, severity, anonymous option)
- EXIF metadata extraction from photos (GPS coordinates, taken-at timestamp)
- Report detail view with full audit timeline
- Report print view
- Responder claim + status change workflow (open → in_progress → escalated → resolved)
- Escalation contacts management
- Map boundary drawing / editing (GeoJSON polygons)
- Analytics page (report volume charts, type breakdown, response times)
- Public group profile page
- Onboarding setup checklist
- Stripe Checkout and Customer Portal (upgrade/downgrade/cancel)
- Stripe webhook handler (basic event handling)
- Public report widget (`/r/:slug`) with rate limiting (10/IP/hour)
- Widget embed code + QR code in GroupSettings
- API keys (create, revoke, SHA-256 stored, shown once)
- Public REST API v1 (Bearer token auth)
- PWA — installable, offline fallback page, install + update prompts
- Web push to group responders on new report (requires VAPID keys)
- Super admin panel (revenue KPIs, groups table, users management, platform settings, error log)
- Global error handler → writes to `error_logs` table
- Deployment files — Dockerfile, docker-compose, nginx.conf, GitHub Actions CI/CD
- Public content pages: Landing, Pricing, Features, Help, Legal, Contact
- Pillar pages for 5 group types (angling, environment, sports, neighbourhood watch, HOA)

### ❌ Not Built / Incomplete

| Item | Notes |
|---|---|
| **Email notifications on reports** | No email sent when a report is submitted, claimed, or status changes. `email.ts` exists and has welcome/reset templates — needs 2–3 new functions |
| **Stripe webhook: subscription lifecycle** | Webhook route exists and verifies signature, but `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted` events are not yet acted on to update the `subscriptions` table |
| **Trial expiry enforcement** | Nothing checks whether a trial has expired and blocks access accordingly |
| **Email verification** | New users are not asked to verify their email address before using the app |
| **Group analytics: map view** | GPS coordinates are stored per report but never visualised on a map in the analytics/dashboard |
| **Report CSV / PDF export** | Admins cannot bulk-export their reports |
| **Audit log for admin actions** | No record of who changed group settings, who added/removed members, etc. |
| **Marketing emails / transactional** | No trial expiry reminder email, no "your trial ends in 3 days" nudge |

---

## 9. Environment Variables

Create a `.env` file (see `.env.example` in the repo root):

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/groupwatch
SESSION_SECRET=<random 64-char string>
NODE_ENV=production
PORT=8080
APP_URL=https://yourdomain.com

# Stripe (required for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...

# Email / SMTP (required for password reset + welcome emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=yourpassword
EMAIL_FROM=noreply@yourdomain.com

# Web Push (optional — push notifications work only when set)
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@yourdomain.com
```

**In dev (Replit):** `DATABASE_URL` and `STRIPE_SECRET_KEY` are already set as secrets.  
`VAPID_PRIVATE_KEY` and `VAPID_EMAIL` are flagged as missing — push notifications will silently skip if not set.

---

## 10. Accounts & Test Data

| Email | Password | Role |
|---|---|---|
| `secretary.kai@gmail.com` | (set during registration) | Super admin, member of Arklow Open |
| `admin@test.io` | (set during registration) | Admin of Test Angling Club |

**Test groups:**
- `arklow-open` — public reporting enabled, incident types: Poaching, Illegal fishing
- `test-angling` — standard trial group

The super admin flag is set in the database (`is_super_admin = true` on `users`). There is no UI to set the first super admin — it must be done directly in the database.

---

## 11. Key Implementation Notes / Gotchas

1. **Orval hooks use `{ data: {...} }` as the body key** — all mutations must wrap the payload as `{ data: { ...fields } }`, not just `{ ...fields }`.

2. **Admin endpoints have no Orval-generated hooks** — they were added to the API server after the OpenAPI spec was generated. The SuperAdmin page uses direct `fetch()` calls wrapped in `useQuery`/`useMutation` from TanStack Query.

3. **`exifr` must be default-imported**: `import exifr from "exifr"` — not `import { parse } from "exifr"`.

4. **Production static files** are served from `process.cwd()/public` — the Dockerfile copies the built frontend into `/app/artifacts/api-server/public` which is where `process.cwd()` resolves to (WORKDIR is `/app/artifacts/api-server`).

5. **Production build command**: `node dist/index.cjs` — esbuild outputs `.cjs`, not `.js`.

6. **Session store** uses `connect-pg-simple` — sessions are stored in the `session` table in PostgreSQL. Sessions survive server restarts.

7. **GroupSettings tab deep-linking**: reads `?tab=xxx` from the URL on mount. Valid values: `profile`, `members`, `incident-types`, `escalation`, `billing`, `widget`, `api-keys`.

8. **API key format**: `iiq_<base64url 32 bytes>`. The full key is shown exactly once at creation. The stored value is a SHA-256 hash. The prefix (`iiq_XXXXXX`) is stored separately for display purposes.

9. **Light theme default**: `:root` background is near-white (`210 20% 98%`). Never use `text-white` outside a dark card context — always use `text-foreground` / `text-muted-foreground`.

10. **DB type compilation**: The `lib/db` package requires `tsc -b lib/db` before type-checking the api-server. In dev this happens automatically via `tsx`.

---

## 12. Deployment (VPS)

The deployment is fully scripted. See `/deploy/` and `Dockerfile`.

**One-time setup on VPS:**
```bash
apt install docker.io docker-compose nginx certbot
certbot certonly --standalone -d yourdomain.com
# Copy deploy/nginx/nginx.conf → /etc/nginx/sites-available/groupwatch
# Update domain name in nginx.conf
```

**GitHub Actions CI/CD** (`.github/workflows/deploy.yml`):
- Triggers on push to `main`
- Builds Docker image, pushes to GitHub Container Registry
- SSHs to VPS, pulls new image, runs `docker-compose up -d`

**Required GitHub secrets:**
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `GHCR_TOKEN`

**Docker Compose services:**
- `app` — Node.js API + serves built React frontend
- `nginx` — Terminates TLS, reverse-proxies to app on port 8080

---

## 13. What To Do Next (Suggested Priority)

1. **Set up SMTP** — add `SMTP_*` env vars → password reset and welcome emails will work immediately
2. **Add report notification emails** — 2 new functions in `email.ts` + call them in `reports.ts` on submit and status change
3. **Stripe webhook subscription lifecycle** — handle `customer.subscription.updated` and `invoice.payment_failed` in `billing.ts` to keep `subscriptions.status` in sync
4. **Trial expiry middleware** — a simple check on protected group routes: if `subscription.status === 'trial'` and `trialEndsAt < now`, return 402 and redirect to billing
5. **Set VAPID keys** — `npx web-push generate-vapid-keys`, add to env → push notifications to responders work immediately
6. **Landing page polish** — the Landing page exists but may need copywriting and imagery updates before going live
