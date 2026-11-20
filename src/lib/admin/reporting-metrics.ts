import type { TrendPoint } from "@/components/admin/dashboard-charts";

export type ReportingMetrics = {
  newPatientsByMonth: TrendPoint[];
  avgApprovalHours: number | null;
  avgResponseHours: number | null;
  mrrCents: number;
  activeSubscriptions: number;
  churnedLast30Days: number;
  pendingRefills: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function buildMonthlyPatientTrend(dates: string[], months = 6): TrendPoint[] {
  const buckets = new Map<string, number>();
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), 0);
  }

  for (const iso of dates) {
    const key = iso.slice(0, 7);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([key, value]) => ({
    label: monthLabel(key),
    value,
  }));
}

export function averageHoursBetween(created: string, completed: string | null): number | null {
  if (!completed) return null;
  const ms = new Date(completed).getTime() - new Date(created).getTime();
  if (ms < 0) return null;
  return ms / (1000 * 60 * 60);
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function estimateMrrCents(
  subscriptions: { status: string; current_period_start: string; current_period_end: string }[],
  invoices: { amount_cents: number; created_at: string; status: string }[]
): number {
  const active = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  if (!active.length) return 0;

  const recentPaid = invoices
    .filter((i) => i.status === "paid")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!recentPaid.length) return 0;

  const avgInvoice = recentPaid.slice(0, Math.min(20, recentPaid.length));
  const avgAmount =
    avgInvoice.reduce((sum, i) => sum + i.amount_cents, 0) / avgInvoice.length;

  return Math.round(avgAmount * active.length);
}
