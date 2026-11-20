import type { UserRole } from "@/lib/db";
import {
  canAccessAdminPortal,
  canAccessPartnerPortal,
  canAccessPatientPortal,
} from "./roles";

/** Route prefix each role is allowed to access. */
export function getRoleHomePath(role: UserRole): string {
  if (canAccessAdminPortal(role)) return "/admin";
  if (canAccessPartnerPortal(role)) return "/partner";
  if (canAccessPatientPortal(role)) return "/dashboard";
  return "/login";
}

const PATIENT_ROUTE_PREFIXES = [
  "/dashboard",
  "/orders",
  "/messages",
  "/documents",
  "/billing",
  "/settings",
  "/profile",
];

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/admin")) {
    return canAccessAdminPortal(role);
  }
  if (pathname.startsWith("/partner")) {
    return canAccessPartnerPortal(role);
  }
  if (PATIENT_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return canAccessPatientPortal(role);
  }
  return false;
}

export function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth")
  );
}

/** Routes accessible without authentication. */
export function isPublicRoute(pathname: string): boolean {
  return pathname === "/" || isAuthRoute(pathname);
}
