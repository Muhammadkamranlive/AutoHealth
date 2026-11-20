import type { UserRole } from "@/lib/db";

export type { UserRole };

export const INTERNAL_ROLES: UserRole[] = ["physician", "care_team", "admin"];

export const PARTNER_ROLES: UserRole[] = ["partner", "partner_staff"];

export const ALL_ROLES: UserRole[] = [
  "patient",
  ...INTERNAL_ROLES,
  ...PARTNER_ROLES,
];

export function isInternalRole(role: UserRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function isPartnerRole(role: UserRole): boolean {
  return PARTNER_ROLES.includes(role);
}

export { canApproveOrders } from "./permissions";

export function canAccessAdminPortal(role: UserRole): boolean {
  return isInternalRole(role);
}

export function canAccessPatientPortal(role: UserRole): boolean {
  return role === "patient";
}

export function canAccessPartnerPortal(role: UserRole): boolean {
  return isPartnerRole(role);
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}

export function getPortalForRole(role: UserRole): "admin" | "patient" | "partner" | null {
  if (canAccessAdminPortal(role)) return "admin";
  if (canAccessPatientPortal(role)) return "patient";
  if (canAccessPartnerPortal(role)) return "partner";
  return null;
}

export const ADMIN_ROLE_LOCKED_MESSAGE =
  "The Administrator role cannot be changed.";

export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    patient: "Patient",
    physician: "Physician",
    care_team: "Care Team",
    admin: "Administrator",
    partner: "Partner",
    partner_staff: "Partner Staff",
  };
  return names[role];
}
