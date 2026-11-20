import { redirect, notFound } from "next/navigation";
import { getSessionUser, requirePermission, getEffectivePermissions } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { loadUserWorkspaceSnapshot } from "@/lib/admin/user-workspace";
import { UserWorkspaceView } from "@/components/admin/user-workspace-view";

export default async function UserWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const snapshot = await loadUserWorkspaceSnapshot(id);
  if (!snapshot) notFound();

  const permissions = await getEffectivePermissions(supabase, user);

  return (
    <UserWorkspaceView snapshot={snapshot} canEdit={permissions.includes("users:update")} />
  );
}
