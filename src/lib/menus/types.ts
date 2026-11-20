/** Dashboard widget keys — controls which stats/charts appear per user menu assignment. */
export type DashboardWidget =
  | "stat_patients"
  | "stat_pending_orders"
  | "stat_open_threads"
  | "stat_approved_orders"
  | "chart_patients"
  | "chart_order_status"
  | "chart_activity";

export const ALL_DASHBOARD_WIDGETS: DashboardWidget[] = [
  "stat_patients",
  "stat_pending_orders",
  "stat_open_threads",
  "stat_approved_orders",
  "chart_patients",
  "chart_order_status",
  "chart_activity",
];

export type MenuAssignmentMode = "role" | "custom";

export type PlatformMenuRow = {
  menu_key: string;
  label: string;
  href: string;
  icon: string;
  parent_key: string | null;
  permission: string;
  sort_order: number;
  widgets: string[];
};

export type ResolvedNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  permission: string;
  children: { label: string; href: string }[];
};

export type MenuGrantInput = {
  menu_key: string;
  allowed_actions: string[];
};

export type AdminWorkspace = {
  workspaceTitle: string;
  menuMode: MenuAssignmentMode;
  navItems: ResolvedNavItem[];
  widgets: DashboardWidget[];
  customMenuKeys: string[];
  permissions: string[];
};

export function buildWorkspaceTitle(
  roleLabel: string,
  workspaceLabel: string | null
): string {
  if (workspaceLabel?.trim()) {
    return `Workspace for ${workspaceLabel.trim()}`;
  }
  return `Dashboard Portal for ${roleLabel}`;
}
