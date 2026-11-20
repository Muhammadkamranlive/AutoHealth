"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/db";
import { ALL_ROLES, ADMIN_ROLE_LOCKED_MESSAGE, INTERNAL_ROLES, getRoleDisplayName } from "@/lib/auth";
import { Button, FormActions, FormCard, FormGrid, Input, LoadingOverlay, Select } from "@/components/ui";
import {
  MenuGrantEditor,
  buildGrantStateFromRows,
  grantStateToPayload,
  type MenuGrantState,
  type MenuOption,
} from "@/components/admin/menu-grant-editor";
import { updateStaffUser } from "./actions";

export function EditUserForm({
  userId,
  profile,
  allMenus,
  currentMenuGrants,
}: {
  userId: string;
  profile: {
    email: string;
    role: UserRole;
    first_name: string | null;
    last_name: string | null;
    workspace_label: string | null;
    menu_mode: "role" | "custom";
  };
  allMenus: MenuOption[];
  currentMenuGrants: { menu_key: string; allowed_actions?: string[] | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [role, setRole] = useState(profile.role);
  const [workspaceLabel, setWorkspaceLabel] = useState(profile.workspace_label ?? "");
  const [menuMode, setMenuMode] = useState<"role" | "custom">(profile.menu_mode);
  const [grantState, setGrantState] = useState<MenuGrantState>(() =>
    buildGrantStateFromRows(currentMenuGrants)
  );

  const isAdminAccount = profile.role === "admin";
  const editableRoles = isAdminAccount
    ? (["admin"] as UserRole[])
    : ALL_ROLES.filter((r) => r !== "admin");
  const showMenuEditor = !isAdminAccount && INTERNAL_ROLES.includes(role);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateStaffUser(userId, {
          role,
          firstName,
          lastName,
          workspaceLabel,
          menuMode,
          customMenuGrants: menuMode === "custom" ? grantStateToPayload(grantState) : [],
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard title="Profile" description={profile.email}>
          <FormGrid className="mt-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </FormGrid>
          <FormGrid className="mt-4">
            <Select
              label="Role"
              value={role}
              disabled={isAdminAccount}
              onChange={(e) => setRole(e.target.value as UserRole)}
              hint={isAdminAccount ? ADMIN_ROLE_LOCKED_MESSAGE : undefined}
            >
              {editableRoles.map((r) => (
                <option key={r} value={r}>{getRoleDisplayName(r)}</option>
              ))}
            </Select>
            <Input
              label="Workspace label"
              placeholder="e.g. Care Team — Intake"
              value={workspaceLabel}
              onChange={(e) => setWorkspaceLabel(e.target.value)}
            />
          </FormGrid>
        </FormCard>

        {showMenuEditor && (
        <FormCard
          title="Menu & operation permissions"
          description="Role-based menus inherit from the role. Custom menus pick pages and CRUD actions per user."
        >

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" checked={menuMode === "role"} onChange={() => setMenuMode("role")} />
              Role-based menus
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" checked={menuMode === "custom"} onChange={() => setMenuMode("custom")} />
              Custom menus for this user
            </label>
          </div>

          {menuMode === "custom" && (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
              <MenuGrantEditor allMenus={allMenus} grantState={grantState} onChange={setGrantState} />
            </div>
          )}
        </FormCard>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button type="submit" disabled={pending}>Save changes</Button>
          <Link href={`/admin/users/${userId}`} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            Back to workspace
          </Link>
        </FormActions>
      </form>
    </>
  );
}
