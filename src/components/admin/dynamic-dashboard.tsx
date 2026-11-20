"use client";

import Link from "next/link";
import type { DashboardWidget } from "@/lib/menus/types";
import {
  ActivityChart,
  DashboardStatCard,
  IconCheck,
  IconClipboard,
  IconMail,
  IconUsers,
  OrderStatusChart,
  PatientsGrowthChart,
  type OrderStatusSlice,
} from "./dashboard-charts";
import type { TrendPoint } from "./dashboard-charts";

type Props = {
  widgets: DashboardWidget[];
  stats: {
    patientCount: number;
    pendingOrders: number;
    openThreads: number;
    approvedOrders: number;
    patientsThisWeek: number;
  };
  trends: {
    patientTrend: TrendPoint[];
    orderTrend: TrendPoint[];
    threadTrend: TrendPoint[];
    activityTrend: TrendPoint[];
  };
  orderPie: OrderStatusSlice[];
};

export function DynamicDashboard({ widgets, stats, trends, orderPie }: Props) {
  const show = (w: DashboardWidget) => widgets.includes(w);

  const statCards = [
    show("stat_patients") && (
      <DashboardStatCard
        key="stat_patients"
        label="Total Patients"
        value={stats.patientCount}
        href="/admin/patients"
        change={stats.patientsThisWeek > 0 ? `+${stats.patientsThisWeek} this week` : undefined}
        trend={trends.patientTrend}
        icon={<IconUsers className="h-5 w-5" />}
        color="blue"
      />
    ),
    show("stat_pending_orders") && (
      <DashboardStatCard
        key="stat_pending_orders"
        label="Pending Reviews"
        value={stats.pendingOrders}
        href="/admin/review-queue"
        trend={trends.orderTrend}
        icon={<IconClipboard className="h-5 w-5" />}
        color="amber"
        highlight={stats.pendingOrders > 0}
      />
    ),
    show("stat_open_threads") && (
      <DashboardStatCard
        key="stat_open_threads"
        label="Open Threads"
        value={stats.openThreads}
        href="/admin/inbox"
        trend={trends.threadTrend}
        icon={<IconMail className="h-5 w-5" />}
        color="violet"
      />
    ),
    show("stat_approved_orders") && (
      <DashboardStatCard
        key="stat_approved_orders"
        label="Approved Orders"
        value={stats.approvedOrders}
        href="/admin/review-queue"
        trend={trends.orderTrend}
        icon={<IconCheck className="h-5 w-5" />}
        color="emerald"
      />
    ),
  ].filter(Boolean);

  const charts = [
    show("chart_patients") && (
      <PatientsGrowthChart key="chart_patients" data={trends.patientTrend} />
    ),
    show("chart_order_status") && (
      <OrderStatusChart key="chart_order_status" data={orderPie} />
    ),
  ].filter(Boolean);

  return (
    <>
      {statCards.length > 0 && (
        <div className={`grid gap-5 ${statCards.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {statCards}
        </div>
      )}

      {charts.length > 0 && (
        <div className={`mt-8 grid gap-6 ${charts.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {charts}
        </div>
      )}

      {show("chart_activity") && (
        <div className="mt-8">
          <ActivityChart data={trends.activityTrend} />
        </div>
      )}

      {statCards.length === 0 && charts.length === 0 && !show("chart_activity") && (
        <div className="rounded-2xl border border-dashed border-medical-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            No dashboard widgets assigned to your menu. Contact an admin to assign menus.
          </p>
          <Link href="/admin/users" className="mt-4 inline-block text-sm font-medium text-medical-600">
            User management →
          </Link>
        </div>
      )}
    </>
  );
}
