"use client";

import { useTransition, useState } from "react";
import type { UserRole } from "@/lib/db";
import { getRoleDisplayName, ALL_ROLES, ADMIN_ROLE_LOCKED_MESSAGE } from "@/lib/auth";
import { Button, FormCard, LoadingOverlay, Select } from "@/components/ui";
import {
  MenuGrantEditor,
  buildGrantStateFromRows,
  grantStateToPayload,
  type MenuGrantState,
  type MenuOption,
} from "@/components/admin/menu-grant-editor";
import { updateRoleMenus } from "../users/actions";

export function RoleMenuEditor({
  allMenus,
  roleGrants,
}: {
  allMenus: MenuOption[];
  roleGrants: Record<string, { menu_key: string; allowed_actions?: string[] | null }[]>;
}) {
  const staffRoles = ALL_ROLES.filter(
    (r) => r === "admin" || r === "physician" || r === "care_team"
  );

  const [selectedRole, setSelectedRole] = useState<UserRole>("care_team");
  const [grantState, setGrantState] = useState<MenuGrantState>(() =>
    buildGrantStateFromRows(roleGrants[selectedRole] ?? [])
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function onRoleChange(role: UserRole) {
    setSelectedRole(role);
    setGrantState(buildGrantStateFromRows(roleGrants[role] ?? []));
    setMessage("");
  }

  const isAdminRole = selectedRole === "admin";

  function save() {
    if (isAdminRole) return;
    setMessage("");
    startTransition(async () => {
      try {
        await updateRoleMenus(selectedRole, grantStateToPayload(grantState));
        setMessage("Saved successfully");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <FormCard>
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Role"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="min-w-[200px]"
          >
            {staffRoles.map((r) => (
              <option key={r} value={r}>{getRoleDisplayName(r)}</option>
            ))}
          </Select>
          <Button type="button" onClick={save} disabled={pending || isAdminRole}>
            Save role menus
          </Button>
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {isAdminRole
            ? ADMIN_ROLE_LOCKED_MESSAGE + " Administrators always have every menu."
            : "Assign menus and choose what each role can do: view, create, update, delete, or approve. Read is always included when a menu is enabled."}
        </p>

        {message && (
          <p className={`mt-3 text-sm ${message.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <div className={`mt-6 ${isAdminRole ? "pointer-events-none opacity-60" : ""}`}>
          <MenuGrantEditor allMenus={allMenus} grantState={grantState} onChange={setGrantState} />
        </div>
      </FormCard>
    </>
  );
}
