"use client";

import { useState, useTransition } from "react";
import { ALL_ROLES, getRoleDisplayName } from "@/lib/auth";
import type { UserRole } from "@/lib/db";
import {
  updateFormTemplate,
  assignFormToRole,
  assignFormToUser,
  removeFormAssignment,
  deleteFormTemplate,
} from "../actions";
import { FormBuilder } from "@/components/form-builder/form-builder";
import { Button, FormActions, FormCard, Input, LoadingOverlay, Textarea } from "@/components/ui";
import { parseFormSchema, type FormSchema } from "@/lib/forms/types";
import { useRouter } from "next/navigation";

type Assignment = {
  id: string;
  assignment_type: string;
  role: UserRole | null;
  user_id: string | null;
};

type StaffUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
};

export function FormEditorClient({
  formId,
  initial,
  assignments,
  staffUsers,
}: {
  formId: string;
  initial: {
    title: string;
    description: string | null;
    target_roles: UserRole[];
    schema: unknown;
    is_active: boolean;
  };
  assignments: Assignment[];
  staffUsers: StaffUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"builder" | "assign">("builder");
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(initial.target_roles ?? []);
  const [schema, setSchema] = useState<FormSchema>(parseFormSchema(initial.schema));
  const [isActive, setIsActive] = useState(initial.is_active);
  const [message, setMessage] = useState("");

  const staffRoles = ALL_ROLES.filter((r) => r !== "admin");
  const assignableRoles = ALL_ROLES.filter((r) =>
    ["physician", "care_team", "patient", "partner", "partner_staff"].includes(r)
  );

  function toggleTargetRole(role: UserRole) {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function save() {
    setMessage("");
    startTransition(async () => {
      try {
        await updateFormTemplate(formId, { title, description, targetRoles, schema, isActive });
        setMessage("Saved successfully");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function assignRole(role: UserRole) {
    startTransition(async () => {
      await assignFormToRole(formId, role);
      router.refresh();
    });
  }

  function assignUser(userId: string) {
    startTransition(async () => {
      await assignFormToUser(formId, userId);
      router.refresh();
    });
  }

  const assignedUserIds = new Set(
    assignments.filter((a) => a.assignment_type === "user").map((a) => a.user_id)
  );
  const unassignedUsers = staffUsers.filter((u) => !assignedUserIds.has(u.id));

  function removeAssignment(id: string) {
    startTransition(async () => {
      await removeFormAssignment(id, formId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this form permanently?")) return;
    startTransition(async () => {
      await deleteFormTemplate(formId);
      router.push("/admin/forms");
    });
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(["builder", "assign"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
                tab === t
                  ? "bg-medical-600 text-white"
                  : "bg-medical-50 text-medical-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t === "builder" ? "Form builder" : "Assignments"}
            </button>
          ))}
        </div>

        {tab === "builder" ? (
          <>
            <FormCard title="Form settings">
              <div className="mt-4 space-y-4">
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Active (visible to assigned users)
                </label>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Target roles</p>
                  <p className="mb-2 text-xs text-slate-500">Users with these roles automatically see this form as a profile task.</p>
                  <div className="flex flex-wrap gap-3">
                    {assignableRoles.map((role) => (
                      <label key={role} className="flex items-center gap-2 rounded-xl border border-medical-100 px-3 py-2 text-sm dark:border-slate-700">
                        <input type="checkbox" checked={targetRoles.includes(role)} onChange={() => toggleTargetRole(role)} />
                        {getRoleDisplayName(role)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </FormCard>
            <FormBuilder initialSchema={schema} onChange={setSchema} />
          </>
        ) : (
          <>
          <FormCard title="Role assignments" description="Explicitly assign this form to roles in addition to target roles.">
            <div className="mt-4 flex flex-wrap gap-2">
              {staffRoles.map((role) => {
                const assigned = assignments.some((a) => a.assignment_type === "role" && a.role === role);
                return (
                  <Button
                    key={role}
                    type="button"
                    size="sm"
                    variant={assigned ? "secondary" : "outline"}
                    onClick={() => !assigned && assignRole(role)}
                    disabled={assigned || pending}
                  >
                    {assigned ? "✓ " : "+ "}{getRoleDisplayName(role)}
                  </Button>
                );
              })}
            </div>
          </FormCard>

          <FormCard title="User assignments" description="Assign to specific users regardless of role.">
            {unassignedUsers.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {unassignedUsers.map((u) => (
                  <Button
                    key={u.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => assignUser(u.id)}
                    disabled={pending}
                  >
                    + {u.first_name || u.last_name ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : u.email}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">All users are already assigned.</p>
            )}
            {assignments.length > 0 && (
              <ul className="mt-4 space-y-2">
                {assignments.map((a) => {
                  const user = a.user_id ? staffUsers.find((u) => u.id === a.user_id) : null;
                  return (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border border-medical-100 px-3 py-2 text-sm dark:border-slate-700">
                      <span>
                        {a.assignment_type === "role" && a.role
                          ? getRoleDisplayName(a.role)
                          : user
                            ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email
                            : `User ${a.user_id?.slice(0, 8)}…`}
                      </span>
                      <button type="button" className="text-red-600" onClick={() => removeAssignment(a.id)}>Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </FormCard>
          </>
        )}

        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
        )}

        <FormActions>
          <Button type="button" onClick={save} disabled={pending}>Save form</Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>Delete</Button>
        </FormActions>
      </div>
    </>
  );
}
