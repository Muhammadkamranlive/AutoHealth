"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/db";
import { ALL_ROLES, getRoleDisplayName } from "@/lib/auth";
import { Button, FormActions, FormCard, FormGrid, Input, LoadingOverlay, Select } from "@/components/ui";
import { createStaffUser } from "./actions";

const STAFF_ROLES = ALL_ROLES.filter(
  (r) => r === "admin" || r === "physician" || r === "care_team"
);

export function CreateUserForm({ canCreate = true }: { canCreate?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("care_team");
  const [workspaceLabel, setWorkspaceLabel] = useState("");
  const [menuMode, setMenuMode] = useState<"role" | "custom">("role");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setError("");
    startTransition(async () => {
      try {
        const id = await createStaffUser({
          email,
          password,
          firstName,
          lastName,
          role,
          workspaceLabel,
          menuMode,
        });
        router.push(`/admin/users/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user");
      }
    });
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <FormCard>
          <fieldset disabled={!canCreate} className="space-y-5 disabled:opacity-60">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            <FormGrid>
              <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
              <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
            </FormGrid>
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{getRoleDisplayName(r)}</option>
              ))}
            </Select>
            <Input
              label="Workspace label (optional)"
              placeholder="e.g. Intake Coordinator"
              value={workspaceLabel}
              onChange={(e) => setWorkspaceLabel(e.target.value)}
              hint='Shown as "Workspace for [label]" on their dashboard'
            />
            <Select label="Menu assignment" value={menuMode} onChange={(e) => setMenuMode(e.target.value as "role" | "custom")}>
              <option value="role">Use role-based menus</option>
              <option value="custom">Custom menus (assign after create)</option>
            </Select>
          </fieldset>
        </FormCard>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          {canCreate && <Button type="submit" disabled={pending}>Create user</Button>}
          <Link href="/admin/users" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </Link>
        </FormActions>
      </form>
    </>
  );
}
