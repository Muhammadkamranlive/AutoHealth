# Telehealth Platform Rebuild — Project Spec

## 0. Context for the Agent

This is a **rebuild, not a greenfield idea**. A live telehealth clinic already has patients, revenue, and a working internal app. Your job is to build the production-grade version of three connected portals on the existing stack. Prioritize correctness, access control, and clean data modeling over speed of scaffolding — this app handles real patient health data and real payments.

Do not invent product decisions that touch compliance, clinical workflow, or payout math. Where this doc says "confirm with client," stop and ask rather than guessing.

---

## 1. Tech Stack (fixed, do not deviate without approval)

- **Frontend:** Next.js (App Router), TypeScript, Tailwind
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **Payments:** Stripe (Billing/Subscriptions, Connect for partner payouts if applicable)
- **Hosting:** Vercel
- **Email:** transactional email provider for inbound/outbound patient messaging (Resend, Postmark, or SendGrid — confirm which; needs inbound parsing for the unified inbox)
- **File storage:** Supabase Storage for lab results / uploaded documents

---

## 2. High-Level Architecture

Three separate Next.js apps (or a monorepo with shared packages) sharing one Supabase project:

1. `patient-portal` — public-facing, patient-authenticated
2. `admin-portal` — internal staff only (physicians, care team, ops)
3. `partner-portal` — B2B logins for referring businesses (gyms, med spas, chiro offices)

Shared packages: `@app/db` (typed Supabase client + generated types), `@app/ui` (shared components), `@app/auth` (role/session helpers).

### Core roles (RLS-enforced, not just UI-hidden)

- `patient`
- `physician`
- `care_team` (non-prescribing staff — messaging, order ops)
- `admin` (full internal access)
- `partner` (B2B referral partner)
- `partner_staff` (optional sub-role if partners have multiple logins — confirm with client)

Every table touching patient data must have RLS policies scoped by role and by ownership (a patient can only read their own rows; a partner can only read referral/payout rows tied to their org, never clinical detail).

---

## 3. Data Model (starting point — expand as needed)

Core entities to design around:

- `patients` (linked 1:1 to `auth.users`)
- `treatment_plans` (patient_id, medication/protocol, status, prescribing physician)
- `orders` (patient_id, treatment_plan_id, status: pending_review / approved / denied / shipped / delivered, refill flag, linked Stripe invoice/subscription)
- `messages` (thread_id, sender_id, sender_role, body, attachments, read_at) — powers both patient messaging and the admin unified inbox
- `message_threads` (patient_id, assigned_staff_id, status: open/closed, channel: in_app/email)
- `documents` (patient_id, type: lab_result/id/other, storage_path, uploaded_by)
- `subscriptions` / `invoices` (mirrors Stripe objects, synced via webhook)
- `partners` (org name, contact, payout method)
- `partner_referrals` (partner_id, patient_id, status: referred/enrolled/active/inactive, enrolled_at)
- `partner_payouts` (partner_id, period, amount, status: pending/paid, referral breakdown)
- `audit_log` (actor_id, actor_role, action, target_table, target_id, timestamp) — required given the health-data context; log all reads/writes to clinical tables, not just writes

Confirm with client: exact treatment/order status vocabulary, whether refills are auto-generated on a cadence or patient-initiated, and how partner payout amounts are calculated (flat fee vs. percentage vs. tiered).

---

## 4. Portal 1 — Patient Portal

**Framing:** clean pharmacy/health dashboard. Three pillars: messaging, refills, payment management.

### Features
- **Auth:** email/password or magic link via Supabase Auth; session-gated routes
- **Dashboard home:** current treatment plan summary, next refill date, latest order status, unread message count
- **Treatment plan view:** active plan details, physician of record, plan history
- **Orders & refills:**
  - Order status timeline (submitted → under physician review → approved → shipped → delivered)
  - Request refill action (respects refill eligibility rules — don't let patients spam requests; confirm cadence rules with client)
- **Messaging:** threaded chat with care team, file attachment support, read receipts, notification on new reply
- **Document upload:** labs/files upload to Supabase Storage, tagged by type, visible to care team
- **Billing:**
  - View current subscription/plan and price
  - Payment method management via Stripe (use Stripe Customer Portal or embedded Elements — confirm preference)
  - Invoice/payment history
  - Update or cancel subscription (confirm what patients are allowed to self-serve vs. what requires staff approval)
- **Profile/settings:** contact info, notification preferences, password/security

### Non-negotiables
- No clinical data (diagnoses, physician notes) should ever be fetched client-side without RLS scoping to `auth.uid()`.
- File uploads must be private by default (signed URLs, not public buckets).

---

## 5. Portal 2 — Admin Portal

**Framing:** where internal staff live all day. A rough version exists — this is largely rebuild/polish, so preserve existing workflows the team already relies on unless told otherwise.

### Features
- **Patient list:** searchable/filterable table (by status, physician, plan type, last activity)
- **Patient detail page:** full treatment history, orders, messages, documents, billing status, audit trail — single-pane view for staff
- **Review queue:** physician-facing queue of orders awaiting approval; approve/deny actions with required reason on denial; queue should support filtering by physician/assigned reviewer and sorting by wait time
- **Unified inbox:**
  - All patient message threads in one view, filterable by assigned staff / unread / status
  - Email in/out: inbound emails map to the correct patient thread (via inbound parsing webhook), outbound replies send both in-app and via email
  - Assignment/routing of threads to staff members
- **Billing & subscription views:** cross-patient view of subscription status, failed payments, upcoming renewals — sync from Stripe webhooks, don't just poll
- **Reporting:** basic operational metrics to start — new patients over time, order approval turnaround time, message response time, MRR/churn from Stripe data. Confirm exact KPIs with client before building custom dashboards.
- **Role-based access within admin:** physicians can approve/deny orders; care_team may be restricted from clinical approval actions but can message/manage orders logistically. Confirm the exact permission matrix.

### Non-negotiables
- Every approve/deny/edit action on clinical data writes to `audit_log`.
- Physician-only actions must be enforced server-side, not just hidden in the UI.

---

## 6. Portal 3 — B2B Partner Portal

**Framing:** smaller scope, simple. For gyms, med spas, chiro offices that refer clients.

### Features
- **Auth:** partner org login (consider whether one login per org or multiple staff logins per org — confirm)
- **Refer/enroll clients:** simple form to submit a new referral (name, contact, consent capture)
- **Referral status tracking:** table of everyone they've referred with status (referred / enrolled / active / inactive) — partners should see *status only*, never clinical details
- **Payouts:** view payout history and current pending payout, breakdown by referral if applicable
- **Profile:** org contact info, payout method (bank/Stripe Connect — confirm mechanism with client)

### Non-negotiables
- Strict data boundary: a partner must never be able to query another partner's referrals, and must never see clinical/treatment data for their referred patients — only enrollment/status and payout figures. Enforce via RLS, verify with a negative test (attempt cross-partner and patient-data access and confirm it's denied).

---

## 7. Access Control & Data Privacy (code-level, HIPAA-adjacent)

The client is handling compliance policy; the code still has to hold up its end:

- **RLS everywhere.** No table containing patient data should be readable via a service-role key from client-side code. All patient-facing queries go through RLS-scoped policies tied to `auth.uid()`.
- **Least privilege by role.** Partner and admin sub-roles should only be able to see what their role needs — model this explicitly in policies, not just in UI conditionals.
- **Audit logging** on all reads/writes to clinical tables (who, what, when).
- **Encrypted storage** for uploaded documents; signed, time-limited URLs for access.
- **No PHI in logs, error messages, or analytics events.** Scrub before sending to any third-party logging/analytics tool.
- **Environment separation:** distinct dev/staging/prod Supabase projects; never seed staging with real patient data.
- **Session handling:** short-lived sessions for admin portal given staff access to broad patient data; consider stricter timeout there than on the patient portal.

---

## 8. Integrations

- **Stripe:** subscriptions/invoicing (patient billing), webhooks kept in sync with `subscriptions`/`invoices` tables, and — if partner payouts flow through Stripe — Connect for payouts (confirm vs. manual/offline payout tracking).
- **Email (inbound + outbound):** needed for the unified inbox; confirm provider and set up inbound parsing to map emails to patient threads.
- **Bloodwork/lab API integrations:** if in scope, confirm which lab partner/API and whether this is phase-1 or later.
- **AI-generated notes from intake data:** if in scope, confirm this is a later phase — don't let it block the core three portals.

---

## 9. Non-Functional Requirements

- Mobile-responsive across all three portals (patients in particular will use this on phones)
- Accessible components (forms, tables, focus states) — this is a health app
- Reasonable loading/error/empty states everywhere, especially in the admin queue and inbox views
- Type-safe end to end (generate Supabase types, avoid `any`)
- Tests: prioritize RLS policy tests and access-control edge cases over broad UI test coverage at this stage

---

## 10. Suggested Build Order

1. Shared auth/role infrastructure + RLS policy foundation across all tables
2. Admin portal: patient list/detail, review queue (this is the team's daily driver — highest leverage first)
3. Patient portal: dashboard, orders/refills, messaging, billing
4. Unified inbox (email in/out) — this is the most integration-heavy piece, budget extra time
5. Partner portal (smaller scope, can run in parallel with polish work above)
6. Reporting dashboard
7. Later phase: lab API integrations, AI-generated notes, automations

---

## 11. Open Questions to Confirm With Client Before/During Build

- Exact refill cadence and eligibility rules
- Permission matrix for admin sub-roles (physician vs. care_team)
- Partner payout calculation logic and whether Stripe Connect or manual tracking
- Email provider choice and inbound parsing setup
- Whether partner orgs get single or multi-user logins
- Which existing "rough" admin portal pieces should be preserved as-is vs. redesigned
- Scope/timing of bloodwork API and AI notes features (phase 1 or later)
