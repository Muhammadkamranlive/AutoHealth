"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_ROLES, getRoleDisplayName, type UserRole } from "@/lib/auth";
import { Badge, Input, Select } from "@/components/ui";
import { displayName } from "@/lib/admin/user-workspace";

export type DirectoryUser = {
  id: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  menu_mode: string | null;
  workspace_label: string | null;
  profile_completion_percent: number | null;
  created_at: string;
};

export function UsersDirectory({
  users,
  canCreate,
  canUpdate,
  compact = false,
}: {
  users: DirectoryUser[];
  canCreate: boolean;
  canUpdate: boolean;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (role !== "all" && user.role !== role) return false;
      if (!q) return true;
      const hay = `${user.first_name ?? ""} ${user.last_name ?? ""} ${user.email} ${user.workspace_label ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, role]);

  return (
    <div className="space-y-5">
      {!compact && (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {users.length} accounts · Open any user to see their dashboard and records
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/users/new"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-medical-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-medical-700 sm:w-auto"
          >
            + Create user
          </Link>
        )}
      </div>
      )}
      {compact && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-medical-950 dark:text-white">All users</h2>
            <p className="text-sm text-slate-500">Click a person to open their workspace</p>
          </div>
          <Link href="/admin/users" className="text-sm font-semibold text-medical-600 hover:text-medical-800">
            View all →
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input
          label="Search"
          placeholder="Name, email, workspace…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {getRoleDisplayName(r)}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-medical-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="table-scroll">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-medical-100 bg-medical-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 sm:px-6">Name</th>
                <th className="px-4 py-3 sm:px-6">Role</th>
                <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Profile</th>
                <th className="px-4 py-3 sm:px-6">Access</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-medical-50 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 sm:px-6">
                    <Link href={`/admin/users/${row.id}`} className="block min-h-11 py-1">
                      <p className="font-medium text-medical-900 dark:text-white">{displayName(row)}</p>
                      <p className="truncate text-xs text-slate-500">{row.email}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <Badge variant={row.role === "admin" ? "warning" : "info"}>
                      {getRoleDisplayName(row.role)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell sm:px-6">
                    <span className="tabular-nums text-slate-600 dark:text-slate-400">
                      {row.profile_completion_percent ?? 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/users/${row.id}`} className="font-semibold text-medical-600 hover:text-medical-800">
                        View workspace
                      </Link>
                      {canUpdate && (
                        <Link href={`/admin/users/${row.id}/edit`} className="font-medium text-slate-500 hover:text-medical-700">
                          Edit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-slate-500">No users match this search.</p>
        )}
      </div>
    </div>
  );
}
