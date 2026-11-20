import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import type { AssignedFormTask } from "@/lib/forms/types";
import type { Order, TreatmentPlan } from "@/lib/db";
import { Badge, Button, orderStatusBadge } from "@/components/ui";
import { ProfileTasksCard } from "@/components/profile-tasks/profile-tasks";

type Props = {
  user: SessionUser;
  profileTasks: AssignedFormTask[];
  profileCompletion: number;
  activePlan: TreatmentPlan | null;
  latestOrder: Order | null;
  unreadCount: number;
  setupPending?: boolean;
};

export function PatientDashboard({
  user,
  profileTasks,
  profileCompletion,
  activePlan,
  latestOrder,
  unreadCount,
  setupPending,
}: Props) {
  if (setupPending) {
    return (
      <div className="space-y-8">
        <DashboardHeader user={user} subtitle="Your account is being prepared" />
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">Profile setup in progress</p>
          <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-300/80">
            Your care team is finishing your enrollment. Check back shortly or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader user={user} subtitle="Your health dashboard — treatment, orders, and care team" />

      {profileTasks.length > 0 && (
        <ProfileTasksCard
          tasks={profileTasks}
          tasksHref="/profile/tasks"
          overallPercent={profileCompletion}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active treatment"
          value={activePlan?.medication ?? "None"}
          hint={activePlan ? `Since ${new Date(activePlan.start_date).toLocaleDateString()}` : "No plan assigned yet"}
          href="/orders"
          accent="blue"
        />
        <StatTile
          label="Latest order"
          value={latestOrder ? latestOrder.status.replace("_", " ") : "No orders"}
          hint={latestOrder ? new Date(latestOrder.created_at).toLocaleDateString() : "Request your first refill"}
          href="/orders"
          accent="violet"
          statusBadge={latestOrder ? orderStatusBadge(latestOrder.status) : undefined}
        />
        <StatTile
          label="Unread messages"
          value={String(unreadCount)}
          hint={unreadCount > 0 ? "From your care team" : "All caught up"}
          href="/messages"
          accent="teal"
        />
        <StatTile
          label="Quick action"
          value="Request refill"
          hint="Submit a medication refill"
          href="/orders/refill"
          accent="amber"
        />
      </div>

      <div className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-wider text-medical-500 dark:text-medical-400">
          Shortcuts
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/orders/refill">
            <Button>Request refill</Button>
          </Link>
          <Link href="/messages">
            <Button variant="secondary">Messages</Button>
          </Link>
          <Link href="/documents">
            <Button variant="secondary">Upload documents</Button>
          </Link>
          <Link href="/billing">
            <Button variant="outline">Billing</Button>
          </Link>
        </div>
      </div>

      {activePlan && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-medical-100 bg-gradient-to-br from-medical-600 to-teal-600 p-6 text-white shadow-lg dark:border-slate-800">
            <p className="text-sm font-medium text-medical-100">Current medication</p>
            <p className="mt-2 text-2xl font-bold">{activePlan.medication}</p>
            <p className="mt-2 text-sm text-medical-100/90">
              Prescribed care plan · Started {new Date(activePlan.start_date).toLocaleDateString()}
            </p>
            <Link
              href="/orders/refill"
              className="mt-4 inline-flex rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-medical-700 shadow-sm hover:bg-white"
            >
              Request refill →
            </Link>
          </div>

          <div className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-medical-900 dark:text-white">Need help?</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Message your care team for questions about treatment, side effects, or billing.
            </p>
            <Link href="/messages" className="mt-4 inline-block text-sm font-semibold text-medical-600 hover:text-medical-700 dark:text-medical-400">
              Go to messages →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardHeader({ user, subtitle }: { user: SessionUser; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
        Welcome back, {user.firstName ?? "there"}
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  href,
  accent,
  statusBadge,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  accent: "blue" | "violet" | "teal" | "amber";
  statusBadge?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const colors = {
    blue: "border-medical-200 bg-medical-50/80 hover:border-medical-300 dark:border-medical-900 dark:bg-medical-950/40",
    violet: "border-violet-200 bg-violet-50/80 hover:border-violet-300 dark:border-violet-900 dark:bg-violet-950/40",
    teal: "border-teal-200 bg-teal-50/80 hover:border-teal-300 dark:border-teal-900 dark:bg-teal-950/40",
    amber: "border-amber-200 bg-amber-50/80 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/40",
  };

  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[accent]}`}
    >
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <div className="mt-2">
        {statusBadge ? (
          <Badge variant={statusBadge}>{value}</Badge>
        ) : (
          <p className="text-xl font-bold text-medical-950 dark:text-white">{value}</p>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </Link>
  );
}
