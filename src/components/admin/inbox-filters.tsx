"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

export function InboxFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const status = params.get("status") ?? "all";
  const assigned = params.get("assigned") ?? "all";
  const unread = params.get("unread") === "1";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all" || (key === "unread" && value === "0")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`/admin/inbox?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Select
        label="Status"
        value={status}
        onChange={(e) => update("status", e.target.value)}
        className="min-w-[140px]"
      >
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </Select>

      <Select
        label="Assignment"
        value={assigned}
        onChange={(e) => update("assigned", e.target.value)}
        className="min-w-[160px]"
      >
        <option value="all">All staff</option>
        <option value="me">Assigned to me</option>
        <option value="unassigned">Unassigned</option>
      </Select>

      <label className="flex items-center gap-2 pb-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={unread}
          onChange={(e) => update("unread", e.target.checked ? "1" : "0")}
          className="rounded border-slate-300"
        />
        Unread only
      </label>

      {(status !== "all" || assigned !== "all" || unread) && (
        <Link href="/admin/inbox" className="pb-2 text-sm text-medical-600 hover:underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}
