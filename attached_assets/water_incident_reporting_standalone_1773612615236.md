# Water Incident Reporting System — Standalone Project Brief

## What We're Building

A web platform that lets angling clubs monitor and respond to environmental incidents on their registered waters. Any registered member can submit a report from their phone. The club's designated responders (bailiffs, water keepers) receive instant notifications and manage the response through a dashboard.

This is a **SaaS product** — clubs pay a monthly or annual subscription to access the feature.

---

## Business Model

- Clubs subscribe via Stripe to unlock the feature
- **Monthly plan**: €30/month
- **Annual plan**: €300/year (saves 2 months)
- **Early adopter offer**: 6-month free trial for founding clubs
- Platform admins can manually activate any club for free (for demos or partnerships)
- A global on/off toggle lets platform admins hide the entire system when needed

---

## How It Works — End to End

### Step 1 — Club Subscribes
The club admin visits a pricing page, selects a plan, and completes a Stripe checkout. On success, their subscription is activated and they gain access to the setup tools.

### Step 2 — Club Draws Water Boundaries
Using an interactive map, the admin draws the outline of their water (polygon for lakes, line with buffer for rivers). Boundaries are stored as GeoJSON. Multiple waters can be registered.

### Step 3 — Club Divides Waters into Sections (Optional)
The admin can split a water into named sections (e.g. "Upper Beat", "North Shore", "Pier Area") for more precise report routing.

### Step 4 — Club Assigns Responders
The admin picks club members to act as responders, gives them a role title (Bailiff, Water Keeper, Conservation Officer, etc.), and sets their notification preferences (push notification, email, or both). Responders can be assigned to the whole water or specific sections only.

### Step 5 — Public Sees the Report Page
The report page is publicly visible for SEO purposes. Non-logged-in visitors see information about water incident reporting and a prompt to register or log in.

### Step 6 — Member Submits a Report
Logged-in members get the full submission form:
- GPS auto-detection (with manual map pin drop as fallback)
- Incident type selection (10 types — see below)
- Severity level (low / medium / high / emergency)
- Description field with voice-to-text support (Web Speech API)
- Photo upload — camera capture or file picker, multiple photos
- Anonymous toggle — the reporter can hide their identity from responders

### Step 7 — Report Auto-Routes to the Right Club
The GPS coordinates are checked against all registered water boundaries using server-side point-in-polygon matching. The report is automatically linked to the matching club.

### Step 8 — Responders Are Notified
All active responders for that water or section receive:
- An in-app notification
- A push notification (Web Push using VAPID keys)
- An email

### Step 9 — Responders Action the Report
The club admin dashboard shows all reports with stats, filters, and a map of incident pins. On the report detail page a responder can:
- **Claim it** — "I'm on it" (records who is handling it)
- **Add notes** — text, voice-to-text, or attach more photos
- **Update status**: submitted → acknowledged → in progress → resolved / escalated
- **Escalate** — to IFI (Inland Fisheries Ireland), EPA, Gardaí, or local authority

### Step 10 — Reporter Tracks Progress
A "My Reports" page shows the member all their submitted reports with status badges, and they can tap through to see the full activity timeline.

---

## Incident Types

| Value | Display Label |
|---|---|
| pollution | Water Pollution |
| fish_kill | Fish Kill |
| poaching | Poaching |
| illegal_netting | Illegal Netting |
| blocked_waterway | Blocked Waterway |
| invasive_species | Invasive Species |
| storm_damage | Storm Damage |
| antisocial | Antisocial Behaviour |
| water_level | Water Level Concern |
| other | Other |

## Severity Levels

| Value | Meaning |
|---|---|
| low | Not urgent, logged for the record |
| medium | Needs attention soon |
| high | Significant environmental impact |
| emergency | Immediate danger or major fish kill event |

## Report Status Flow

```
submitted → acknowledged → in_progress → resolved
                                       → escalated
```

---

## Reference Numbers

Every report gets a human-readable reference number in the format `IR-YYYY-NNNNN` (e.g. `IR-2025-00042`). Useful for follow-up calls and escalation paperwork.

---

## Database Schema

Nine tables are required.

### `reporting_subscriptions`
Tracks each club's Stripe subscription.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| club_id | integer | FK to clubs table |
| stripe_customer_id | varchar | |
| stripe_subscription_id | varchar | |
| stripe_price_id | varchar | monthly or annual price ID |
| plan_type | varchar | 'monthly' or 'annual' |
| status | varchar | trialing, active, past_due, cancelled, manual |
| is_early_adopter | boolean | default false |
| trial_ends_at | timestamp | |
| current_period_start | timestamp | |
| current_period_end | timestamp | |
| activated_by | integer | user ID if manually activated |
| created_at | timestamp | |
| updated_at | timestamp | |

### `reporting_waters`
Each registered water boundary belonging to a club.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| club_id | integer | FK to clubs table |
| name | varchar | e.g. "Lough Conn" |
| water_type | varchar | 'lake', 'river', 'sea', 'canal', 'reservoir' |
| boundary_geojson | text | GeoJSON polygon/feature |
| buffer_metres | integer | for river lines, default 50 |
| is_active | boolean | default true |
| created_at | timestamp | |

### `reporting_water_sections`
Named sub-sections within a water.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| water_id | integer | FK to reporting_waters |
| club_id | integer | FK to clubs table |
| name | varchar | e.g. "Upper Beat" |
| boundary_geojson | text | GeoJSON for this section |
| sort_order | integer | |
| created_at | timestamp | |

### `reporting_responders`
Club members assigned as responders.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| club_id | integer | |
| water_id | integer | FK to reporting_waters |
| user_id | integer | FK to users table |
| role_title | varchar | e.g. "Bailiff", "Water Keeper" |
| notify_push | boolean | default true |
| notify_email | boolean | default true |
| is_active | boolean | default true |
| created_at | timestamp | |

### `reporting_responder_sections`
Which sections each responder covers (empty = covers whole water).

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| responder_id | integer | FK to reporting_responders |
| section_id | integer | FK to reporting_water_sections |

### `incident_reports`
Each submitted incident report.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| reference_number | varchar | IR-YYYY-NNNNN, unique |
| club_id | integer | matched club (nullable if no match) |
| water_id | integer | matched water (nullable) |
| section_id | integer | matched section (nullable) |
| reporter_user_id | integer | FK to users |
| is_anonymous | boolean | hide reporter from responders |
| incident_type | varchar | see incident types above |
| severity | varchar | low/medium/high/emergency |
| description | text | |
| latitude | decimal(10,7) | |
| longitude | decimal(10,7) | |
| location_description | varchar | reverse geocoded or manual |
| status | varchar | submitted/acknowledged/in_progress/resolved/escalated |
| claimed_by_user_id | integer | responder who claimed it |
| claimed_at | timestamp | |
| resolved_at | timestamp | |
| escalated_to | varchar | IFI/EPA/Gardai/local_authority |
| escalation_notes | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `incident_report_photos`
Photos attached to a report (at submission or added later by responders).

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| report_id | integer | FK to incident_reports |
| uploaded_by_user_id | integer | |
| file_path | varchar | relative path to stored file |
| file_size | integer | bytes |
| is_primary | boolean | thumbnail/hero image |
| created_at | timestamp | |

### `incident_report_updates`
Full activity timeline — every action taken on a report.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| report_id | integer | FK to incident_reports |
| user_id | integer | who took the action |
| update_type | varchar | status_change/note/photo/claim/escalation |
| old_status | varchar | previous status if status change |
| new_status | varchar | new status if status change |
| notes | text | free text note |
| created_at | timestamp | |

### `platform_settings`
Simple key-value table for global platform configuration.

| Column | Type | Notes |
|---|---|---|
| setting_key | varchar PK | |
| setting_value | text | |
| updated_at | timestamp | |

Seed with: `INSERT INTO platform_settings (setting_key, setting_value) VALUES ('reporting_enabled', 'true');`

---

## Pages & Files to Build

### Public Pages
| Page | Path | Who Sees It |
|---|---|---|
| Report an Incident | /report_incident | Everyone (SEO) — form only for logged-in |
| My Reports | /my_reports | Logged-in members only |

### Club Admin Pages
| Page | Path | Purpose |
|---|---|---|
| Subscribe | /admin/reporting_subscribe | Pricing + Stripe checkout |
| Water Setup | /admin/reporting_setup | Draw water boundaries on map |
| Sections | /admin/reporting_sections | Divide water into named sections |
| Responders | /admin/reporting_responders | Assign and manage responders |
| Billing | /admin/reporting_billing | Stripe customer portal link |
| Reports Dashboard | /admin/reporting_dashboard | All reports, stats, map, filters |
| Report Detail | /admin/report_detail | Full report + action timeline |

### Super Admin Pages
| Page | Path | Purpose |
|---|---|---|
| Reporting Management | /superadmin/reporting_management | View all subscriptions, manually activate, revenue overview, global toggle |

---

## Core Helper Functions Needed

```
club_has_reporting($clubId)              — check active subscription
create_incident_report($data)            — insert report, generate reference number
get_incident_types()                     — return array of type options
get_severity_levels()                    — return array of severity options
get_report_status_badge($status)         — return styled badge HTML
match_location_to_water($lat, $lng)      — point-in-polygon, returns club/water/section
notify_responders($report)               — push + email + in-app to relevant responders
get_club_reports($clubId, $filters)      — filtered list for club admin
get_user_reports($userId)               — reporter's own reports
claim_report($reportId, $userId)         — "I'm on it" action
update_report_status($reportId, $status, $userId, $notes)
add_report_update($reportId, $userId, $type, $data)
is_reporting_enabled()                   — check global toggle
set_reporting_enabled($bool)             — update global toggle
```

---

## Stripe Integration

Use direct cURL API calls — no PHP SDK needed.

**Functions needed:**
- `create_stripe_checkout_session($clubId, $planType, $isEarlyAdopter)` — returns checkout URL
- `create_stripe_portal_session($stripeCustomerId)` — returns portal URL
- `handle_stripe_webhook($payload, $sigHeader)` — verify signature and process events
- `activate_reporting_subscription($clubId, $stripeData)` — create/update subscription record
- `deactivate_reporting_subscription($clubId)` — cancel on failed payment or deletion

**Webhook events to handle:**
- `checkout.session.completed` — activate subscription
- `invoice.paid` — renew/confirm active
- `invoice.payment_failed` — mark as past_due
- `customer.subscription.updated` — sync plan changes
- `customer.subscription.deleted` — deactivate

**Environment variables needed:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID` (use `price_xxx` format, not the product ID)
- `STRIPE_ANNUAL_PRICE_ID`

---

## Notification System

Three notification channels are used simultaneously when a report comes in:

1. **In-app** — a notification record in the notifications table
2. **Email** — sent via PHPMailer with report details, incident type, severity, map link
3. **Push** — Web Push using VAPID keys (`minishlink/web-push` PHP library)

**Environment variables for push:**
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — typically `mailto:admin@yourdomain.com`

---

## Map Implementation

Use **Leaflet.js 1.9.4** (CDN) for all maps.

- Centered on Ireland: lat `53.4`, lng `-7.9`, zoom `7`
- Use **Leaflet.draw 1.0.4** (CDN) for the water boundary drawing tool
- Drawing tools: polygon (lakes/reservoirs), polyline with buffer (rivers)
- Boundaries saved as GeoJSON strings in the database
- Incident pin colours by incident type and severity

---

## Photo Upload

- Accept camera capture and file picker input
- Allow multiple photos per report
- Process with PHP GD library — resize to max 1920px wide, convert to JPEG
- Store in `uploads/incident_reports/{report_id}/`
- Primary photo used as thumbnail on cards and dashboard map pins

---

## Voice-to-Text

Use the browser's **Web Speech API** (works in Chrome, Edge, Safari on iOS 16.4+).

A microphone button beside the description textarea starts recording. Transcription populates the textarea. Gracefully hidden if the browser doesn't support it.

---

## Access Control Rules

| Role | Access |
|---|---|
| Public (not logged in) | Can see report page SEO content only |
| Logged-in member | Can submit reports, view own reports |
| Club admin (subscribed) | Full dashboard, water setup, responder management |
| Club admin (not subscribed) | Pricing/subscribe page only |
| Responder | Receives notifications, can action reports via dashboard |
| Platform super admin | Full access always, global toggle, manual activation |

---

## Anonymous Reporting

When a member checks the anonymous box:
- Their user ID is still stored internally (for accountability)
- Responders and club admins see "Anonymous Reporter" with no name or contact
- Super admins can always see the reporter identity
- The timeline shows actions without exposing reporter details

---

## Design Notes

- **Mobile-first** — cards over tables everywhere, large tap targets
- Camera/GPS features designed for use in the field on a phone
- Severity colours: low = blue, medium = orange, high = red, emergency = dark red pulsing
- Status badges: submitted = grey, acknowledged = blue, in_progress = amber, resolved = green, escalated = purple
- Incident type icons using Bootstrap Icons

---

## Tech Stack (as originally built)

- **Backend**: PHP (no framework)
- **Database**: PostgreSQL in dev / MySQL in production — write migration files for both
- **Maps**: Leaflet.js 1.9.4 + Leaflet.draw 1.0.4
- **Payments**: Stripe via cURL (no SDK)
- **Push notifications**: minishlink/web-push PHP library
- **Email**: PHPMailer
- **Photo processing**: PHP GD library
- **Voice-to-text**: Web Speech API (browser native)
- **Frontend**: Bootstrap 5 + Bootstrap Icons

---

## What You Need Before Starting

1. A **Stripe account** with:
   - One product created (e.g. "Incident Reporting Subscription")
   - Two prices: monthly (€30) and annual (€300)
   - A webhook endpoint pointing to `/api/stripe_webhook`

2. **VAPID key pair** for push notifications — generate once with a VAPID tool and store as environment secrets

3. **SMTP credentials** for sending emails

4. A **`uploads/incident_reports/`** directory with write permissions on your server

5. The **9 database tables** created from the schema above

6. A **users table** and **clubs table** already in place (this system sits on top of an existing user/club structure)
