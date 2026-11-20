import type { Permission } from "@/lib/auth/permissions";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import type { SessionUser, UserRole } from "@/lib/auth/roles";
import { getRoleDisplayName } from "@/lib/auth/roles";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildEffectivePermissionSet,
  menuIsVisible,
  type MenuGrantRow,
} from "./permissions";
import type {
  AdminWorkspace,
  DashboardWidget,
  MenuAssignmentMode,
  PlatformMenuRow,
  ResolvedNavItem,
} from "./types";
import { ALL_DASHBOARD_WIDGETS, buildWorkspaceTitle } from "./types";

/** Resolve sidebar + dashboard widgets for the current admin user. */
export async function resolveAdminWorkspace(
  supabase: SupabaseClient,
  user: SessionUser
): Promise<AdminWorkspace> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("menu_mode, workspace_label, role")
    .eq("id", user.id)
    .single();

  const menuMode: MenuAssignmentMode = profile?.menu_mode ?? "role";
  const workspaceLabel = profile?.workspace_label ?? null;
  const role = (profile?.role ?? user.role) as UserRole;

  const { data: allMenus } = await supabase
    .from("platform_menus")
    .select("menu_key, label, href, icon, parent_key, permission, sort_order, widgets")
    .eq("is_active", true)
    .order("sort_order");

  const menus = (allMenus ?? []) as PlatformMenuRow[];

  let grants: MenuGrantRow[] = [];
  let customMenuKeys: string[] = [];

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
    customMenuKeys = grants.map((g) => g.menu_key);

    if (grants.length === 0) {
      grants = await fetchRoleMenuGrants(supabase, role);
    }
  } else {
    grants = await fetchRoleMenuGrants(supabase, role);
  }

  const effectiveSet = buildEffectivePermissionSet(role, menus, grants);
  const effectivePermissions = [...effectiveSet];
  const grantedSet = new Set(grants.map((g) => g.menu_key));

  // Administrator always sees every menu, even if a later seed missed role_menu_grants.
  const visible =
    role === "admin"
      ? [...menus]
      : menus.filter((m) => menuIsVisible(m, grantedSet, effectiveSet));

  const visibleKeys = new Set(visible.map((m) => m.menu_key));
  for (const m of menus) {
    if (m.parent_key && visibleKeys.has(m.menu_key) && !visibleKeys.has(m.parent_key)) {
      const parent = menus.find((p) => p.menu_key === m.parent_key);
      if (parent) {
        visible.push(parent);
        visibleKeys.add(parent.menu_key);
      }
    }
  }

  const navItems = buildNavTree(visible);
  const widgets = collectWidgets(visible);
  const roleLabel = getRoleDisplayName(role);

  return {
    workspaceTitle: buildWorkspaceTitle(roleLabel, workspaceLabel),
    menuMode,
    navItems,
    widgets: widgets.length > 0 ? widgets : defaultWidgetsForRole(role),
    customMenuKeys,
    permissions: effectivePermissions,
  };
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

function buildNavTree(menus: PlatformMenuRow[]): ResolvedNavItem[] {
  const topLevel = menus
    .filter((m) => !m.parent_key)
    .sort((a, b) => a.sort_order - b.sort_order);

  return topLevel.map((parent) => {
    const children = menus
      .filter((m) => m.parent_key === parent.menu_key)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ label: c.label, href: c.href }));

    return {
      id: parent.menu_key,
      label: parent.label,
      href: parent.href,
      icon: parent.icon,
      permission: parent.permission,
      children,
    };
  });
}

function collectWidgets(menus: PlatformMenuRow[]): DashboardWidget[] {
  const set = new Set<DashboardWidget>();
  for (const m of menus) {
    for (const w of m.widgets ?? []) {
      if (ALL_DASHBOARD_WIDGETS.includes(w as DashboardWidget)) {
        set.add(w as DashboardWidget);
      }
    }
  }
  return [...set];
}

function defaultWidgetsForRole(role: UserRole): DashboardWidget[] {
  if (role === "admin" || role === "physician") {
    return [...ALL_DASHBOARD_WIDGETS];
  }
  if (role === "care_team") {
    return [
      "stat_patients",
      "stat_pending_orders",
      "stat_open_threads",
      "chart_patients",
      "chart_activity",
    ];
  }
  return ["stat_patients"];
}

/** Fallback nav when DB tables not migrated yet. */
export function fallbackNavForRole(role: UserRole): ResolvedNavItem[] {
  const permissions = getPermissionsForRole(role);
  const can = (p: Permission) => permissions.includes(p);

  const items: ResolvedNavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/admin",
      icon: "dashboard",
      permission: "dashboard:read",
      children: [
        { label: "Overview", href: "/admin" },
        { label: "Analytics", href: "/admin#analytics" },
      ],
    },
    {
      id: "patients",
      label: "Patients",
      href: "/admin/patients",
      icon: "patients",
      permission: "patients:read",
      children: [{ label: "All patients", href: "/admin/patients" }],
    },
    {
      id: "orders",
      label: "Review Queue",
      href: "/admin/review-queue",
      icon: "orders",
      permission: "orders:read",
      children: [{ label: "Pending review", href: "/admin/review-queue" }],
    },
    {
      id: "inbox",
      label: "Inbox",
      href: "/admin/inbox",
      icon: "inbox",
      permission: "inbox:read",
      children: [{ label: "Open threads", href: "/admin/inbox" }],
    },
  ];

  if (can("users:read")) {
    items.push(
      {
        id: "users",
        label: "User Management",
        href: "/admin/users",
        icon: "users",
        permission: "users:read",
        children: [
          { label: "All users", href: "/admin/users" },
          ...(can("users:create") ? [{ label: "Create user", href: "/admin/users/new" }] : []),
        ],
      },
      {
        id: "form_builder",
        label: "Form Builder",
        href: "/admin/forms",
        icon: "forms",
        permission: "users:read",
        children: [
          { label: "All forms", href: "/admin/forms" },
          ...(can("users:create") ? [{ label: "Create form", href: "/admin/forms/new" }] : []),
        ],
      },
      {
        id: "roles",
        label: "Role Menus",
        href: "/admin/roles",
        icon: "roles",
        permission: "users:read",
        children: [],
      },
      {
        id: "access",
        label: "Permissions",
        href: "/admin/access",
        icon: "access",
        permission: "users:read",
        children: [{ label: "Matrix", href: "/admin/access" }],
      }
    );
  }

  return items.filter((i) => can(i.permission as Permission));
}
