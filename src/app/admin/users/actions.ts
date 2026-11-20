"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/db";
import type { MenuGrantInput } from "@/lib/menus/types";
import { requirePermission } from "@/lib/auth/server";
import { ADMIN_ROLE_LOCKED_MESSAGE } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createStaffUser(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  workspaceLabel?: string;
  menuMode?: "role" | "custom";
}) {
  const supabase = await createClient();
  const admin = await requirePermission(supabase, "users:create");

  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      first_name: formData.firstName,
      last_name: formData.lastName,
    },
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("User creation failed");

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: authData.user.id,
    email: formData.email.trim().toLowerCase(),
    role: formData.role,
    first_name: formData.firstName,
    last_name: formData.lastName,
    phone: null,
    menu_mode: formData.menuMode ?? "role",
    workspace_label: formData.workspaceLabel?.trim() || null,
    profile_completion_percent: 0,
    profile_completed_at: null,
  });

  if (profileError) throw new Error(profileError.message);

  await adminClient.rpc("write_audit_log", {
    p_action: "user.created",
    p_target_table: "profiles",
    p_target_id: authData.user.id,
    p_metadata: { created_by: admin.id, role: formData.role },
  });

  revalidatePath("/admin/users");
  return authData.user.id;
}

export async function updateStaffUser(
  userId: string,
  formData: {
    role: UserRole;
    firstName: string;
    lastName: string;
    workspaceLabel?: string;
    menuMode: "role" | "custom";
    customMenuGrants?: MenuGrantInput[];
  }
) {
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (existing?.role === "admin" && formData.role !== "admin") {
    throw new Error(ADMIN_ROLE_LOCKED_MESSAGE);
  }
  if (existing?.role !== "admin" && formData.role === "admin") {
    throw new Error(ADMIN_ROLE_LOCKED_MESSAGE);
  }

  const nextRole = existing?.role === "admin" ? "admin" : formData.role;

  const { error } = await adminClient
    .from("profiles")
    .update({
      role: nextRole,
      first_name: formData.firstName,
      last_name: formData.lastName,
      workspace_label: formData.workspaceLabel?.trim() || null,
      menu_mode: existing?.role === "admin" ? "role" : formData.menuMode,
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  if (existing?.role === "admin") {
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
    return;
  }

  if (formData.menuMode === "custom" && formData.customMenuGrants) {
    await adminClient.from("user_menu_grants").delete().eq("user_id", userId);

    if (formData.customMenuGrants.length > 0) {
      const { data: session } = await supabase.auth.getUser();
      const rows = formData.customMenuGrants.map((grant) => ({
        user_id: userId,
        menu_key: grant.menu_key,
        allowed_actions: grant.allowed_actions.includes("read")
          ? grant.allowed_actions
          : ["read", ...grant.allowed_actions],
        granted_by: session.user?.id ?? null,
      }));
      const { error: grantError } = await adminClient.from("user_menu_grants").insert(rows);
      if (grantError) throw new Error(grantError.message);
    }
  } else {
    await adminClient.from("user_menu_grants").delete().eq("user_id", userId);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

export async function updateRoleMenus(role: UserRole, menuGrants: MenuGrantInput[]) {
  if (role === "admin") {
    throw new Error(ADMIN_ROLE_LOCKED_MESSAGE);
  }
  const supabase = await createClient();
  await requirePermission(supabase, "users:update");

  const adminClient = createAdminClient();

  await adminClient.from("role_menu_grants").delete().eq("role", role);

  if (menuGrants.length > 0) {
    const rows = menuGrants.map((grant) => ({
      role,
      menu_key: grant.menu_key,
      allowed_actions: grant.allowed_actions.includes("read")
        ? grant.allowed_actions
        : ["read", ...grant.allowed_actions],
    }));
    const { error } = await adminClient.from("role_menu_grants").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin");
}
