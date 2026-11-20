import type { UserRole } from "@/lib/db";

/** CRUD + approve actions on platform resources. */
export type PermissionAction = "read" | "create" | "update" | "delete" | "approve";

export type PermissionResource =
  | "dashboard"
  | "patients"
  | "orders"
  | "inbox"
  | "messages"
  | "partners"
  | "billing"
  | "users"
  | "audit"
  | "settings";

export type Permission = `${PermissionResource}:${PermissionAction}`;

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
];

export const PERMISSION_RESOURCES: PermissionResource[] = [
  "dashboard",
  "patients",
  "orders",
  "inbox",
  "messages",
  "partners",
  "billing",
  "users",
  "audit",
  "settings",
];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
};

export const PERMISSION_RESOURCE_LABELS: Record<PermissionResource, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  orders: "Orders",
  inbox: "Inbox",
  messages: "Messages",
  partners: "Partners",
  billing: "Billing",
  users: "Users & Roles",
  audit: "Audit Log",
  settings: "Settings",
};

function perm(resource: PermissionResource, action: PermissionAction): Permission {
  return `${resource}:${action}`;
}

function resourcePerms(
  resource: PermissionResource,
  actions: PermissionAction[]
): Permission[] {
  return actions.map((action) => perm(resource, action));
}

const FULL: PermissionAction[] = ["read", "create", "update", "delete", "approve"];
const READ = ["read"] as PermissionAction[];
const READ_UPDATE = ["read", "update"] as PermissionAction[];
const READ_APPROVE = ["read", "approve"] as PermissionAction[];

/** Role → permission matrix (source of truth for menu + server guards). */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  patient: [],
  partner: [],
  partner_staff: [],

  care_team: [
    ...resourcePerms("dashboard", READ),
    ...resourcePerms("patients", ["read", "create"] as PermissionAction[]),
    ...resourcePerms("orders", READ),
    ...resourcePerms("inbox", READ_UPDATE),
    ...resourcePerms("messages", READ_UPDATE),
    ...resourcePerms("settings", READ),
  ],

  physician: [
    ...resourcePerms("dashboard", READ),
    ...resourcePerms("patients", ["read", "create", "update"] as PermissionAction[]),
    ...resourcePerms("orders", READ_APPROVE),
    ...resourcePerms("inbox", READ_UPDATE),
    ...resourcePerms("messages", READ_UPDATE),
    ...resourcePerms("billing", ["read", "create", "update"] as PermissionAction[]),
    ...resourcePerms("audit", READ),
    ...resourcePerms("settings", READ),
  ],

  admin: PERMISSION_RESOURCES.flatMap((resource) => resourcePerms(resource, FULL)),
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Admin sidebar items gated by read permission on each resource. */
export const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    permission: perm("dashboard", "read"),
    description: "Overview & metrics",
  },
  {
    href: "/admin/patients",
    label: "Patients",
    permission: perm("patients", "read"),
    description: "Patient records",
  },
  {
    href: "/admin/review-queue",
    label: "Review Queue",
    permission: perm("orders", "read"),
    description: "Pending order reviews",
  },
  {
    href: "/admin/inbox",
    label: "Inbox",
    permission: perm("inbox", "read"),
    description: "Message threads",
  },
  {
    href: "/admin/billing-plans",
    label: "Billing Plans",
    permission: perm("billing", "read"),
    description: "Membership pricing",
  },
  {
    href: "/admin/access",
    label: "Access Control",
    permission: perm("users", "read"),
    description: "Roles & permissions",
  },
] as const;

export function getAdminNavForRole(role: UserRole) {
  return ADMIN_NAV_ITEMS.filter((item) => hasPermission(role, item.permission));
}

export function canApproveOrders(role: UserRole): boolean {
  return hasPermission(role, perm("orders", "approve"));
}
