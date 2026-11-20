# HealthBridge — Implementation Plan

> Derived from [telehealth-platform-spec.md](./telehealth-platform-spec.md).  
> This document is the source of truth for build order, deliverables, and acceptance criteria.

---

## Overview

**Goal:** Production-grade rebuild of a live telehealth clinic with three connected portals on a shared Supabase backend.

| Portal | Audience | Priority |
|--------|----------|----------|
| Admin Portal | Physicians, care team, ops | Phase 2 (daily driver) |
| Patient Portal | Patients | Phase 3 |
| Partner Portal | B2B referral partners | Phase 5 |

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase · Stripe · Vercel

**Repo layout:** one Next.js app at the project root (Firebase-style)

```
HealthBridge/
├── src/
│   ├── app/           ← pages
│   ├── components/    ← UI + layout shells
│   └── lib/
│       ├── supabase/  ← database connection
│       ├── db/        ← table types
│       └── auth/      ← roles + guards
├── supabase/          ← SQL migrations + RLS
├── package.json
└── node_modules/      ← single install at root
```

### Route map (one app, three experiences)

| Prefix | Roles |
|--------|-------|
| `/admin/*` | physician, care_team, admin |
| `/dashboard`, `/orders`, `/messages`, … | patient |
| `/partner/*` | partner, partner_staff |

---

## Phase 1 — Foundation (Auth, DB, RLS)

**Status:** ✅ Complete  
**Goal:** Shared infrastructure every portal depends on.

### Deliverables

- [x] Monorepo scaffold (pnpm + Turborepo)
- [x] Supabase project config + local dev setup
- [x] Database schema (all core tables)
- [x] RLS policies for every patient-data table
- [x] `@app/db` — typed Supabase client
- [x] `@app/auth` — role helpers, session middleware, route guards
- [x] `@app/ui` — base design system (Button, Input, Card, Table, Badge)
- [x] Audit log helper function
- [x] Role helper unit tests
- [ ] RLS policy integration tests (requires local Supabase)

### Schema (Phase 1)

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with role + metadata |
| `patients` | 1:1 with auth user for patient role |
| `treatment_plans` | Active/historical treatment protocols |
| `orders` | Order lifecycle + Stripe link |
| `message_threads` | Patient messaging threads |
| `messages` | Individual messages in threads |
| `documents` | Lab results / uploads (Storage path) |
| `subscriptions` | Stripe subscription mirror |
| `invoices` | Stripe invoice mirror |
| `partners` | B2B org records |
| `partner_referrals` | Referral tracking |
| `partner_payouts` | Payout periods + amounts |
| `audit_log` | Clinical data access audit trail |

### Roles (RLS-enforced)

`patient` · `physician` · `care_team` · `admin` · `partner` · `partner_staff`

### Acceptance Criteria

- Patient can only read own rows (verified by test)
- Partner cannot read another partner's referrals or any clinical data
- Admin/physician can read all patient data; care_team restricted from approval actions
- All clinical reads/writes emit audit_log entries
- No service-role key exposed client-side

---

## Phase 2 — Admin Portal

**Status:** ✅ Complete  
**Goal:** Internal staff daily driver — patient management + order review.

### Deliverables

- [x] Auth login (email/password, session-gated)
- [x] Layout shell (sidebar nav, role-aware menu)
- [x] **Patient list** — searchable/filterable table (status, physician, plan, last activity) + pagination (25/page)
- [x] **Patient detail** — tabbed single-pane: overview, treatment, orders, messages, documents, billing, audit trail
- [x] **Review queue** — orders awaiting approval; approve/deny with required denial reason
- [x] Queue filters: physician, wait time sort
- [x] Server-side enforcement of physician-only approve/deny
- [x] Audit log on every approve/deny/edit
- [x] Audit trail tab on patient detail

### Acceptance Criteria

- Care team can view patients and messages but cannot approve orders
- Physician can approve/deny with reason persisted
- Patient list paginated (25 per page, filters preserved)
- All approve/deny actions write to audit_log

---

## Phase 3 — Patient Portal

**Status:** ✅ Complete (core features)  
**Goal:** Patient-facing dashboard for messaging, refills, and billing.

### Deliverables

- [x] Auth (email/password or magic link)
- [x] **Dashboard** — treatment summary, next refill, order status, unread messages
- [x] **Treatment plan view** — active plan, physician, history
- [x] **Orders & refills** — status timeline, request refill (eligibility-gated)
- [x] **Messaging** — threaded chat, attachments, read receipts
- [x] **Document upload** — private Storage, typed tags
- [x] **Billing** — subscription view, Stripe Customer Portal link, invoice history
- [x] **Profile/settings** — contact info, notification prefs, security
- [ ] Stripe Customer Portal integration (needs Stripe keys)
- [ ] Full messaging UI with send/receive (Phase 3 polish)

### Acceptance Criteria

- No clinical data fetched without RLS scoping to `auth.uid()`
- File uploads use signed URLs only (no public buckets)
- Refill request respects eligibility rules (placeholder until client confirms cadence)

---

## Phase 4 — Unified Inbox (Email Integration)

**Status:** ⏳ Pending  
**Goal:** Admin unified inbox with in-app + email channel.

### Deliverables

- [ ] Unified inbox view (all threads, filter by staff/unread/status)
- [ ] Thread assignment/routing to staff
- [ ] Outbound: reply sends in-app + email
- [ ] Inbound: email webhook maps to patient thread
- [ ] Email provider integration (Resend/Postmark/SendGrid — TBD with client)

### Acceptance Criteria

- Inbound email correctly maps to existing patient thread
- Outbound reply visible in both in-app and email
- Partner/patient cannot access admin inbox routes

---

## Phase 5 — Partner Portal

**Status:** ✅ Complete (core features)  
**Goal:** B2B referral tracking and payouts (status only, no clinical data).

### Deliverables

- [x] Partner org auth
- [x] Refer/enroll form (name, contact, consent)
- [x] Referral status table (referred/enrolled/active/inactive)
- [x] Payout history + pending payout view
- [x] Org profile + payout method
- [ ] RLS negative tests (requires local Supabase)

### Acceptance Criteria

- Negative test: partner A cannot query partner B's referrals
- Negative test: partner cannot access treatment/order/message data for referred patients
- Only enrollment status + payout figures visible

---

## Phase 6 — Reporting Dashboard

**Status:** ⏳ Pending  
**Goal:** Operational metrics for admin leadership.

### Deliverables

- [ ] New patients over time
- [ ] Order approval turnaround time
- [ ] Message response time
- [ ] MRR / churn from Stripe data (webhook-synced)
- [ ] Stripe webhook handler (subscriptions, invoices, payment failures)

### Acceptance Criteria

- Metrics sourced from DB + Stripe webhooks, not polling
- KPI list confirmed with client before custom dashboards

---

## Phase 7 — Later (Out of Scope for Initial Build)

- Lab/bloodwork API integrations
- AI-generated notes from intake data
- Advanced automations
- Stripe Connect for partner payouts (pending client decision)

---

## Open Questions (Confirm With Client)

| # | Question | Blocks |
|---|----------|--------|
| 1 | Refill cadence and eligibility rules | Phase 3 refill logic |
| 2 | Admin permission matrix (physician vs care_team) | Phase 2 RLS fine-tuning |
| 3 | Partner payout calculation + Stripe Connect vs manual | Phase 5 payouts |
| 4 | Email provider + inbound parsing setup | Phase 4 |
| 5 | Single vs multi-user partner org logins | Phase 5 auth |
| 6 | Existing admin portal workflows to preserve | Phase 2 UX |
| 7 | Bloodwork API + AI notes timing | Phase 7 |

---

## Progress Log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-07-26 | 1 | Plan created; monorepo scaffold started |
| 2026-07-26 | 1–3, 5 | Foundation, admin, patient, partner portals built; typecheck + role tests passing |
| 2026-07-31 | 2 | Phase 2 completed: patient filters/pagination, tabbed detail + audit trail, review queue filters |
