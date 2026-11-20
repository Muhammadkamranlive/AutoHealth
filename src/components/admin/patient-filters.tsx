"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select, Button } from "@/components/ui";

export type PatientListFilters = {
  q?: string;
  physician?: string;
  plan?: string;
  status?: string;
  sort?: string;
  page?: string;
};

type PhysicianOption = { id: string; name: string };

export function PatientFiltersBar({
  defaultFilters,
  physicians,
  planOptions,
}: {
  defaultFilters: PatientListFilters;
  physicians: PhysicianOption[];
  planOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/patients?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    update("q", q);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-medical-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Search name or email…"
          defaultValue={defaultFilters.q ?? ""}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Physician"
          value={defaultFilters.physician ?? ""}
          onChange={(e) => update("physician", e.target.value)}
        >
          <option value="">All physicians</option>
          {physicians.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>

        <Select
          label="Active plan"
          value={defaultFilters.plan ?? ""}
          onChange={(e) => update("plan", e.target.value)}
        >
          <option value="">All medications</option>
          {planOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>

        <Select
          label="Status"
          value={defaultFilters.status ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All patients</option>
          <option value="active_plan">Active treatment</option>
          <option value="no_plan">No active plan</option>
          <option value="pending_review">Pending order review</option>
        </Select>

        <Select
          label="Sort by"
          value={defaultFilters.sort ?? "recent"}
          onChange={(e) => update("sort", e.target.value)}
        >
          <option value="recent">Recently updated</option>
          <option value="enrolled">Newest enrolled</option>
          <option value="name">Name (A–Z)</option>
        </Select>
      </div>
    </div>
  );
}

export function PatientPagination({
  page,
  totalPages,
  totalCount,
  filters,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  filters: PatientListFilters;
}) {
  const router = useRouter();

  function goTo(p: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.physician) params.set("physician", filters.physician);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.status) params.set("status", filters.status);
    if (filters.sort) params.set("sort", filters.sort);
    if (p > 1) params.set("page", String(p));
    router.push(`/admin/patients?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return (
      <p className="text-sm text-slate-500">
        Showing {totalCount} patient{totalCount !== 1 ? "s" : ""}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {totalCount} patients
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => goTo(page - 1)}>
          Previous
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
