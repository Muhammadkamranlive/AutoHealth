# HealthBridge

A virtual clinic that keeps **patients, licensed clinicians, and referring partners** on one record.

Patients get a treatment plan, refills, messages, and documents. Clinicians work a real review queue. Gyms, med spas, and other clinics can refer someone in and get paid — without opening the private chart.

That is the whole point: care stops falling apart between the person who needs it, the clinician who reviews it, and the partner who sent them in.

One Next.js app, one `node_modules`, one place for everything.

## Folder structure

```
HealthBridge/
├── src/
│   ├── app/              ← pages (login, admin, dashboard, partner)
│   ├── components/       ← UI shells + shared components
│   │   └── ui/           ← Button, Card, Table, …
│   └── lib/
│       ├── supabase/     ← connect to Supabase (like firebase.ts)
│       ├── db/           ← table types (Patient, Order, …)
│       └── auth/         ← roles + login guards
├── supabase/             ← database tables + security rules (SQL)
├── package.json          ← all dependencies here
└── node_modules/         ← only ONE of these at the root
```

## Quick start

```bash
npm install
cp .env.example .env.local
# Add keys from: supabase status

supabase start
supabase db reset   # loads role-based menu grants + 30+ demo records per list menu

npm run dev    # http://localhost:3000
```

## Demo logins (local seed)

After `supabase db reset`, every demo account uses password **`Demo@1234`**.

| Role | Email |
|------|--------|
| Administrator | `muhammadkamranntu@gmail.com` |
| Physician | `physician@healthbridge.demo` |
| Care team | `care@healthbridge.demo` |
| Patient | `patient@healthbridge.demo` |
| Partner | `partner@healthbridge.demo` |
| Partner staff | `staff@healthbridge.demo` |

Numbered copies also exist (`physician02@…` through `physician08@…`, `patient02@…` through `patient32@…`, and so on). Seed SQL: `supabase/seed.sql`.

## Where is Supabase?

| What | File |
|------|------|
| Connect from browser | `src/lib/supabase/client.ts` |
| Connect from server | `src/lib/supabase/server.ts` |
| Table types | `src/lib/db/database.types.ts` |
| Database + security | `supabase/migrations/` |
| API keys | `.env.local` |

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm test
```

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for build phases.
