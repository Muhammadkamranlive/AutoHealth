import { redirect } from "next/navigation";
import { getSessionUser, requirePermission, getEffectivePermissions } from "@/lib/auth/server";
import { resolveAdminWorkspace } from "@/lib/menus/resolve";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import type { DashboardWidget } from "@/lib/menus/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RoleAdminDashboard } from "@/components/admin/role-admin-dashboard";
import { UsersDirectory, type DirectoryUser } from "@/components/admin/users-directory";
import type { UserRole } from "@/lib/db";
import {
  buildDailyTrend,
  mergeTrends,
  toCumulativeTrend,
} from "@/lib/admin/dashboard-metrics";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "dashboard:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  await getEffectivePermissions(supabase, user);

  const [workspace, profileTasks, { data: profileRow }, { data: directoryRows }] = await Promise.all([
    resolveAdminWorkspace(supabase, user).catch(() => null),
    getAssignedFormsForUser(supabase, user.id, user.role),
    supabase.from("profiles").select("profile_completion_percent").eq("id", user.id).single(),
    user.role === "admin"
      ? createAdminClient()
          .from("profiles")
          .select("id, email, role, first_name, last_name, menu_mode, workspace_label, profile_completion_percent, created_at")
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const widgets: DashboardWidget[] = workspace?.widgets ?? [
    "stat_patients",
    "stat_pending_orders",
    "stat_open_threads",
    "stat_approved_orders",
    "chart_patients",
    "chart_order_status",
    "chart_activity",
  ];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const needsPatients = widgets.some((w) => w.includes("patient"));
  const needsOrders = widgets.some((w) => w.includes("order") || w === "stat_pending_orders" || w === "stat_approved_orders");
  const needsThreads = widgets.some((w) => w.includes("inbox") || w === "stat_open_threads" || w === "chart_activity");

  const queries = await Promise.all([
    widgets.includes("stat_patients") || needsPatients
      ? supabase.from("patients").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    widgets.includes("stat_pending_orders")
      ? supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending_review")
      : Promise.resolve({ count: 0 }),
    widgets.includes("stat_open_threads")
      ? supabase.from("message_threads").select("*", { count: "exact", head: true }).eq("status", "open")
      : Promise.resolve({ count: 0 }),
    widgets.includes("stat_approved_orders")
      ? supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "approved")
      : Promise.resolve({ count: 0 }),
    needsPatients
      ? supabase.from("patients").select("created_at").gte("created_at", since)
      : Promise.resolve({ data: [] }),
    needsOrders
      ? supabase.from("orders").select("created_at, status").gte("created_at", since)
      : Promise.resolve({ data: [] }),
    needsThreads
      ? supabase.from("message_threads").select("created_at").gte("created_at", since)
      : Promise.resolve({ data: [] }),
    widgets.includes("chart_order_status")
      ? supabase.from("orders").select("status")
      : Promise.resolve({ data: [] }),
  ]);

  const [
    { count: patientCount },
    { count: pendingOrders },
    { count: openThreads },
    { count: approvedOrders },
    { data: recentPatients },
    { data: recentOrders },
    { data: recentThreads },
    { data: orderStatuses },
  ] = queries;

  const patientTrend = buildDailyTrend(
    (recentPatients as { created_at: string }[] | null)?.map((p) => p.created_at) ?? []
  );
  const orderTrend = buildDailyTrend(
    (recentOrders as { created_at: string }[] | null)?.map((o) => o.created_at) ?? []
  );
  const threadTrend = buildDailyTrend(
    (recentThreads as { created_at: string }[] | null)?.map((t) => t.created_at) ?? []
  );
  const activityTrend = mergeTrends(orderTrend, threadTrend);

  const statusCounts = ((orderStatuses as { status: string }[] | null) ?? []).reduce<
    Record<string, number>
  >((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const orderPie = [
    { name: "Pending review", value: statusCounts.pending_review ?? 0, color: "#f59e0b" },
    { name: "Approved", value: statusCounts.approved ?? 0, color: "#059669" },
    { name: "Denied", value: statusCounts.denied ?? 0, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  if (orderPie.length === 0 && widgets.includes("chart_order_status")) {
    orderPie.push({ name: "No orders yet", value: 1, color: "#dbeafe" });
  }

  const profileCompletion =
    profileRow?.profile_completion_percent ??
    (profileTasks.length
      ? Math.round(profileTasks.reduce((s, t) => s + t.completionPercent, 0) / profileTasks.length)
      : 0);

  const directoryUsers: DirectoryUser[] = (directoryRows ?? []).map((row) => ({
    ...row,
    role: row.role as UserRole,
  }));

  return (
    <div className="space-y-8">
    <RoleAdminDashboard
      user={user}
      workspaceTitle={workspace?.workspaceTitle ?? `Dashboard Portal for ${user.role}`}
      menuMode={workspace?.menuMode}
      widgets={widgets}
      profileTasks={profileTasks}
      profileCompletion={profileCompletion}
      stats={{
        patientCount: patientCount ?? 0,
        pendingOrders: pendingOrders ?? 0,
        openThreads: openThreads ?? 0,
        approvedOrders: approvedOrders ?? 0,
        patientsThisWeek: patientTrend.reduce((s, p) => s + p.value, 0),
      }}
      trends={{
        patientTrend: toCumulativeTrend(patientTrend),
        orderTrend,
        threadTrend,
        activityTrend,
      }}
      orderPie={orderPie}
    />
    {user.role === "admin" && (
      <UsersDirectory users={directoryUsers} canCreate={false} canUpdate={false} compact />
    )}
    </div>
  );
}
