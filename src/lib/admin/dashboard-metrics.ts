import type { TrendPoint } from "@/components/admin/dashboard-charts";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build last-7-day buckets from ISO date strings. */
export function buildDailyTrend(dates: string[]): TrendPoint[] {
  const buckets = new Map<string, number>();
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const iso of dates) {
    const key = iso.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([key, value]) => {
    const d = new Date(key + "T12:00:00");
    return { label: DAY_LABELS[d.getDay()], value };
  });
}

/** Cumulative running total for sparkline effect. */
export function toCumulativeTrend(points: TrendPoint[]): TrendPoint[] {
  let sum = 0;
  return points.map((p) => {
    sum += p.value;
    return { label: p.label, value: sum };
  });
}

/** Merge two daily trends by summing values per day index. */
export function mergeTrends(a: TrendPoint[], b: TrendPoint[]): TrendPoint[] {
  return a.map((point, i) => ({
    label: point.label,
    value: point.value + (b[i]?.value ?? 0),
  }));
}
