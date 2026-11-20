# HealthBridge — Project Memory

Persistent decisions and requirements. **Do not re-ask the user** for items documented here.

---

## Brand (mandatory)

Public product name is **HealthBridge**. Do not use AutoHealth in UI, emails, metadata, or client-facing copy.

| Token | Value |
|-------|--------|
| Name | HealthBridge |
| Legal | HealthBridge, Inc. |
| Tagline | Care that connects |
| Promise | Patients, clinicians, and referring partners share one clinic record |
| Mark | Bridge + plus (`BrandMark` / `BrandLogo`) |

Source of truth: `src/lib/brand.ts`. Logo: `src/components/brand/logo.tsx`. Assets: `public/brand/`.

The local repo folder and Supabase `project_id` stay `autohealth` so existing local databases keep working.

---

## Responsive UI (mandatory)

**Every screen must be mobile-responsive:** landing page, admin dashboard, patient/partner portals, and all forms.

- Mobile-first Tailwind (`sm:` / `md:` / `lg:`)
- No horizontal page scroll
- Touch targets ≥ 44px (`min-h-11`)
- Forms: full-width inputs on phone; `text-base` on inputs (prevents iOS zoom)
- Tables: scroll inside container, not the page
- Admin nav: **drawer on mobile** (`< lg`), fixed sidebar on desktop

**Full checklist:** [`docs/MOBILE_RESPONSIVE.md`](./MOBILE_RESPONSIVE.md)  
**Cursor rule (always on):** `.cursor/rules/responsive-mobile.mdc`

---

## Menus, roles & permissions (mandatory for all future features)

Every new admin page, action, and UI control **must** follow this system.

### Model

| Layer | Purpose |
|-------|---------|
| **`platform_menus`** | Sidebar entries (DB), each with `permission` + optional parent |
| **`role_menu_grants`** | Default menus + `allowed_actions[]` per role |
| **`user_menu_grants`** | Custom override per user when `menu_mode = 'custom'` |
| **Effective permissions** | Union of `resource:action` from all granted menus |
| **`requirePermission()`** | Server/page/action guard using effective permissions |

### Actions per menu grant

- **Read** — always included when menu enabled; user can view page/records
- **Create / Update / Delete / Approve** — optional; must be explicitly granted
- **Approve** — only on orders menus

### Rules (always apply)

1. **Admin role** — full permissions always (bypass menu restrictions)
2. **Menu visible** if assigned AND user has any permission on that menu’s resource
3. **Parent menus** auto-show when a granted child is visible
4. **Page load** — `requirePermission(supabase, 'resource:read')` (or `requireAnyPermission`)
5. **Mutations** — `requirePermission(supabase, 'resource:create|update|delete|approve')` in server actions
6. **UI** — hide/disable buttons via `useAdminWorkspace().can('resource:action')` or server-passed flags
7. **Denied message** — `"You don't have permission for this operation. Ask your administrator for access."` (`PERMISSION_DENIED_MESSAGE`)
8. **New menus** — seed in migration, add to role editor, wire page guard + action guards

### Key files

- `src/lib/menus/resolve.ts` — workspace + nav
- `src/lib/menus/permissions.ts` — effective permissions
- `src/lib/auth/server.ts` — `requirePermission`, `requireAnyPermission`
- `src/lib/auth/errors.ts` — `PermissionDeniedError`
- `src/components/admin/menu-grant-editor.tsx` — role/user assignment UI
- `.cursor/rules/menus-permissions.mdc` — Cursor rule (always on)

---

## Dashboard nav search (mandatory)

Every portal dashboard header includes a **menu search bar**:

- Component: `PortalNavSearch` (generic) / `AdminNavSearch` (admin)
- Autocomplete from user’s **visible menus only**
- Navigate on **Enter** or **mouse click**
- Keyboard: ↑↓ to highlight, **⌘K** / **Ctrl+K** to focus
- Add new nav items to search by updating nav config (admin: `workspace.navItems`; patient/partner: shell nav array)

Files: `src/components/portal-nav-search.tsx`, `src/lib/nav/search-items.ts`

---

## Form UI (mandatory — synced across app)

All forms use shared components/styles. **Do not** use raw `<input>`, `<select>`, `<textarea>` with one-off classes.

| Use | For |
|-----|-----|
| `Input` | Text, email, password, tel |
| `Select` | Dropdowns |
| `Textarea` | Multi-line text |
| `FormCard` | Grouped form sections |
| `FormGrid` | Two-column field layout (`sm:grid-cols-2`) |
| `FormActions` | Submit + cancel row |
| `Button` | All buttons |
| `LoadingOverlay` | Submit/save in progress |

Styles live in `src/components/ui/lib/form-styles.ts` (`formControlClass`, `formCardClass`, etc.).

Auth pages use same `Input` + `Button`; card wrapper matches medical theme.

**Cursor rule:** `.cursor/rules/form-ui.mdc`

---

## Future: Capacitor mobile app

The web app will be wrapped as a **native iOS/Android WebView** using [Capacitor](https://capacitorjs.com/).

1. One responsive codebase — no separate mobile fork
2. Safe areas: `viewport-fit=cover`, CSS vars `--safe-*`
3. Prefer `min-h-[100dvh]` over `100vh`
4. Status bar / splash: medical blue `#2563eb`

See `docs/MOBILE_RESPONSIVE.md`.

---

## Profile form builder (mandatory pattern)

Admin-built **drag-and-drop profile forms** assigned to roles or users.

### Flow

1. Admin creates form at `/admin/forms` (palette → canvas → properties)
2. Assigns to **roles** (Assignments tab) and/or sets **target roles**
3. Users see forms as **Profile Tasks** on their role dashboard
4. Completion % tracked per form + aggregated on `profiles.profile_completion_percent`

### Field types

`section`, `text`, `email`, `phone`, `number`, `textarea`, `select`, `radio`, `checkbox`, `date`, `image`

### Market templates (`src/lib/forms/templates/`)

Pre-built industry forms admin can pick when creating:
- Physician Provider Profile (CAQH / NPPES style)
- Nurse & Care Team Profile
- Patient Intake & Registration (Phreesia style)
- Pharmacy Partner Profile (NCPDP)
- HIPAA Privacy Acknowledgement
- Telehealth Informed Consent

### Validation

- Per-field rules: `validation.pattern` (email, phone, npi, dea, zip, url), min/max length
- Client: blur + submit validation in `DynamicFormRenderer`
- Server: `saveFormSubmission` rejects invalid submit
- Tests: `src/lib/forms/validation.test.ts`

### Key files

- `supabase/migrations/20260731000000_profile_form_builder.sql`
- `src/lib/forms/` — types, completion, resolve assignments
- `src/components/form-builder/` — drag-and-drop builder
- `src/components/dynamic-form/` — renderer + image upload
- `src/app/admin/forms/` — admin CRUD
- `src/app/admin/tasks/` — staff task completion
- `src/app/profile/tasks/` — patient tasks
- `src/app/partner/tasks/` — partner tasks

### Rules for new forms/features

- Use `DynamicFormRenderer` pattern for user-facing forms
- Use shared `Input`/`Select`/`Textarea`/`FormCard` components
- Save via `saveFormSubmission` server action
- Role dashboards use `RoleAdminDashboard` + `ProfileTasksCard`

---

- **Next.js** single app (not monorepo)
- **Supabase** project: `cgaphaheffbntxlgfedp`
- **Roles:** patient, physician, care_team, admin, partner, partner_staff
- **Env:** `SUPABASE_SERVICE_ROLE_KEY` required for admin user creation

## Administrator workspace (mandatory)

- Administrator always sees **every** platform menu (bypass `role_menu_grants` gaps).
- The **Administrator role cannot be changed** — not on a user, and not in Role Menus.
- `/admin/users` lists **all** accounts. Clicking a user opens their workspace (menus + role records).
- In-app notifications (bell in every portal header): login and profile-task assignment.

## Local demo seed

`supabase/seed.sql` (applied by `supabase db reset`) creates logins for **every role**, grants each internal role every menu it is allowed to use, and loads **30+ demo rows** behind each list menu (patients, review queue, inbox, users, billing plans, form builder, referrals, payouts, notifications, form submissions).

Password for all demo accounts: **`Demo@1234`**. Primary emails: `muhammadkamranntu@gmail.com` (Administrator), `physician@healthbridge.demo`, `care@healthbridge.demo`, `patient@healthbridge.demo`, `partner@healthbridge.demo`, `staff@healthbridge.demo`.

---

---

## Migrations

```bash
supabase login
supabase link --project-ref cgaphaheffbntxlgfedp
supabase db push
```

| Migration | Purpose |
|-----------|---------|
| `20260729000000_user_management_menus.sql` | Menus + grants |
| `20260730000000_menu_action_grants.sql` | `allowed_actions` on grants |

---

## UI theme

- US medical blue/white landing + admin
- Admin: collapsible sidebar, Recharts, dark mode, **header nav search**
- Workspace title: **"Workspace for [label]"** or **"Dashboard Portal for [Role]"**
- Loaders: `AppLoader` / `LoadingOverlay` — no skeleton UI
