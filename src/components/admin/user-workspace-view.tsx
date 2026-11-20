import Link from "next/link";
import { Badge, Card, EmptyState, orderStatusBadge } from "@/components/ui";
import { getRoleDisplayName } from "@/lib/auth";
import { ProfileTasksCard } from "@/components/profile-tasks/profile-tasks";
import type { UserWorkspaceSnapshot } from "@/lib/admin/user-workspace";
import { displayName } from "@/lib/admin/user-workspace";

export function UserWorkspaceView({
  snapshot,
  canEdit,
}: {
  snapshot: UserWorkspaceSnapshot;
  canEdit: boolean;
}) {
  const { profile, portal, tasks, workspace } = snapshot;
  const name = displayName(profile);
  const roleLabel = getRoleDisplayName(profile.role);
  const isAdminUser = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-medical-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-medical-600 text-lg font-bold text-white">
              {(profile.first_name?.[0] ?? profile.email[0]).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-medical-500">
                Viewing as {roleLabel}
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
                {name}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">{roleLabel}</Badge>
                <Badge variant={profile.menu_mode === "custom" ? "warning" : "default"}>
                  {profile.menu_mode === "custom" ? "Custom menus" : "Role-based menus"}
                </Badge>
                <Badge variant={profile.profile_completion_percent === 100 ? "success" : "default"}>
                  Profile {profile.profile_completion_percent}%
                </Badge>
                {isAdminUser && <Badge variant="warning">Role locked</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Link
                href={`/admin/users/${profile.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-200 bg-white px-4 text-sm font-semibold text-medical-800 hover:bg-medical-50 dark:border-slate-700 dark:bg-slate-900 dark:text-medical-200"
              >
                {isAdminUser ? "Edit profile" : "Edit access"}
              </Link>
            )}
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              All users
            </Link>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Menus this user can see</h2>
        <div className="flex flex-wrap gap-2">
          {(portal === "admin"
            ? flattenNav(workspace?.navItems ?? [])
            : portal === "patient"
              ? snapshot.patientNav
              : snapshot.partnerNav
          ).map((item) => (
            <span
              key={`${item.href}-${item.label}`}
              className="rounded-full border border-medical-100 bg-white px-3 py-1.5 text-xs font-medium text-medical-800 dark:border-slate-700 dark:bg-slate-900 dark:text-medical-200"
            >
              {item.label}
            </span>
          ))}
          {portal === "admin" && !workspace?.navItems.length && (
            <p className="text-sm text-slate-500">No menus resolved.</p>
          )}
        </div>
      </section>

      {tasks.length > 0 && (
        <ProfileTasksCard
          tasks={tasks}
          tasksHref="/admin/tasks"
          overallPercent={profile.profile_completion_percent}
          readOnly
        />
      )}

      {portal === "patient" && <PatientRecords snapshot={snapshot} />}
      {portal === "partner" && <PartnerRecords snapshot={snapshot} />}
      {portal === "admin" && (
        <Card title="Staff workspace" description={workspace?.workspaceTitle ?? `${roleLabel} portal`}>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This is the dashboard and menu set this {roleLabel.toLowerCase()} uses after sign-in.
            Assigned profile tasks appear above.
          </p>
        </Card>
      )}
    </div>
  );
}

function flattenNav(items: { label: string; href: string; children?: { label: string; href: string }[] }[]) {
  const out: { label: string; href: string }[] = [];
  for (const item of items) {
    out.push({ label: item.label, href: item.href });
    for (const child of item.children ?? []) out.push(child);
  }
  return out;
}

function PatientRecords({ snapshot }: { snapshot: UserWorkspaceSnapshot }) {
  if (!snapshot.patient) {
    return (
      <EmptyState
        title="No patient record yet"
        description="This account does not have a linked patient chart."
      />
    );
  }

  const p = snapshot.patient;
  const address = [p.address_line1, p.city, p.state, p.zip].filter(Boolean).join(", ");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Patient chart">
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Date of birth" value={p.date_of_birth ?? "—"} />
          <Row label="Address" value={address || "—"} />
          <Row label="Chart created" value={new Date(p.created_at).toLocaleDateString()} />
        </dl>
      </Card>

      <Card title="Treatment plans">
        <RecordList
          empty="No treatment plans"
          items={snapshot.treatmentPlans.map((plan) => ({
            key: plan.id,
            title: plan.medication,
            meta: `${plan.status} · ${new Date(plan.start_date).toLocaleDateString()}`,
          }))}
        />
      </Card>

      <Card title="Orders">
        <ul className="mt-4 space-y-2">
          {snapshot.orders.length === 0 && <li className="text-sm text-slate-500">No orders</li>}
          {snapshot.orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {order.is_refill ? "Refill" : "Order"} · {new Date(order.created_at).toLocaleDateString()}
              </span>
              <Badge variant={orderStatusBadge(order.status)}>{order.status.replace("_", " ")}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Documents">
        <RecordList
          empty="No documents"
          items={snapshot.documents.map((doc) => ({
            key: doc.id,
            title: doc.file_name,
            meta: `${doc.type} · ${new Date(doc.created_at).toLocaleDateString()}`,
          }))}
        />
      </Card>

      <Card title="Message threads" className="lg:col-span-2">
        <RecordList
          empty="No conversations"
          items={snapshot.threads.map((thread) => ({
            key: thread.id,
            title: thread.subject || "Care thread",
            meta: `${thread.status} · ${thread.channel} · ${new Date(thread.updated_at).toLocaleDateString()}`,
          }))}
        />
      </Card>
    </div>
  );
}

function PartnerRecords({ snapshot }: { snapshot: UserWorkspaceSnapshot }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title="Referrals">
        <RecordList
          empty="No referrals"
          items={snapshot.referrals.map((row) => ({
            key: row.id,
            title: row.referred_email ?? row.status,
            meta: `${row.status} · ${new Date(row.created_at).toLocaleDateString()}`,
          }))}
        />
      </Card>
      <Card title="Payouts">
        <RecordList
          empty="No payouts"
          items={snapshot.payouts.map((row) => ({
            key: row.id,
            title: `$${(row.amount_cents / 100).toFixed(2)}`,
            meta: `${row.status} · ${new Date(row.created_at).toLocaleDateString()}`,
          }))}
        />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-medical-900 dark:text-white">{value}</dd>
    </div>
  );
}

function RecordList({
  items,
  empty,
}: {
  empty: string;
  items: { key: string; title: string; meta: string }[];
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item.key} className="rounded-xl border border-medical-50 px-3 py-2 dark:border-slate-800">
          <p className="truncate text-sm font-medium text-medical-900 dark:text-white">{item.title}</p>
          <p className="text-xs text-slate-500">{item.meta}</p>
        </li>
      ))}
    </ul>
  );
}
