"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

type PhysicianOption = { id: string; name: string };

export function ReviewQueueFilters({
  physicians,
  defaultPhysician,
  defaultSort,
}: {
  physicians: PhysicianOption[];
  defaultPhysician?: string;
  defaultSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/review-queue?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-medical-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
      <Select
        label="Ordering physician"
        value={defaultPhysician ?? ""}
        onChange={(e) => update("physician", e.target.value)}
      >
        <option value="">All physicians</option>
        {physicians.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>

      <Select
        label="Wait time sort"
        value={defaultSort ?? "longest"}
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="longest">Longest waiting first</option>
        <option value="newest">Newest submissions first</option>
      </Select>
    </div>
  );
}
