import { redirect } from "next/navigation";
import { getSessionUser, requirePermission, getEffectivePermissions } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UsersDirectory, type DirectoryUser } from "@/components/admin/users-directory";
import type { UserRole } from "@/lib/db";

export default async function UsersPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const permissions = await getEffectivePermissions(supabase, user);
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("profiles")
    .select("id, email, role, first_name, last_name, menu_mode, workspace_label, profile_completion_percent, created_at")
    .order("created_at", { ascending: false });

  const users: DirectoryUser[] = (rows ?? []).map((row) => ({
    ...row,
    role: row.role as UserRole,
  }));

  return (
    <UsersDirectory
      users={users}
      canCreate={permissions.includes("users:create")}
      canUpdate={permissions.includes("users:update")}
    />
  );
}
