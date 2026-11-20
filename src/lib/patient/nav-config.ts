import type { ComponentType, SVGProps } from "react";
import {
  IconDashboard,
  IconForms,
  IconInbox,
  IconQueue,
  IconShield,
} from "@/components/admin/admin-icons";

export type PatientNavItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children?: { label: string; href: string }[];
};

export const PATIENT_NAV: PatientNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { id: "tasks", label: "Profile Tasks", href: "/profile/tasks", icon: IconForms },
  {
    id: "orders",
    label: "Orders",
    href: "/orders",
    icon: IconQueue,
    children: [
      { label: "Order history", href: "/orders" },
      { label: "Request refill", href: "/orders/refill" },
    ],
  },
  { id: "messages", label: "Messages", href: "/messages", icon: IconInbox },
  { id: "documents", label: "Documents", href: "/documents", icon: IconShield },
  { id: "billing", label: "Billing", href: "/billing", icon: IconDashboard },
  { id: "settings", label: "Settings", href: "/settings", icon: IconShield },
];

export const PATIENT_WORKSPACE_TITLE = "Patient Portal";
