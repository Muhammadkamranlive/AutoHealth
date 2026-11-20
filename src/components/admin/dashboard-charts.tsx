"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = { label: string; value: number };

export type OrderStatusSlice = { name: string; value: number; color: string };

type StatCardProps = {
  label: string;
  value: number;
  href: string;
  change?: string;
  trend: TrendPoint[];
  icon: React.ReactNode;
  color: "blue" | "amber" | "emerald" | "violet";
  highlight?: boolean;
};

const COLOR_MAP = {
  blue: {
    bg: "bg-medical-50",
    icon: "bg-medical-600 text-white",
    chart: "#2563eb",
    ring: "ring-medical-200",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500 text-white",
    chart: "#f59e0b",
    ring: "ring-amber-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    chart: "#059669",
    ring: "ring-emerald-200",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "bg-violet-600 text-white",
    chart: "#7c3aed",
    ring: "ring-violet-200",
  },
};

export function DashboardStatCard({
  label,
  value,
  href,
  change,
  trend,
  icon,
  color,
  highlight,
}: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <Link href={href} className="group block">
      <div
        className={`overflow-hidden rounded-2xl border border-medical-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
          highlight ? `ring-2 ${c.ring}` : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.icon} shadow-sm`}>
            {icon}
          </div>
          {change && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {change}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-medical-950 dark:text-white">{value}</p>
        <div className="mt-4 h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${color}-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.chart} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c.chart} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={c.chart}
                strokeWidth={2}
                fill={`url(#grad-${color}-${label})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs font-medium text-medical-600 opacity-0 transition group-hover:opacity-100">
          View details →
        </p>
      </div>
    </Link>
  );
}

export function PatientsGrowthChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-medical-900 dark:text-white">Patient enrollment</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">New patients — last 7 days</p>
      <div className="mt-4 h-48 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dbeafe",
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OrderStatusChart({ data }: { data: OrderStatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-medical-900">Order status</h3>
      <p className="text-sm text-slate-500">{total} total orders in system</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-3">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="font-semibold text-medical-900">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ActivityChart({ data }: { data: TrendPoint[] }) {
  return (
    <div id="analytics" className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-medical-900">Weekly activity</h3>
      <p className="text-sm text-slate-500">Orders + message threads combined</p>
      <div className="mt-4 h-48 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dbeafe", fontSize: 13 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#activityGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4h16v12H4zM4 13l4 4h8l4-4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
    </svg>
  );
}
