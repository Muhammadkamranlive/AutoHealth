import { redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import type { UserRole } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { RoleMenuEditor } from "./role-menu-editor";

export default async function RoleMenusPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const [{ data: allMenus }, { data: grants }] = await Promise.all([
    supabase
      .from("platform_menus")
      .select("menu_key, label, parent_key, permission")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("role_menu_grants").select("role, menu_key, allowed_actions"),
  ]);

  const roleGrants: Record<string, { menu_key: string; allowed_actions?: string[] | null }[]> = {};
  for (const g of grants ?? []) {
    const role = g.role as string;
    if (!roleGrants[role]) roleGrants[role] = [];
    roleGrants[role].push({
      menu_key: g.menu_key,
      allowed_actions: g.allowed_actions,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
          Role menu assignment
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Assign menus per role and control create, update, delete, and approve access on each menu.
        </p>
      </div>
      <RoleMenuEditor allMenus={allMenus ?? []} roleGrants={roleGrants} />
    </div>
  );
}
