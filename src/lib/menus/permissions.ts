import {
  getPermissionsForRole,
  hasPermission,
  PERMISSION_ACTIONS,
  type Permission,
  type PermissionAction,
  type PermissionResource,
} from "@/lib/auth/permissions";
import type { SessionUser, UserRole } from "@/lib/auth/roles";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuAssignmentMode, PlatformMenuRow } from "./types";

export type MenuGrantRow = {
  menu_key: string;
  allowed_actions: string[];
};

const VALID_ACTIONS = new Set<string>(PERMISSION_ACTIONS);

export function parseMenuResource(permission: string): PermissionResource | null {
  const [resource] = permission.split(":");
  if (!resource) return null;
  return resource as PermissionResource;
}

export function grantActionsToPermissions(
  menu: Pick<PlatformMenuRow, "permission">,
  allowedActions: string[]
): Permission[] {
  const resource = parseMenuResource(menu.permission);
  if (!resource) return [];

  const perms: Permission[] = [];
  for (const action of allowedActions) {
    if (!VALID_ACTIONS.has(action)) continue;
    perms.push(`${resource}:${action}` as Permission);
  }
  return perms;
}

export function actionsForMenu(menuKey: string, permission: string): PermissionAction[] {
  const resource = parseMenuResource(permission);
  const base: PermissionAction[] = ["read", "create", "update", "delete"];
  if (resource === "orders" || menuKey.startsWith("orders")) {
    return [...base, "approve"];
  }
  return base;
}

export function menuIsVisible(
  menu: PlatformMenuRow,
  grantedKeys: Set<string>,
  effectivePermissions: Set<Permission>
): boolean {
  if (!grantedKeys.has(menu.menu_key)) return false;

  const resource = parseMenuResource(menu.permission);
  if (!resource) return true;

  // Exact permission (e.g. users:create on Create user menu)
  if (effectivePermissions.has(menu.permission as Permission)) return true;

  // Read-only (or other) grants map to resource:action — show menu if user has any permission on this resource
  return PERMISSION_ACTIONS.some((action) =>
    effectivePermissions.has(`${resource}:${action}` as Permission)
  );
}

export function buildEffectivePermissionSet(
  role: UserRole,
  menus: PlatformMenuRow[],
  grants: MenuGrantRow[]
): Set<Permission> {
  if (role === "admin") {
    return new Set(getPermissionsForRole("admin"));
  }

  const menusByKey = new Map(menus.map((m) => [m.menu_key, m]));
  const effective = new Set<Permission>();

  for (const grant of grants) {
    const menu = menusByKey.get(grant.menu_key);
    if (!menu) continue;
    for (const perm of grantActionsToPermissions(menu, grant.allowed_actions)) {
      effective.add(perm);
    }
  }

  if (effective.size === 0) {
    for (const perm of getPermissionsForRole(role)) {
      effective.add(perm);
    }
  }

  return effective;
}

export async function resolveUserPermissions(
  supabase: SupabaseClient,
  user: SessionUser
): Promise<Permission[]> {
  if (user.role === "admin") {
    return getPermissionsForRole("admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("menu_mode, role")
    .eq("id", user.id)
    .single();

  const menuMode: MenuAssignmentMode = profile?.menu_mode ?? "role";
  const role = (profile?.role ?? user.role) as UserRole;

  const { data: allMenus } = await supabase
    .from("platform_menus")
    .select("menu_key, label, href, icon, parent_key, permission, sort_order, widgets")
    .eq("is_active", true);

  const menus = (allMenus ?? []) as PlatformMenuRow[];
  if (menus.length === 0) {
    return getPermissionsForRole(role);
  }

  let grants: MenuGrantRow[] = [];

  if (menuMode === "custom") {
    const { data: userGrants } = await supabase
      .from("user_menu_grants")
      .select("menu_key, allowed_actions")
      .eq("user_id", user.id);

    grants =
      userGrants?.map((g) => ({
        menu_key: g.menu_key,
        allowed_actions: g.allowed_actions ?? ["read"],
      })) ?? [];

    if (grants.length === 0) {
      grants = await fetchRoleMenuGrants(supabase, role);
    }
  } else {
    grants = await fetchRoleMenuGrants(supabase, role);
  }

  return [...buildEffectivePermissionSet(role, menus, grants)];
}

async function fetchRoleMenuGrants(
  supabase: SupabaseClient,
  role: UserRole
): Promise<MenuGrantRow[]> {
  const { data, error } = await supabase
    .from("role_menu_grants")
    .select("menu_key, allowed_actions")
    .eq("role", role);

  if (error || !data) return [];

  return data.map((g) => ({
    menu_key: g.menu_key,
    allowed_actions: g.allowed_actions ?? ["read"],
  }));
}

export function hasEffectivePermission(
  permissions: Permission[],
  permission: Permission
): boolean {
  return permissions.includes(permission);
}

/** Legacy helper — checks role matrix only. Prefer hasEffectivePermission with resolved permissions. */
export function hasRoleOrEffectivePermission(
  role: UserRole,
  permissions: Permission[],
  permission: Permission
): boolean {
  if (role === "admin") return true;
  if (permissions.length > 0) {
    return hasEffectivePermission(permissions, permission);
  }
  return hasPermission(role, permission);
}
