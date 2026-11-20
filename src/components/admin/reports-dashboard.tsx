"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportingMetrics } from "@/lib/admin/reporting-metrics";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function ReportsDashboard({ metrics }: { metrics: ReportingMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Est. MRR"
          value={`$${(metrics.mrrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint="From active subs × recent invoice avg (Stripe-synced)"
        />
        <StatCard label="Active subscriptions" value={String(metrics.activeSubscriptions)} />
        <StatCard
          label="Avg order approval"
          value={metrics.avgApprovalHours != null ? `${metrics.avgApprovalHours.toFixed(1)}h` : "—"}
        />
        <StatCard
          label="Avg message response"
          value={metrics.avgResponseHours != null ? `${metrics.avgResponseHours.toFixed(1)}h` : "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">New patients (6 months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.newPatientsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Operational snapshot</h3>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <dt className="text-slate-500">Churned subs (30 days)</dt>
              <dd className="font-medium">{metrics.churnedLast30Days}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <dt className="text-slate-500">Pending refill requests</dt>
              <dd className="font-medium">{metrics.pendingRefills}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Data source</dt>
              <dd className="font-medium">Database + Stripe webhooks</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
