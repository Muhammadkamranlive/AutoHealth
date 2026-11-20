import { redirect } from "next/navigation";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";
import {
  average,
  averageHoursBetween,
  buildMonthlyPatientTrend,
  estimateMrrCents,
  type ReportingMetrics,
} from "@/lib/admin/reporting-metrics";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "dashboard:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: patients },
    { data: reviewedOrders },
    { data: threads },
    { data: messages },
    { data: subscriptions },
    { data: invoices },
    { count: pendingRefills },
  ] = await Promise.all([
    supabase.from("patients").select("created_at").gte("created_at", sixMonthsAgo.toISOString()),
    supabase
      .from("orders")
      .select("created_at, reviewed_at")
      .not("reviewed_at", "is", null)
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase.from("message_threads").select("id, created_at, patient_id"),
    supabase.from("messages").select("thread_id, sender_role, created_at").order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("status, current_period_start, current_period_end, updated_at"),
    supabase.from("invoices").select("amount_cents, created_at, status"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("is_refill", true)
      .eq("status", "pending_review"),
  ]);

  const approvalHours =
    reviewedOrders
      ?.map((o) => averageHoursBetween(o.created_at, o.reviewed_at))
      .filter((h): h is number => h != null) ?? [];

  const messagesByThread = new Map<string, typeof messages>();
  for (const msg of messages ?? []) {
    const list = messagesByThread.get(msg.thread_id) ?? [];
    list.push(msg);
    messagesByThread.set(msg.thread_id, list);
  }

  const responseHours: number[] = [];
  for (const thread of threads ?? []) {
    const threadMsgs = messagesByThread.get(thread.id) ?? [];
    let lastPatientAt: string | null = null;

    for (const msg of threadMsgs) {
      if (msg.sender_role === "patient") {
        lastPatientAt = msg.created_at;
        continue;
      }

      if (lastPatientAt) {
        const hours = averageHoursBetween(lastPatientAt, msg.created_at);
        if (hours != null) responseHours.push(hours);
        lastPatientAt = null;
      }
    }
  }

  const churnedLast30Days =
    subscriptions?.filter(
      (s) =>
        s.status === "canceled" &&
        new Date(s.updated_at).getTime() >= thirtyDaysAgo.getTime()
    ).length ?? 0;

  const metrics: ReportingMetrics = {
    newPatientsByMonth: buildMonthlyPatientTrend(patients?.map((p) => p.created_at) ?? []),
    avgApprovalHours: average(approvalHours),
    avgResponseHours: average(responseHours),
    mrrCents: estimateMrrCents(subscriptions ?? [], invoices ?? []),
    activeSubscriptions:
      subscriptions?.filter((s) => s.status === "active" || s.status === "trialing").length ?? 0,
    churnedLast30Days,
    pendingRefills: pendingRefills ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Reports</h1>
        <p className="text-slate-600 dark:text-slate-400">Leadership metrics from database and Stripe webhooks</p>
      </div>
      <ReportsDashboard metrics={metrics} />
    </div>
  );
}
