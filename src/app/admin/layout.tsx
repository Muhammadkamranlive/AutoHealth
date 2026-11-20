import { redirect } from "next/navigation";
import { canAccessAdminPortal, getPermissionsForRole } from "@/lib/auth";
import { getSessionUser, getEffectivePermissions } from "@/lib/auth/server";
import { fallbackNavForRole, resolveAdminWorkspace } from "@/lib/menus/resolve";
import { ALL_DASHBOARD_WIDGETS, buildWorkspaceTitle } from "@/lib/menus/types";
import { getRoleDisplayName } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AdminLayoutClient } from "@/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");
  if (!canAccessAdminPortal(user.role)) redirect("/login?error=unauthorized");

  let workspace = await resolveAdminWorkspace(supabase, user).catch(() => null);

  if (!workspace || workspace.navItems.length === 0) {
    const permissions = await getEffectivePermissions(supabase, user).catch(() =>
      getPermissionsForRole(user.role)
    );
    workspace = {
      workspaceTitle: buildWorkspaceTitle(getRoleDisplayName(user.role), null),
      menuMode: "role",
      navItems: fallbackNavForRole(user.role),
      widgets: [...ALL_DASHBOARD_WIDGETS],
      customMenuKeys: [],
      permissions,
    };
  }

  return (
    <AdminLayoutClient user={user} workspace={workspace}>
      {children}
    </AdminLayoutClient>
  );
}
