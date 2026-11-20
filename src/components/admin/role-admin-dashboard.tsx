import Link from "next/link";
import { getRoleDisplayName, type SessionUser } from "@/lib/auth";
import type { AssignedFormTask } from "@/lib/forms/types";
import { ProfileTasksCard } from "@/components/profile-tasks/profile-tasks";
import { DynamicDashboard } from "@/components/admin/dynamic-dashboard";
import type { DashboardWidget } from "@/lib/menus/types";

type Props = {
  user: SessionUser;
  workspaceTitle: string;
  menuMode?: string;
  widgets: DashboardWidget[];
  profileTasks: AssignedFormTask[];
  profileCompletion: number;
  stats: {
    patientCount: number;
    pendingOrders: number;
    openThreads: number;
    approvedOrders: number;
    patientsThisWeek: number;
  };
  trends: {
    patientTrend: { label: string; value: number }[];
    orderTrend: { label: string; value: number }[];
    threadTrend: { label: string; value: number }[];
    activityTrend: { label: string; value: number }[];
  };
  orderPie: { name: string; value: number; color: string }[];
};

export function RoleAdminDashboard({
  user,
  workspaceTitle,
  menuMode,
  widgets,
  profileTasks,
  profileCompletion,
  stats,
  trends,
  orderPie,
}: Props) {
  const role = user.role;
  const roleLabel = getRoleDisplayName(role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
          {workspaceTitle}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {roleLabel} workspace · Welcome back, {user.firstName ?? user.email}
          {menuMode === "custom" && " · Custom menu"}
        </p>
      </div>

      {profileTasks.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileTasksCard tasks={profileTasks} tasksHref="/admin/tasks" overallPercent={profileCompletion} />
          <div className="rounded-2xl border border-medical-100 bg-gradient-to-br from-medical-600 to-medical-700 p-6 text-white shadow-lg dark:border-slate-800">
            <p className="text-sm font-medium text-medical-100">Your profile status</p>
            <p className="mt-2 text-4xl font-bold">{profileCompletion}%</p>
            <p className="mt-2 text-sm text-medical-100">
              {profileCompletion === 100
                ? "Profile complete — thank you!"
                : "Complete all assigned forms to unlock full portal access"}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>
      )}

      {role === "admin" && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-sm font-medium text-violet-900 dark:text-violet-200">Administrator tools</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/admin/forms/new" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">
              Create form
            </Link>
            <Link href="/admin/forms" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">
              Form Builder
            </Link>
            <Link href="/admin/users" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">
              User Management
            </Link>
            <Link href="/admin/roles" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">
              Role Menus
            </Link>
          </div>
        </div>
      )}

      {role === "physician" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Pending reviews" value={stats.pendingOrders} href="/admin/review-queue" accent="amber" />
          <StatTile label="Patients" value={stats.patientCount} href="/admin/patients" accent="blue" />
          <StatTile label="Open threads" value={stats.openThreads} href="/admin/inbox" accent="violet" />
        </div>
      )}

      {role === "care_team" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile label="Patients to support" value={stats.patientCount} href="/admin/patients" accent="blue" />
          <StatTile label="Inbox threads" value={stats.openThreads} href="/admin/inbox" accent="violet" />
        </div>
      )}

      <DynamicDashboard widgets={widgets} stats={stats} trends={trends} orderPie={orderPie} />
    </div>
  );
}

function StatTile({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent: "blue" | "amber" | "violet";
}) {
  const colors = {
    blue: "border-medical-200 bg-medical-50 text-medical-800 dark:border-medical-900 dark:bg-medical-950/40 dark:text-medical-200",
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    violet: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  };
  return (
    <Link href={href} className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 ${colors[accent]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Link>
  );
}
