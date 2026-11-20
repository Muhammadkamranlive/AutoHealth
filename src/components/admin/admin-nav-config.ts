import type { Permission } from "@/lib/auth/permissions";

export type AdminNavChild = {
  label: string;
  href: string;
};

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  permission: Permission;
  children?: AdminNavChild[];
};

/** Full admin navigation tree — filtered by role permissions at runtime. */
export const ADMIN_NAV_TREE: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
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
    permission: "patients:read",
    children: [
      { label: "All patients", href: "/admin/patients" },
      { label: "Register patient", href: "/admin/patients/register" },
      { label: "Search records", href: "/admin/patients?q=" },
    ],
  },
  {
    id: "orders",
    label: "Review Queue",
    href: "/admin/review-queue",
    permission: "orders:read",
    children: [
      { label: "Pending review", href: "/admin/review-queue" },
    ],
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/admin/inbox",
    permission: "inbox:read",
    children: [
      { label: "Open threads", href: "/admin/inbox" },
    ],
  },
  {
    id: "access",
    label: "Access Control",
    href: "/admin/access",
    permission: "users:read",
    children: [
      { label: "Roles matrix", href: "/admin/access" },
    ],
  },
];
