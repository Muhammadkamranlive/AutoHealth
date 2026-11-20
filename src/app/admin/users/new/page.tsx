import { redirect } from "next/navigation";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/auth/errors";
import { getSessionUser, requireAnyPermission, getEffectivePermissions } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "../create-user-form";

export default async function NewUserPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requireAnyPermission(supabase, ["users:read", "users:create"]);
  } catch {
    redirect("/admin?error=no_permission");
  }

  const permissions = await getEffectivePermissions(supabase, user);
  const canCreate = permissions.includes("users:create");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
          Create staff user
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Assign a role and optionally a custom workspace label. Custom menus can be configured after creation.
        </p>
      </div>
      {!canCreate && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          View-only access — {PERMISSION_DENIED_MESSAGE}
        </p>
      )}
      <CreateUserForm canCreate={canCreate} />
    </div>
  );
}
