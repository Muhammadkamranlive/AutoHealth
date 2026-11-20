import { describe, it, expect } from "vitest";
import {
  canApproveOrders,
  getAdminNavForRole,
  getPermissionsForRole,
  hasPermission,
} from "./permissions";

describe("Permission matrix", () => {
  it("admin has full access", () => {
    expect(hasPermission("admin", "patients:delete")).toBe(true);
    expect(hasPermission("admin", "users:read")).toBe(true);
    expect(getPermissionsForRole("admin").length).toBeGreaterThan(30);
  });

  it("physician can approve orders but not manage users", () => {
    expect(canApproveOrders("physician")).toBe(true);
    expect(hasPermission("physician", "orders:approve")).toBe(true);
    expect(hasPermission("physician", "users:read")).toBe(false);
  });

  it("care team can read orders but not approve", () => {
    expect(hasPermission("care_team", "orders:read")).toBe(true);
    expect(canApproveOrders("care_team")).toBe(false);
  });

  it("filters admin nav by role permissions", () => {
    const physicianNav = getAdminNavForRole("physician");
    expect(physicianNav.some((n) => n.href === "/admin/access")).toBe(false);

    const adminNav = getAdminNavForRole("admin");
    expect(adminNav.some((n) => n.href === "/admin/access")).toBe(true);
  });
});
