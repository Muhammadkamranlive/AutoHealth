import { redirect, notFound } from "next/navigation";
import type { UserRole } from "@/lib/db";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { EditUserForm } from "../../edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:update");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, first_name, last_name, workspace_label, menu_mode")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const [{ data: allMenus }, { data: userGrants }] = await Promise.all([
    supabase
      .from("platform_menus")
      .select("menu_key, label, parent_key, permission")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("user_menu_grants")
      .select("menu_key, allowed_actions")
      .eq("user_id", id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
          Edit user
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {profile.role === "admin"
            ? "Administrator accounts can update profile details only. The Administrator role cannot be changed."
            : "Update role, workspace title, and assign custom menus with per-operation permissions."}
        </p>
      </div>
      <EditUserForm
        userId={id}
        profile={{
          ...profile,
          role: profile.role as UserRole,
          menu_mode: (profile.menu_mode as "role" | "custom") ?? "role",
        }}
        allMenus={allMenus ?? []}
        currentMenuGrants={userGrants ?? []}
      />
    </div>
  );
}
